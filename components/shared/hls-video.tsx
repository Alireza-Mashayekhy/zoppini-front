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
   * اگر true باشد، اولین فریم‌ها با پایین‌ترین کیفیت لود می‌شوند
   * (برای شروع سریع‌تر) و بعد از آن، ABR خود hls.js
   * بر اساس پهنای باند واقعی کاربر کیفیت را تنظیم می‌کند.
   */
  lowQualityFirst?: boolean;
}

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
    // مقدار اولیه lowQualityFirst رو فریز می‌کنیم تا تغییرش
    // باعث ری‌ست کامل پلیر نشه
    const lowQualityFirstRef = useRef(lowQualityFirst);

    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement,
      [],
    );

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      let hls: Hls | null = null;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          // فقط اولین سطح رو پایین می‌ذاریم، بقیه رو به ABR واگذار می‌کنیم
          startLevel: lowQualityFirstRef.current ? 0 : -1,
          capLevelToPlayerSize: true,

          // بافر معقول برای پخش روان (پیش‌فرض‌های hls.js تقریباً همینه)
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,

          // مقادیر پیش‌فرض ABR رو دست‌نخورده می‌ذاریم تا تخمین واقعی باشه
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        // مدیریت خطا برای پایداری پخش (بدون این، یک خطای شبکه
        // می‌تونه کل پلیر رو هنگ کنه)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || !hls) return;
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        });

        // هیچ تایمر دستی برای ارتقاء کیفیت لازم نیست:
        // با startLevel: -1 یا حتی 0، از فرگمنت‌های بعدی
        // AbrController خودش بر اساس پهنای باند واقعی
        // (throughput اندازه‌گیری‌شده) کیفیت رو تنظیم می‌کنه —
        // دقیقاً همون رفتار Auto یوتیوب.
      }

      // Safari / iOS
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.load();
      }

      return () => {
        if (hls) {
          hls.destroy();
        }
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }, [src]);

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
