import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
}

interface VideoQuality {
  name: string;
  height: number;
  bandwidth: number;
  averageBandwidth: number;
  videoBitrate: string;
  maxrate: string;
  bufsize: string;
}

interface EncodedVariant {
  quality: VideoQuality;
  width: number;
  height: number;
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
    bandwidth: 900000,
    averageBandwidth: 800000,
    videoBitrate: '800k',
    maxrate: '880k',
    bufsize: '1200k',
  },
  {
    name: '480p',
    height: 480,
    bandwidth: 1650000,
    averageBandwidth: 1500000,
    videoBitrate: '1500k',
    maxrate: '1650k',
    bufsize: '2250k',
  },
  {
    name: '720p',
    height: 720,
    bandwidth: 3300000,
    averageBandwidth: 3000000,
    videoBitrate: '3000k',
    maxrate: '3300k',
    bufsize: '4500k',
  },
  {
    name: '1080p',
    height: 1080,
    bandwidth: 5500000,
    averageBandwidth: 5000000,
    videoBitrate: '5000k',
    maxrate: '5500k',
    bufsize: '7500k',
  },
];

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
 */
function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args, {
      stdio: 'inherit',
      windowsHide: true,
    });

    ffmpeg.on('error', error => {
      reject(error);
    });

    ffmpeg.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

/**
 * گرفتن اطلاعات ویدیوی اصلی
 */
async function getVideoInfo(inputPath: string): Promise<VideoInfo> {
  const output = await runCommand('ffprobe', [
    '-v',
    'error',

    '-select_streams',
    'v:0',

    '-show_entries',
    'stream=width,height,duration',

    '-of',
    'json',

    inputPath,
  ]);

  const data = JSON.parse(output);

  const stream = data.streams?.[0];

  if (!stream) {
    throw new Error(`No video stream found: ${inputPath}`);
  }

  const width = Number(stream.width);
  const height = Number(stream.height);
  const duration = Number(stream.duration || 0);

  if (!width || !height) {
    throw new Error(`Invalid video dimensions: ${inputPath}`);
  }

  return {
    width,
    height,
    duration,
  };
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
 * Encode یک کیفیت
 */
async function encodeQuality(
  inputPath: string,
  outputDir: string,
  quality: VideoQuality,
  videoInfo: VideoInfo,
): Promise<EncodedVariant> {
  const qualityDir = path.join(outputDir, quality.name);

  await mkdir(qualityDir, {
    recursive: true,
  });

  const playlistPath = path.join(qualityDir, 'playlist.m3u8');

  const segmentPath = path.join(qualityDir, 'segment%05d.ts');

  const dimensions = calculateDimensions(
    videoInfo.width,
    videoInfo.height,
    quality.height,
  );

  const filter = createVideoFilter(dimensions.width, dimensions.height);

  console.log('');

  console.log(`▶️ Encoding ${quality.name}`);

  console.log(`   Original: ${videoInfo.width}x${videoInfo.height}`);

  console.log(`   Output:   ${dimensions.width}x${dimensions.height}`);

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

    '-preset',
    'medium',

    '-profile:v',
    'high',

    '-level',
    '4.1',

    '-pix_fmt',
    'yuv420p',

    '-b:v',
    quality.videoBitrate,

    '-maxrate',
    quality.maxrate,

    '-bufsize',
    quality.bufsize,

    // =========================
    // KEYFRAMES
    // =========================

    '-g',
    '48',

    '-keyint_min',
    '48',

    '-sc_threshold',
    '0',

    // =========================
    // AUDIO
    // =========================

    '-c:a',
    'aac',

    '-b:a',
    '128k',

    '-ar',
    '48000',

    '-ac',
    '2',

    // =========================
    // HLS
    // =========================

    '-f',
    'hls',

    '-hls_time',
    '6',

    '-hls_playlist_type',
    'vod',

    '-hls_segment_filename',
    segmentPath,

    playlistPath,
  ]);

  console.log(`✅ ${quality.name} completed`);

  return {
    quality,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * ساخت master.m3u8
 */
function createMasterPlaylist(
  outputDir: string,
  variants: EncodedVariant[],
): void {
  const masterPath = path.join(outputDir, 'master.m3u8');

  const lines = ['#EXTM3U', '#EXT-X-VERSION:3', ''];

  /**
   * کیفیت بالاتر اول قرار می‌گیرد.
   */
  const orderedVariants = [...variants].reverse();

  for (const variant of orderedVariants) {
    const { quality, width, height } = variant;

    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${quality.bandwidth},AVERAGE-BANDWIDTH=${quality.averageBandwidth},RESOLUTION=${width}x${height},CODECS="avc1.640028,mp4a.40.2"`,
    );

    lines.push(`${quality.name}/playlist.m3u8`);

    lines.push('');
  }

  writeFileSync(masterPath, lines.join('\n'), 'utf8');

  console.log(`📄 Master playlist created: ${masterPath}`);
}

/**
 * Encode یک ویدیو
 */
async function encodeVideo(inputPath: string): Promise<void> {
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

  const outputDir = path.join(path.dirname(absoluteInputPath), baseName);

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

  console.log(`📐 Original resolution: ${videoInfo.width}x${videoInfo.height}`);

  if (videoInfo.duration) {
    console.log(`⏱️ Duration: ${videoInfo.duration.toFixed(2)}s`);
  }

  console.log('');

  // =========================
  // Delete old output
  // =========================

  if (existsSync(outputDir)) {
    console.log('🗑️ Removing previous HLS output...');

    await rm(outputDir, {
      recursive: true,
      force: true,
    });

    console.log('✅ Previous output removed');
  }

  // =========================
  // Create output directory
  // =========================

  await mkdir(outputDir, {
    recursive: true,
  });

  // =========================
  // Encode qualities
  // =========================

  const variants: EncodedVariant[] = [];

  for (const quality of qualities) {
    /**
     * اگر Resolution اصلی از این کیفیت
     * کوچک‌تر باشد، Upscale نمی‌کنیم.
     *
     * مثال:
     *
     * Source = 720p
     *
     * 360p ✅
     * 480p ✅
     * 720p ✅
     * 1080p ❌
     */
    if (videoInfo.height < quality.height) {
      console.log(`⏭️ Skipping ${quality.name}`);

      console.log(
        `   Source height (${videoInfo.height}) < target height (${quality.height})`,
      );

      continue;
    }

    const variant = await encodeQuality(
      absoluteInputPath,
      outputDir,
      quality,
      videoInfo,
    );

    variants.push(variant);
  }

  // =========================
  // Master playlist
  // =========================

  createMasterPlaylist(outputDir, variants);

  console.log('');

  console.log(`🎉 ${baseName} completed`);

  console.log('');
}

/**
 * Main
 */
async function main(): Promise<void> {
  const inputFiles = process.argv.slice(2);

  if (inputFiles.length === 0) {
    console.error('');

    console.error('❌ No video files specified.');

    console.error('');

    console.error('Usage:');

    console.error('  pnpm video:encode public/home/category_1.mp4');

    console.error('');

    console.error('Multiple files:');

    console.error(
      '  pnpm video:encode public/home/category_1.mp4 public/home/category_2.mp4',
    );

    console.error('');

    process.exit(1);
  }

  console.log('');

  console.log('======================================');

  console.log('🎬 HLS VIDEO ENCODER');

  console.log('======================================');

  console.log(`📦 Files to process: ${inputFiles.length}`);

  console.log('');

  let successCount = 0;
  let failedCount = 0;

  for (const inputFile of inputFiles) {
    try {
      await encodeVideo(inputFile);

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
