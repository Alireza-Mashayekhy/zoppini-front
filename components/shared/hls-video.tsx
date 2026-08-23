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

    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement,
      [],
    );

    useEffect(() => {
      const video = videoRef.current;

      if (!video) return;

      let hls: Hls | null = null;

      // Chrome / Edge / Firefox
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,

          startLevel: -1,
          capLevelToPlayerSize: false,

          abrBandWidthFactor: 0.7,
          abrBandWidthUpFactor: 0.5,

          maxBufferLength: 30,
          maxBufferSize: 30 * 1000 * 1000,
        });

        hls.loadSource(src);
        hls.attachMedia(video);
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
        if (hls) {
          hls.destroy();
          hls = null;
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
