'use client';

import Hls from 'hls.js';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type VideoHTMLAttributes,
} from 'react';

interface HlsVideoProps extends Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'src'
> {
  src: string;
  /**
   * اگر true باشد، ویدیو با پایین‌ترین کیفیت شروع شده
   * و بعد از لود کامل صفحه، کیفیت آرام آرام بالا می‌رود.
   */
  lowQualityFirst?: boolean;
}

/**
 * تعداد فریم‌های انتظار بین هر بار ارتقاء کیفیت
 * (حدود ۳ ثانیه → ۶۰ فریم)
 */
const UPGRADE_INTERVAL_MS = 3000;

const HlsVideo = forwardRef<HTMLVideoElement, HlsVideoProps>(
  (
    {
      src,
      className,
      autoPlay = true,
      muted = true,
      loop = true,
      playsInline = true,
      lowQualityFirst = false,
      ...props
    },
    forwardedRef,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement,
      [],
    );

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      let hls: Hls | null = null;
      let upgradeTimer: ReturnType<typeof setInterval> | null = null;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          startLevel: lowQualityFirst ? 0 : -1,
          capLevelToPlayerSize: true, // ✅ ارتقاء متناسب با سایز پلیر

          // --- بافر بهینه ---
          maxBufferLength: 2, // فقط ۲ ثانیه اولیه
          maxBufferSize: 10 * 1000 * 1000, // ۱۰MB موقت

          // --- ABR بهینه ---
          abrBandWidthFactor: 0.85,
          abrBandWidthUpFactor: 0.7,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        // آپگرید کیفیت فقط بعد از لود کامل level‌ها
        if (lowQualityFirst) {
          const tryStartUpgrade = () => {
            if (!hls || hls.levels.length === 0) return;

            const maxLevel = hls.levels.length - 1;
            upgradeTimer = setInterval(() => {
              if (!hls) return;

              if (hls.currentLevel < maxLevel) {
                hls.currentLevel = hls.currentLevel + 1;
              } else {
                hls.nextLevel = -1; // ABR فعال
                clearInterval(upgradeTimer!);
              }
            }, UPGRADE_INTERVAL_MS);
          };

          hls.on(Hls.Events.MANIFEST_PARSED, tryStartUpgrade);
        }
      }

      // Safari / iOS
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.load();
      }

      return () => {
        clearInterval(upgradeTimer!);
        if (hls) {
          hls.destroy();
        }
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }, [src, lowQualityFirst]);

    return (
      <video
        ref={videoRef}
        muted={muted}
        loop={loop}
        autoPlay={autoPlay}
        playsInline={playsInline}
        preload="auto"
        className={className}
        {...props}
      />
    );
  },
);

HlsVideo.displayName = 'HlsVideo';

export default HlsVideo;
