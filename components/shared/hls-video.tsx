'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type VideoHTMLAttributes,
} from 'react';

interface HlsVideoProps extends Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'src' | 'preload'
> {
  src: string;
  /**
   * اگر true باشد، اولین فریم‌ها با پایین‌ترین کیفیت لود می‌شوند
   * (برای شروع سریع‌تر) و بعد از آن، ABR خود hls.js
   * بر اساس پهنای باند واقعی کاربر کیفیت را تنظیم می‌کند.
   */
  lowQualityFirst?: boolean;
  lazy?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  poster?: string;
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
      lazy = true,
      preload = 'metadata',
      poster,
      ...props
    },
    forwardedRef,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const lowQualityFirstRef = useRef(lowQualityFirst);
    const [shouldLoad, setShouldLoad] = useState(() => !lazy);

    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement,
      [],
    );

    useEffect(() => {
      const el = videoRef.current;
      if (!el) return;
      if (typeof IntersectionObserver === 'undefined') {
        setShouldLoad(true);
        return;
      }

      const io = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setShouldLoad(prev => (prev ? prev : true));
              if (autoPlay && el.dataset.loaded === 'true') {
                el.play().catch(() => {});
              }
            } else if (el.dataset.loaded === 'true' && !el.paused) {
              // Pause off-screen background loops (big mobile win).
              el.pause();
            }
          }
        },
        { rootMargin: '400px 0px', threshold: 0.1 },
      );

      io.observe(el);
      return () => io.disconnect();
    }, [lazy, autoPlay]);

    useEffect(() => {
      if (!shouldLoad) return;
      const video = videoRef.current;
      if (!video) return;

      let hls: { destroy: () => void } | null = null;
      let cancelled = false;

      const init = async () => {
        const { default: Hls } = await import('hls.js');

        if (cancelled || !video) return;
        video.dataset.loaded = 'true';

        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            startLevel: lowQualityFirstRef.current ? 0 : -1,
            capLevelToPlayerSize: true,

            maxBufferLength: 10,
            maxMaxBufferLength: 20,
            maxBufferSize: 20 * 1000 * 1000,
          });

          const hlsInstance = hls as InstanceType<typeof Hls>;
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);

          hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal || !hls) return;
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hlsInstance.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsInstance.recoverMediaError();
                break;
              default:
                hlsInstance.destroy();
                break;
            }
          });

          if (autoPlay) {
            video.play().catch(() => {});
          }
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari / iOS native HLS
          video.src = src;
          video.load();
          if (autoPlay) {
            video.play().catch(() => {});
          }
        }
      };

      void init();

      return () => {
        cancelled = true;
        if (hls) {
          hls.destroy();
        }
        delete video.dataset.loaded;
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }, [src, shouldLoad, autoPlay]);

    return (
      <video
        ref={videoRef}
        muted={muted}
        loop={loop}
        autoPlay={false}
        playsInline={playsInline}
        preload={shouldLoad ? preload : 'none'}
        poster={poster}
        disablePictureInPicture
        className={className}
        {...props}
      />
    );
  },
);

HlsVideo.displayName = 'HlsVideo';

export default HlsVideo;
