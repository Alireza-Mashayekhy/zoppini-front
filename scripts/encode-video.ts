import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

interface VideoQuality {
  name: string;
  width: number;
  height: number;
  bandwidth: number;
  averageBandwidth: number;
  videoBitrate: string;
  maxrate: string;
  bufsize: string;
}

const qualities: VideoQuality[] = [
  {
    name: '360p',
    width: 640,
    height: 360,
    bandwidth: 900000,
    averageBandwidth: 800000,
    videoBitrate: '800k',
    maxrate: '880k',
    bufsize: '1200k',
  },
  {
    name: '480p',
    width: 854,
    height: 480,
    bandwidth: 1650000,
    averageBandwidth: 1500000,
    videoBitrate: '1500k',
    maxrate: '1650k',
    bufsize: '2250k',
  },
  {
    name: '720p',
    width: 1280,
    height: 720,
    bandwidth: 3300000,
    averageBandwidth: 3000000,
    videoBitrate: '3000k',
    maxrate: '3300k',
    bufsize: '4500k',
  },
  {
    name: '1080p',
    width: 1920,
    height: 1080,
    bandwidth: 5500000,
    averageBandwidth: 5000000,
    videoBitrate: '5000k',
    maxrate: '5500k',
    bufsize: '7500k',
  },
];

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
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

function createVideoFilter(width: number, height: number): string {
  /**
   * First scale the video so both dimensions are
   * at least the target resolution.
   *
   * Then crop the excess area.
   *
   * This prevents FFmpeg from creating black bars.
   */
  return [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
  ].join(',');
}

function createMasterPlaylist(outputDir: string): void {
  const masterPath = path.join(outputDir, 'master.m3u8');

  const lines = ['#EXTM3U', '#EXT-X-VERSION:3', ''];

  // Highest quality first
  const orderedQualities = [...qualities].reverse();

  for (const quality of orderedQualities) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${quality.bandwidth},AVERAGE-BANDWIDTH=${quality.averageBandwidth},RESOLUTION=${quality.width}x${quality.height},CODECS="avc1.640028,mp4a.40.2"`,
    );

    lines.push(`${quality.name}/playlist.m3u8`);

    lines.push('');
  }

  writeFileSync(masterPath, lines.join('\n'), 'utf8');
  console.log(`📄 Master playlist created: ${masterPath}`);
}

async function encodeQuality(
  inputPath: string,
  outputDir: string,
  quality: VideoQuality,
): Promise<void> {
  const qualityDir = path.join(outputDir, quality.name);

  await mkdir(qualityDir, {
    recursive: true,
  });

  const playlistPath = path.join(qualityDir, 'playlist.m3u8');

  const segmentPath = path.join(qualityDir, 'segment%05d.ts');

  const filter = createVideoFilter(quality.width, quality.height);

  console.log('');
  console.log(
    `▶️ Encoding ${quality.name} (${quality.width}x${quality.height})`,
  );

  await runFFmpeg([
    '-y',

    '-i',
    inputPath,

    // Video
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

    // Consistent keyframes between qualities
    '-g',
    '48',

    '-keyint_min',
    '48',

    '-sc_threshold',
    '0',

    // Audio
    '-c:a',
    'aac',

    '-b:a',
    '128k',

    '-ar',
    '48000',

    '-ac',
    '2',

    // HLS
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
}

async function encodeVideo(inputPath: string): Promise<void> {
  const absoluteInputPath = path.resolve(inputPath);

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

  // Delete previous HLS output
  if (existsSync(outputDir)) {
    console.log('🗑️ Removing previous HLS output...');

    await rm(outputDir, {
      recursive: true,
      force: true,
    });

    console.log('✅ Previous output removed');
  }

  // Create clean output directory
  await mkdir(outputDir, {
    recursive: true,
  });

  for (const quality of qualities) {
    await encodeQuality(absoluteInputPath, outputDir, quality);
  }

  createMasterPlaylist(outputDir);

  console.log('');
  console.log(`🎉 ${baseName} completed`);
  console.log('');
}

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

      // Continue with the next video
    }
  }

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
