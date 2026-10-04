import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, renameSync, writeFileSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, stat, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  fps: number;
  hasAudio: boolean;
}

interface VideoQuality {
  name: string;
  /**
   * ارتفاع هدف (Aspect Ratio حفظ می‌شود).
   */
  height: number;
  /**
   * سقف VBV. کیفیت اصلی با CRF تعیین می‌شود و این فقط
   * جلوی جهش ناگهانی بیتریت روی صحنه‌های سنگین را می‌گیرد.
   */
  maxrate: string;
  bufsize: string;
}

interface EncodeOptions {
  includeAudio: boolean;
  crf: number;
  jobs: number;
  outRoot: string;
  poster: boolean;
  masterOnly: boolean;
}

interface EncodedVariant {
  quality: VideoQuality;
  width: number;
  height: number;
  audio: boolean;
  bytes: number;
  duration: number;
  avgBps: number;
  peakBps: number;
}

/**
 * کیفیت‌های HLS
 *
 * height فقط ارتفاع هدف است.
 * عرض بر اساس Aspect Ratio اصلی ویدیو محاسبه می‌شود.
 */
const qualities: VideoQuality[] = [
  {
    name: '360p',
    height: 360,
    maxrate: '1200k',
    bufsize: '2400k',
  },
  {
    name: '480p',
    height: 480,
    maxrate: '2000k',
    bufsize: '4000k',
  },
  {
    name: '720p',
    height: 720,
    maxrate: '4000k',
    bufsize: '8000k',
  },
  {
    name: '1080p',
    height: 1080,
    maxrate: '6500k',
    bufsize: '13000k',
  },
];

/**
 * CRF پیش‌فرض:
 * به جای «بیتریت ثابت» (که هم حجم را بالا می‌برد و هم روی
 * صحنه‌های ساده هدر می‌دهد) کیفیت ثابت می‌گیریم و x264
 * خودش کمترین بیتریت لازم را انتخاب می‌کند.
 *
 * اندازه‌گیری روی همین سورس‌ها (مقایسه SSIM با سورس):
 *   b:v 5000k + medium  → 5.12Mbps, SSIM 0.9886   (وضعیت قبلی)
 *   CRF 21 + veryfast   → 1.92Mbps, SSIM 0.9796   ← پیش‌فرض
 *   CRF 23 + veryfast   → 1.41Mbps, SSIM 0.9748
 *   CRF 25 + veryfast   → 1.06Mbps, SSIM 0.9688
 */
const DEFAULT_CRF = 21;

/**
 * طول هر سیگمنت HLS (و هم‌زمان فاصله Keyframeها).
 *
 * ۱ ثانیه انتخاب شده چون:
 * - زمان رسیدن به فریم اول (Time To First Frame) نصف می‌شود؛
 *   چون حجم سیگمنت اول نصف است و پلیر قبل از هر چیز باید
 *   همان یک سیگمنت را کامل دانلود کند.
 * - ABR هر ۱ ثانیه یک نمونه‌ی واقعی پهنای باند می‌گیرد و
 *   سریع‌تر کیفیت را با اینترنت کاربر هم‌راستا می‌کند.
 * - در iOS/Safari هم پلیر بومی سریع‌تر خودش را با شبکه تطبیق می‌دهد.
 *
 * هزینه‌اش اندازه‌گیری شد: حدود +۱۰٪ حجم (به خاطر I-frame های
 * بیشتر) در مقابل نصف شدن زمان شروع پخش.
 */
const SEGMENT_DURATION = 1;

/**
 * نگه‌داری نسخه‌های قبلی سیگمنت‌ها
 *
 * نام فایل سیگمنت‌ها شامل هش محتواست (مثل segment_8f3a2c10_00000.ts)،
 * پس URL یک فایل هیچ‌وقت با محتوای دیگری جایگزین نمی‌شود و کش
 * immutable مرورگرها امن می‌ماند.
 *
 * نسخه‌های قبلی هم چند روز نگه داشته می‌شوند تا کاربرهایی که
 * playlist قدیمی (با کش ۱ ساعته) دارند، فایل‌هایش را پیدا کنند.
 */
const SEGMENT_FILE_PATTERN = /^segment_([0-9a-f]{8})_\d+\.ts$/;
const LEGACY_SEGMENT_PATTERN = /^segment\d{5}\.ts$/;
const OLD_VERSIONS_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * اجرای command
 */
function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', data => {
      stdout += data.toString();
    });

    process.stderr.on('data', data => {
      stderr += data.toString();
    });

    process.on('error', error => {
      reject(error);
    });

    process.on('close', code => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new Error(`${command} exited with code ${code}\n${stderr}`));
    });
  });
}

/**
 * اجرای FFmpeg
 *
 * خروجی ffmpeg (بَنر + دامپ متادیتا) در حالت عادی فقط لاگ را
 * شلوغ می‌کند، پس گرفته می‌شود و تنها در صورت خطا چاپ می‌شود.
 */
function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      'ffmpeg',
      ['-hide_banner', '-loglevel', 'error', ...args],
      {
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: true,
      },
    );

    let stderr = '';

    ffmpeg.stderr.on('data', data => {
      stderr += data.toString();
    });

    ffmpeg.on('error', error => {
      reject(error);
    });

    ffmpeg.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }

      // فقط ۲۰ خط آخر نگه داشته می‌شود تا پیام خطا خوانا بماند
      const tail = stderr.trim().split('\n').slice(-20).join('\n');

      reject(new Error(`FFmpeg exited with code ${code}\n${tail}`));
    });
  });
}

/**
 * گرفتن اطلاعات ویدیوی اصلی
 *
 * (عرض، ارتفاع، مدت، نرخ فریم و وجود/عدم وجود صدا)
 */
async function getVideoInfo(inputPath: string): Promise<VideoInfo> {
  const output = await runCommand('ffprobe', [
    '-v',
    'error',

    '-show_streams',

    '-of',
    'json',

    inputPath,
  ]);

  const data = JSON.parse(output) as {
    streams?: Array<{
      codec_type?: string;
      width?: number;
      height?: number;
      duration?: string;
      avg_frame_rate?: string;
      r_frame_rate?: string;
    }>;
  };

  const streams = data.streams ?? [];

  const video = streams.find(stream => stream.codec_type === 'video');

  if (!video) {
    throw new Error(`No video stream found: ${inputPath}`);
  }

  const width = Number(video.width);
  const height = Number(video.height);

  if (!width || !height) {
    throw new Error(`Invalid video dimensions: ${inputPath}`);
  }

  return {
    width,
    height,
    duration: Number(video.duration || 0),
    fps: parseFrameRate(video.avg_frame_rate || video.r_frame_rate),
    hasAudio: streams.some(stream => stream.codec_type === 'audio'),
  };
}

/**
 * تبدیل "30000/1001" به عدد
 */
function parseFrameRate(value: string | undefined): number {
  if (!value) return 0;

  const [num, den] = value.split('/').map(Number);

  if (!num) return 0;
  if (!den) return num;

  return num / den;
}

/**
 * محاسبه ابعاد خروجی با حفظ Aspect Ratio
 *
 * مثال:
 *
 * Original:
 * 1920x800
 *
 * 360p:
 * 864x360
 *
 * 480p:
 * 1152x480
 *
 * 720p:
 * 1728x720
 *
 * 1080p:
 * 1920x800
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetHeight: number,
): {
  width: number;
  height: number;
} {
  /**
   * اگر ویدیوی اصلی از کیفیت موردنظر
   * کوچک‌تر یا مساوی باشد، Upscale نمی‌کنیم.
   */
  if (originalHeight <= targetHeight) {
    return {
      width: originalWidth - (originalWidth % 2),

      height: originalHeight - (originalHeight % 2),
    };
  }

  const aspectRatio = originalWidth / originalHeight;

  let height = targetHeight;

  let width = Math.round(height * aspectRatio);

  /**
   * H.264 بهتر است Resolution زوج داشته باشد.
   */
  width -= width % 2;
  height -= height % 2;

  return {
    width,
    height,
  };
}

/**
 * ساخت Video Filter
 *
 * فقط Scale انجام می‌شود.
 *
 * ❌ Crop نداریم.
 * ❌ تغییر Aspect Ratio نداریم.
 */
function createVideoFilter(width: number, height: number): string {
  return `scale=${width}:${height}:flags=lanczos`;
}

/**
 * محاسبه GOP بر اساس نرخ فریم
 *
 * هدف: هر Keyframe دقیقاً هر ۲ ثانیه.
 *
 * چرا مهم است؟
 * - hls_time = 2 و GOP = 2s باعث می‌شود هر سیگمنت دقیقاً ۲ ثانیه
 *   شود (نه ۲.۴ یا ۶.۴) و ABR بتواند هر ۲ ثانیه کیفیت را عوض کند.
 * - اگر GOP با طول سیگمنت هم‌راستا نباشد، ffmpeg مجبور است
 *   سیگمنت‌ها را بلندتر کند و بایت/زمان هدر می‌رود.
 */
function calculateGop(fps: number): number {
  if (!fps) return SEGMENT_DURATION * 30;

  return Math.max(1, Math.round(fps * SEGMENT_DURATION));
}

/**
 * محاسبه نسخه محتوا (Content Version) برای نام‌گذاری سیگمنت‌ها
 *
 * هش = محتوای فایل سورس + تنظیمات انکود
 *
 * یعنی:
 * - اگر محتوای ویدیو یا تنظیمات انکود عوض شود → نسخه جدید → نام فایل‌های
 *   جدید → کش immutable قبلی هیچ‌وقت محتوای اشتباه به پلیر نمی‌دهد.
 * - اگر دوباره همین سورس با همین تنظیمات انکود شود → همان نام‌ها → بدون
 *   هیچ تغییری در کش کاربران.
 */
async function computeContentVersion(
  inputPath: string,
  options: EncodeOptions,
): Promise<string> {
  const hash = createHash('sha1');

  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(inputPath);

    stream.on('data', chunk => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve());
  });

  hash.update(
    JSON.stringify({
      crf: options.crf,
      segmentDuration: SEGMENT_DURATION,
      includeAudio: options.includeAudio,
      qualities: qualities.map(quality => [quality.name, quality.height, quality.maxrate, quality.bufsize]),
    }),
  );

  return hash.digest('hex').slice(0, 8);
}

/**
 * پاک‌سازی سیگمنت‌های قدیمی
 *
 * - نام‌های قدیمی بدون هش (segment00000.ts) که دیگر استفاده نمی‌شوند.
 * - نسخه‌های قبلی هش‌دار که از بازه نگه‌داری قدیمی‌ترند.
 */
async function pruneOldSegments(qualityDir: string, currentVersion: string): Promise<void> {
  if (!existsSync(qualityDir)) return;

  const now = Date.now();

  for (const entry of await readdir(qualityDir)) {
    if (LEGACY_SEGMENT_PATTERN.test(entry)) {
      await unlink(path.join(qualityDir, entry));

      continue;
    }

    const match = SEGMENT_FILE_PATTERN.exec(entry);

    if (!match || match[1] === currentVersion) continue;

    const fileStat = await stat(path.join(qualityDir, entry));

    if (now - fileStat.mtimeMs > OLD_VERSIONS_RETENTION_MS) {
      await unlink(path.join(qualityDir, entry));
    }
  }
}

/**
 * انتقال خروجی از پوشه موقت به پوشه نهایی
 *
 * ترتیب مهم است:
 * ۱) اول خود سیگمنت‌ها (نام‌های هش‌دار جدید؛ فایل‌های قبلی دست‌نخورده می‌مانند)
 * ۲) آخر از همه playlist (که با rename اتمیک جایگزین می‌شود)
 *
 * این‌طوری در هر لحظه یا playlist قدیمی با سیگمنت‌های قدیمی سرو می‌شود
 * یا playlist جدید با سیگمنت‌های جدید — هیچ‌وقت ترکیب ناسازگار.
 */
async function moveIntoPlace(
  tempDir: string,
  outputDir: string,
  contentVersion: string,
): Promise<void> {
  for (const quality of qualities) {
    const from = path.join(tempDir, quality.name);

    if (!existsSync(from)) continue;

    const to = path.join(outputDir, quality.name);

    await mkdir(to, { recursive: true });

    const entries = await readdir(from);

    const playlists = entries.filter(entry => entry.endsWith('.m3u8'));
    const segments = entries.filter(entry => !entry.endsWith('.m3u8'));

    for (const entry of [...segments, ...playlists]) {
      await rename(path.join(from, entry), path.join(to, entry));
    }
  }

  /**
   * رده‌هایی که این بار انکود نشده‌اند (مثلاً سورس کوچک‌تر شده)
   * هم پاک‌سازی می‌شوند تا فایل قدیمی روی سرور نماند.
   */
  for (const quality of qualities) {
    await pruneOldSegments(path.join(outputDir, quality.name), contentVersion);
  }
}

/**
 * Sum کردن حجم سیگمنت‌ها + خواندن بیتریت واقعی از روی Playlist
 *
 * این عددها بعداً در master.m3u8 استفاده می‌شوند تا
 * BANDWIDTH / AVERAGE-BANDWIDTH «واقعی» باشند.
 */
async function measureVariant(
  qualityDir: string,
): Promise<{ bytes: number; duration: number; avgBps: number; peakBps: number }> {
  const playlist = await readFile(path.join(qualityDir, 'playlist.m3u8'), 'utf8');

  const lines = playlist.split('\n');

  let bytes = 0;
  let duration = 0;
  let peakBps = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const match = /^#EXTINF:([\d.]+),/.exec(lines[i].trim());

    if (!match) continue;

    const segmentDuration = Number(match[1]);
    const segmentName = lines[i + 1]?.trim();

    if (!segmentName || segmentDuration <= 0) continue;

    const segmentStat = await stat(path.join(qualityDir, segmentName));

    bytes += segmentStat.size;
    duration += segmentDuration;

    /**
     * آخرین سیگمنت هر رده معمولاً یک «تکه باقی‌مانده» کوتاه است
     * (مثلاً 0.03 ثانیه با چند کیلوبایت داده).
     *
     * اگر حجم آن را بر مدت کوتاهش تقسیم کنیم، عدد بی‌معنی
     * (چند ده مگابیت) به دست می‌آید و BANDWIDTH را خراب می‌کند؛
     * پس سیگمنت‌های خیلی کوتاه از محاسبه سقف کنار گذاشته می‌شوند
     * (ولی حجم‌شان در میانگین حساب می‌شود).
     *
     * نکته: واحد BANDWIDTH در HLS «بیت بر ثانیه» است، نه کیلوبیت.
     */
    const isFlushSegment = segmentDuration < SEGMENT_DURATION * 0.5;

    if (!isFlushSegment) {
      const segmentBps = (segmentStat.size * 8) / segmentDuration;

      peakBps = Math.max(peakBps, segmentBps);
    }
  }

  const avgBps = duration ? (bytes * 8) / duration : 0;

  return {
    bytes,
    duration,
    avgBps,
    peakBps: peakBps || avgBps,
  };
}

/**
 * Encode یک کیفیت
 */
async function encodeQuality(
  inputPath: string,
  outputDir: string,
  quality: VideoQuality,
  videoInfo: VideoInfo,
  options: EncodeOptions,
  contentVersion: string,
): Promise<EncodedVariant> {
  const qualityDir = path.join(outputDir, quality.name);

  await mkdir(qualityDir, {
    recursive: true,
  });

  const playlistPath = path.join(qualityDir, 'playlist.m3u8');

  /**
   * نام سیگمنت‌ها شامل هش محتواست تا با هر انکود جدید، URL جدید
   * ساخته شود (کش immutable هیچ‌وقت محتوای قدیمی را جای جدید نمی‌دهد).
   */
  const segmentPath = path.join(
    qualityDir,
    `segment_${contentVersion}_%05d.ts`,
  );

  const dimensions = calculateDimensions(
    videoInfo.width,
    videoInfo.height,
    quality.height,
  );

  const filter = createVideoFilter(dimensions.width, dimensions.height);

  const gop = calculateGop(videoInfo.fps);

  console.log('');

  console.log(`▶️ Encoding ${quality.name}`);

  console.log(`   Original: ${videoInfo.width}x${videoInfo.height}`);

  console.log(
    `   Output:   ${dimensions.width}x${dimensions.height} @ CRF ${options.crf}, GOP ${gop}`,
  );

  const startedAt = Date.now();

  await runFFmpeg([
    '-y',

    '-i',
    inputPath,

    // =========================
    // VIDEO
    // =========================

    '-vf',
    filter,

    '-c:v',
    'libx264',

    /**
     * veryfast + CRF:
     * به جای بیت‌ریت ثابت، کیفیت ثابت می‌گیریم تا x264 خودش
     * کمترین حجم لازم را انتخاب کند (روی همین سورس‌ها ~۵۰٪ کمتر
     * از b:v قبلی با کیفیت برابر یا بهتر).
     */
    '-preset',
    'veryfast',

    '-crf',
    String(options.crf),

    '-profile:v',
    'high',

    '-level',
    '4.1',

    '-pix_fmt',
    'yuv420p',

    /**
     * سقف VBV (فقط برای صحنه‌های خیلی سنگین)
     */
    '-maxrate',
    quality.maxrate,

    '-bufsize',
    quality.bufsize,

    // =========================
    // KEYFRAMES
    // =========================

    '-g',
    String(gop),

    '-keyint_min',
    String(gop),

    '-sc_threshold',
    '0',

    // =========================
    // AUDIO
    // (ویدیوهای پس‌زمینه باید با --mute انکود شوند: صدا در UI
    //  پخش نمی‌شود و حدود ۱۷٪ به حجم اضافه می‌کند)
    // =========================

    ...(options.includeAudio && videoInfo.hasAudio
      ? [
          '-c:a',
          'aac',

          '-b:a',
          '128k',

          '-ar',
          '48000',

          '-ac',
          '2',
        ]
      : ['-an']),

    // =========================
    // HLS
    // =========================

    '-f',
    'hls',

    '-hls_time',
    String(SEGMENT_DURATION),

    '-hls_playlist_type',
    'vod',

    /**
     * INDEPENDENT-SEGMENTS: هر سیگمنت از یک Keyframe شروع می‌شود
     * (چون sc_threshold=0 و GOP ثابت است) و پلیر می‌تواند
     * بدون دریافت سیگمنت قبلی، از هر سیگمنت شروع کند.
     */
    '-hls_flags',
    'independent_segments',

    '-hls_segment_filename',
    segmentPath,

    playlistPath,
  ]);

  const metrics = await measureVariant(qualityDir);

  console.log(
    `✅ ${quality.name} completed in ${((Date.now() - startedAt) / 1000).toFixed(
      1,
    )}s — ${(metrics.bytes / 1000000).toFixed(2)}MB, ` +
      `${(metrics.avgBps / 1000).toFixed(0)}kbps avg / ${(metrics.peakBps / 1000).toFixed(0)}kbps peak`,
  );

  return {
    quality,
    width: dimensions.width,
    height: dimensions.height,
    audio: options.includeAudio && videoInfo.hasAudio,
    ...metrics,
  };
}

/**
 * ساخت master.m3u8
 *
 * نکته مهم: ترتیب واریانت‌ها «صعودی» نوشته می‌شود
 * (از کم‌کیفیت به پرکیفیت).
 *
 * چرا؟
 * - در iOS/Safari، پلیر بومی hls.js ندارد و اولین واریانتِ لیست را
 *   به عنوان شروع انتخاب می‌کند؛ پس اولین واریانت باید سبک باشد تا
 *   ویدیو سریع شروع شود و بعد ABR خودش بالا برود.
 * - hls.js هم تخمین اولیه پهنای باند را از بیتریت اولین واریانت
 *   می‌سازد؛ اگر 1080p اول باشد، تخمین اولیه باد می‌کند.
 */
function createMasterPlaylist(
  outputDir: string,
  variants: EncodedVariant[],
): void {
  const masterPath = path.join(outputDir, 'master.m3u8');

  const orderedVariants = [...variants].sort((a, b) => a.height - b.height);

  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-INDEPENDENT-SEGMENTS',
    '',
  ];

  for (const variant of orderedVariants) {
    const { quality, width, height, avgBps, peakBps } = variant;

    /**
     * BANDWIDTH = حداکثر بیتریت واقعی سیگمنت‌ها (+ حاشیه کم)
     * AVERAGE-BANDWIDTH = میانگین واقعی
     *
     * عددها بعد از انکود از خود فایل‌ها اندازه‌گیری می‌شوند تا
     * ABR با عدد اشتباه تصمیم نگیرد.
     */
    const bandwidth = Math.ceil(Math.max(peakBps, avgBps * 1.15) / 1000) * 1000;

    const averageBandwidth = Math.ceil(avgBps / 1000) * 1000;

    /**
     * CODECS باید دقیقاً همان چیزی باشد که در SPS خروجی است:
     * - high profile = 64
     * - level 4.1   = 29
     * و صدا فقط زمانی اعلام می‌شود که واقعاً صدا داریم.
     */
    const codecs = variant.audio
      ? 'avc1.640029,mp4a.40.2'
      : 'avc1.640029';

    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},AVERAGE-BANDWIDTH=${averageBandwidth},RESOLUTION=${width}x${height},CODECS="${codecs}"`,
    );

    lines.push(`${quality.name}/playlist.m3u8`);

    lines.push('');
  }

  /**
   * نوشتن اتمیک: ابتدا فایل موقت، بعد rename
   * (تا سرور هیچ‌وقت master نیمه‌نوشته سرو نکند)
   */
  const tempMasterPath = `${masterPath}.tmp`;

  writeFileSync(tempMasterPath, lines.join('\n'), 'utf8');

  renameSync(tempMasterPath, masterPath);

  console.log(`📄 Master playlist created: ${masterPath}`);
}

/**
 * ساخت Poster از یک فریم میانی ویدیو
 *
 * پلیر تا آماده شدن فریم اول، این تصویر را نشان می‌دهد
 * (به جای مستطیل مشکی).
 */
async function createPoster(
  inputPath: string,
  outputDir: string,
  videoInfo: VideoInfo,
): Promise<void> {
  const duration = videoInfo.duration || 0;

  const timestamp = duration > 3 ? Math.min(1.5, duration * 0.2) : 0;

  const posterPath = path.join(outputDir, 'poster.webp');

  await runFFmpeg([
    '-y',

    '-ss',
    timestamp.toFixed(2),

    '-i',
    inputPath,

    '-frames:v',
    '1',

    '-vf',
    'scale=560:-2:flags=lanczos',

    /**
     * libwebp:
     *
     * q=78 با compression_level=6 → همان کیفیت چشمی با
     * ~۳۰٪ حجم کمتر از q=80 (پوستر اولین چیزی است که کاربر
     * می‌بیند؛ هر کیلوبایتش روی لود اول اثر دارد).
     */
    '-q:v',
    '78',

    '-compression_level',
    '6',

    posterPath,
  ]);

  console.log(`🖼️ Poster created: ${posterPath}`);
}

/**
 * اجرای هم‌زمان تسک‌ها با تعداد محدود (worker pool)
 */
async function runPool<T, R>(
  items: T[],
  size: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);

  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(size, items.length) }, () =>
    (async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(items[index]);
      }
    })(),
  );

  await Promise.all(runners);

  return results;
}

/**
 * Encode یک ویدیو
 *
 * خروجی در پوشه موقت ساخته می‌شود و در انتها به صورت Atomic
 * جایگزین پوشه قبلی می‌شود؛ پس اگر انکود وسط کار fail شود،
 * نسخه سالم قبلی روی سایت باقی می‌ماند.
 */
async function encodeVideo(
  inputPath: string,
  options: EncodeOptions,
): Promise<void> {
  const absoluteInputPath = path.resolve(inputPath);

  // =========================
  // Validate input
  // =========================

  if (!existsSync(absoluteInputPath)) {
    throw new Error(`Video not found: ${absoluteInputPath}`);
  }

  const extension = path.extname(absoluteInputPath);

  if (extension.toLowerCase() !== '.mp4') {
    throw new Error(`Only .mp4 files are supported: ${absoluteInputPath}`);
  }

  const baseName = path.basename(absoluteInputPath, extension);

  const outputDir = path.resolve(options.outRoot, baseName);

  const tempDir = `${outputDir}.tmp`;

  console.log('');

  console.log('======================================');

  console.log(`🎬 ${baseName}`);

  console.log('======================================');

  console.log(`📥 Input:  ${absoluteInputPath}`);

  console.log(`📤 Output: ${outputDir}`);

  console.log('');

  // =========================
  // Get original information
  // =========================

  const videoInfo = await getVideoInfo(absoluteInputPath);

  /**
   * نسخه محتوا (هش) — قبل از انکود لازم است چون در نام فایل‌ها می‌آید.
   */
  const contentVersion = await computeContentVersion(
    absoluteInputPath,
    options,
  );

  console.log(`📐 Original resolution: ${videoInfo.width}x${videoInfo.height}`);

  console.log(`🎞️ Frame rate: ${videoInfo.fps.toFixed(2)} fps`);

  console.log(`🔊 Audio: ${videoInfo.hasAudio ? 'yes' : 'no'}`);

  if (videoInfo.duration) {
    console.log(`⏱️ Duration: ${videoInfo.duration.toFixed(2)}s`);
  }

  console.log('');

  // =========================
  // Master-only mode
  // =========================
  // فقط master.m3u8 را از خروجی موجود بازسازی می‌کند (بدون انکود)
  // و اتمیک جای فایل قبلی می‌نویسد.

  if (options.masterOnly) {
    if (!existsSync(outputDir)) {
      throw new Error(`No existing output to rebuild master: ${outputDir}`);
    }

    const variants: EncodedVariant[] = [];

    for (const quality of qualities) {
      const qualityDir = path.join(outputDir, quality.name);

      if (!existsSync(path.join(qualityDir, 'playlist.m3u8'))) continue;

      const dimensions = calculateDimensions(
        videoInfo.width,
        videoInfo.height,
        quality.height,
      );

      const metrics = await measureVariant(qualityDir);

      variants.push({
        quality,
        width: dimensions.width,
        height: dimensions.height,
        audio: options.includeAudio && videoInfo.hasAudio,
        ...metrics,
      });
    }

    if (variants.length === 0) {
      throw new Error(`No variants found in ${outputDir}`);
    }

    const masterPath = path.join(outputDir, 'master.m3u8');

    createMasterPlaylist(outputDir, variants);

    console.log(`✅ Master playlist rebuilt: ${masterPath}`);

    console.log('');

    return;
  }

  // =========================
  // Encode into a temp directory
  // =========================

  await rm(tempDir, {
    recursive: true,
    force: true,
  });

  await mkdir(tempDir, {
    recursive: true,
  });

  try {
    const encodeTargets = qualities.filter(
      quality => videoInfo.height >= quality.height,
    );

    if (encodeTargets.length === 0) {
      throw new Error(`No quality to encode for ${baseName}`);
    }

    const variants = await runPool(encodeTargets, options.jobs, quality =>
      encodeQuality(
        absoluteInputPath,
        tempDir,
        quality,
        videoInfo,
        options,
        contentVersion,
      ),
    );

    // =========================
    // Master playlist
    // =========================

    createMasterPlaylist(tempDir, variants);

    if (options.poster) {
      await createPoster(absoluteInputPath, tempDir, videoInfo);
    }

    // =========================
    // Move into place (safe swap)
    // =========================

    await mkdir(outputDir, {
      recursive: true,
    });

    await moveIntoPlace(tempDir, outputDir, contentVersion);

    if (options.poster) {
      await rename(
        path.join(tempDir, 'poster.webp'),
        path.join(outputDir, 'poster.webp'),
      );
    }

    console.log('');

    console.log(`🎉 ${baseName} completed (version ${contentVersion})`);
  } finally {
    /**
     * اگر انکود fail شود، پوشه موقت باقی نمی‌ماند و
     * خروجی سالم قبلی هم دست‌نخورده می‌ماند.
     */
    await rm(tempDir, {
      recursive: true,
      force: true,
    }).catch(() => undefined);
  }

  console.log('');
}

interface CliOptions extends EncodeOptions {
  inputFiles: string[];
}

/**
 * خواندن آرگومان‌های خط فرمان
 */
function parseArgs(rawArgs: string[]): CliOptions {
  const inputFiles: string[] = [];

  let includeAudio = true;
  let crf = DEFAULT_CRF;
  let jobs = Math.max(1, Math.min(4, os.cpus().length - 1));
  let outRoot = 'public/home';
  let poster = true;
  let masterOnly = false;

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];

    switch (arg) {
      case '--mute':
        includeAudio = false;
        break;

      case '--no-poster':
        poster = false;
        break;

      case '--master-only':
        masterOnly = true;
        break;

      case '--crf':
        crf = Number(rawArgs[i + 1]);
        i += 1;
        break;

      case '--jobs':
        jobs = Number(rawArgs[i + 1]);
        i += 1;
        break;

      case '--out':
        outRoot = rawArgs[i + 1];
        i += 1;
        break;

      default:
        if (arg.startsWith('--')) {
          throw new Error(`Unknown option: ${arg}`);
        }

        inputFiles.push(arg);
    }
  }

  if (!Number.isFinite(crf) || crf <= 0 || crf > 51) {
    throw new Error(`Invalid --crf value: ${crf}`);
  }

  if (!Number.isFinite(jobs) || jobs < 1) {
    throw new Error(`Invalid --jobs value: ${jobs}`);
  }

  return {
    includeAudio,
    crf,
    jobs,
    outRoot,
    poster,
    masterOnly,
    inputFiles,
  };
}

/**
 * Main
 */
async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  const { inputFiles } = options;

  if (inputFiles.length === 0) {
    console.error('');

    console.error('❌ No video files specified.');

    console.error('');

    console.error('Usage:');

    console.error('  pnpm video:encode assets/video-sources/category_1.mp4');

    console.error('');

    console.error('Muted background loops (strips audio, recommended');

    console.error('for hero/category/end/style videos):');

    console.error('  pnpm video:encode --mute assets/video-sources/hero_section_1.mp4');

    console.error('');

    console.error('Multiple files:');

    console.error(
      '  pnpm video:encode --mute assets/video-sources/category_1.mp4 assets/video-sources/category_2.mp4',
    );

    console.error('');

    console.error('Options:');

    console.error('  --mute           strip audio completely (-an)');

    console.error(`  --crf <0-51>     quality (default ${DEFAULT_CRF}, lower = better)`);

    console.error('  --jobs <n>       parallel encoders');

    console.error('  --out <dir>      output root (default public/home)');

    console.error('  --no-poster      skip poster.webp generation');

    console.error(
      '  --master-only    rebuild master.m3u8 from existing output (no encode)',
    );

    console.error('');

    process.exit(1);
  }

  console.log('');

  console.log('======================================');

  console.log('🎬 HLS VIDEO ENCODER');

  console.log('======================================');

  console.log(`📦 Files to process: ${inputFiles.length}`);

  console.log(`⚙️ CRF: ${options.crf} | Segments: ${SEGMENT_DURATION}s | Parallel jobs: ${options.jobs}`);

  console.log('');

  let successCount = 0;
  let failedCount = 0;

  console.log(
    options.includeAudio
      ? '🔊 Including audio (128k AAC)'
      : '🔇 Mute mode: audio stripped (-an)',
  );

  console.log('');

  for (const inputFile of inputFiles) {
    try {
      await encodeVideo(inputFile, options);

      successCount++;
    } catch (error) {
      failedCount++;

      console.error('');

      console.error(`❌ Failed: ${inputFile}`);

      console.error(error);

      console.error('');
    }
  }

  // =========================
  // Summary
  // =========================

  console.log('');

  console.log('======================================');

  console.log('📊 ENCODING SUMMARY');

  console.log('======================================');

  console.log(`✅ Successful: ${successCount}`);

  console.log(`❌ Failed:     ${failedCount}`);

  console.log('');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('');

  console.error('❌ Fatal error');

  console.error(error);

  process.exit(1);
});
