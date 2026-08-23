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

      // Chrome / Edge / Firefox
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,

          // اگر lowQualityFirst فعال باشد، از پایین‌ترین کیفیت شروع کن
          startLevel: lowQualityFirst ? 0 : -1,
          capLevelToPlayerSize: false,

          abrBandWidthFactor: 0.7,
          abrBandWidthUpFactor: 0.5,

          maxBufferLength: 30,
          maxBufferSize: 30 * 1000 * 1000,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        // ── منطق ارتقاء کیفیت پس از لود صفحه ──
        if (lowQualityFirst) {
          const startUpgrade = () => {
            if (!hls) return;

            // اگر هنوز به آخرین سطح نرسیده‌ایم
            let currentLevel = hls.currentLevel;
            const maxLevel = hls.levels.length - 1;

            if (currentLevel < maxLevel) {
              // سطح بعدی را انتخاب کن
              hls.currentLevel = currentLevel + 1;
            } else {
              // به آخرین سطح رسیدیم → ABR خودکار را فعال کن
              hls.nextLevel = -1;

              // تایمر را متوقف کن
              if (upgradeTimer) {
                clearInterval(upgradeTimer);
                upgradeTimer = null;
              }
            }
          };

          // بعد از لود کامل صفحه، شروع به ارتقاء کن
          if (document.readyState === 'complete') {
            // صفحه قبلاً لود شده
            upgradeTimer = setInterval(startUpgrade, UPGRADE_INTERVAL_MS);
          } else {
            const onLoad = () => {
              upgradeTimer = setInterval(startUpgrade, UPGRADE_INTERVAL_MS);
            };
            window.addEventListener('load', onLoad, { once: true });

            // cleanup برای این listener
            hls.on(Hls.Events.DESTROYING, () => {
              window.removeEventListener('load', onLoad);
            });
          }
        }
      }

      // Safari / iOS
      else if (
        video.canPlayType('application/vnd.apple.mpegurl') === 'probably' ||
        video.canPlayType('application/vnd.apple.mpegurl') === 'maybe'
      ) {
        video.src = src;
        video.load();
      } else {
        console.error('❌ HLS is not supported');
      }

      return () => {
        if (upgradeTimer) {
          clearInterval(upgradeTimer);
          upgradeTimer = null;
        }

        if (hls) {
          hls.destroy();
          hls = null;
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
