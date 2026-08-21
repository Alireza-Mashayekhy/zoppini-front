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
      ...props
    },
    forwardedRef,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // ref داخلی را در اختیار parent هم قرار می‌دهیم
    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement,
      [],
    );

    useEffect(() => {
      const video = videoRef.current;

      if (!video) {
        console.error('❌ Video element not found');

        return;
      }

      console.log('🎬 HLS init:', src);

      // Chrome / Edge / Firefox
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,

          // Auto quality
          startLevel: -1,

          // فعلاً محدود به اندازه container نیست
          capLevelToPlayerSize: false,

          // Adaptive bitrate
          abrBandWidthFactor: 0.7,
          abrBandWidthUpFactor: 0.5,

          maxBufferLength: 30,
          maxBufferSize: 30 * 1000 * 1000,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        return () => {
          hls.destroy();
        };
      }

      // Safari / iOS
      const nativeHls = video.canPlayType('application/vnd.apple.mpegurl');

      if (nativeHls === 'probably' || nativeHls === 'maybe') {
        video.src = src;

        return () => {
          video.removeAttribute('src');
          video.load();
        };
      }

      console.error('❌ HLS is not supported');

      return undefined;
    }, [src]);

    return (
      <video
        ref={videoRef}
        muted={muted}
        loop={loop}
        autoPlay={autoPlay}
        playsInline={playsInline}
        className={className}
        {...props}
      />
    );
  },
);

HlsVideo.displayName = 'HlsVideo';

export default HlsVideo;
