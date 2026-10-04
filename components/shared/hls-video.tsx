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
   * شروع سریع:
   *
   * قبل از دانلود اولین سیگمنت، پهنای باند کاربر از
   * Network Information API (کروم/اندروید) خوانده می‌شود و همان
   * تخمین به hls.js داده می‌شود؛ بنابراین hls.js از همان اولین
   * سیگمنت «کیفیت مناسب اینترنت کاربر» را انتخاب می‌کند و
   * زمان رسیدن به فریم اول هم کوتاه می‌ماند.
   *
   * اگر مرورگر این API را نداشته باشد (Safari/Firefox)، از
   * سبک‌ترین کیفیت شروع می‌شود و hls.js با اندازه‌گیری واقعی
   * همان اولین سیگمنت (که با سیگمنت‌های ۲ ثانیه‌ای کوچک است)
   * سطح را اصلاح می‌کند.
   */
  fastStart?: boolean;
  /**
   * وقتی ویدیو از دید خارج می‌شود، علاوه بر pause، دانلود
   * سیگمنت‌ها هم متوقف می‌شود (صرفه‌جویی در ترافیک موبایل).
   */
  pauseOffscreen?: boolean;
  lazy?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  poster?: string;
}

interface NetworkInformationLike {
  /**
   * تخمین پهنای باند (مگابیت بر ثانیه)
   */
  downlink?: number;
  /**
   * تخمین تأخیر رفت و برگشت (میلی‌ثانیه)
   */
  rtt?: number;
  effectiveType?: string;
  saveData?: boolean;
}

interface StartEstimate {
  bps: number;
  source: string;
}

/**
 * سقف‌ها و پیش‌فرض‌های تخمین اولیه پهنای باند (بیت بر ثانیه)
 *
 * این عددها عمداً «محافظه‌کارانه» انتخاب شده‌اند:
 * ‏hls.js فقط سطوحی را انتخاب می‌کند که بیتریت آن‌ها از تخمین
 * کمتر باشد، پس تخمین کمتر = شروع سبک‌تر و امن‌تر.
 */
const SEED_UNKNOWN = 400_000;
const SEED_MIN = 120_000;
const SEED_MAX = 4_000_000;

/**
 * خواندن تخمین پهنای باند از Network Information API
 *
 * این API در کروم/اندروید (که سهم اصلی ترافیک موبایل را دارند)
 * موجود است و مقدارش «بدون دانلود هیچ بایتی» به دست می‌آید؛
 * یعنی تشخیص سرعت کاربر عملاً در همان لحظه لود صفحه انجام می‌شود.
 */
function getStartEstimate(): StartEstimate {
  const connection = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;

  if (!connection) {
    /**
     * مرورگر از این API پشتیبانی نمی‌کند → از سبک‌ترین کیفیت شروع کن.
     * (hls.js با اندازه‌گیری اولین سیگمنت ۲ ثانیه‌ای سریع اصلاح می‌کند)
     */
    return { bps: SEED_UNKNOWN, source: 'unknown' };
  }

  const effectiveType = connection.effectiveType ?? '';

  /**
   * سقف بر اساس نوع شبکه: حتی اگر downlink عدد بزرگی بدهد،
   * روی 2g/3g نباید کیفیت سنگین شروع شود.
   */
  let typeCap = SEED_MAX;

  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    typeCap = 350_000;
  } else if (effectiveType === '3g') {
    typeCap = 900_000;
  }

  /**
   * حالت کم‌مصرف: کاربر خودش خواسته داده کم مصرف شود.
   */
  if (connection.saveData) {
    return { bps: SEED_MIN, source: 'save-data' };
  }

  const downlink = typeof connection.downlink === 'number' ? connection.downlink : 0;

  /**
   * ضریب اطمینان 0.8: عدد downlink یک تخمین است، نه مقدار واقعی.
   */
  const measured = downlink > 0 ? downlink * 1_000_000 * 0.8 : SEED_UNKNOWN;

  /**
   * تأخیر زیاد = شبکه کند (RTT بالا) → سقف پایین‌تر.
   */
  const rtt = typeof connection.rtt === 'number' ? connection.rtt : 0;

  const rttCap = rtt > 800 ? 350_000 : rtt > 400 ? 900_000 : typeCap;

  return {
    bps: Math.max(SEED_MIN, Math.min(measured, rttCap)),
    source: `${effectiveType || 'unknown'}:${downlink}`,
  };
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
      fastStart = true,
      pauseOffscreen = true,
      lazy = true,
      preload = 'metadata',
      poster,
      ...props
    },
    forwardedRef,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    /**
     * نمونه hls.js (برای pause/stop کردن دانلود در حالت
     * خارج از دید و همچنین destroy در cleanup)
     */
    const hlsRef = useRef<{ destroy: () => void; startLoad: () => void; stopLoad: () => void } | null>(
      null,
    );

    const [shouldLoad, setShouldLoad] = useState(() => !lazy);

    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement,
      [],
    );

    /**
     * Lazy load + مدیریت ویدیوهای خارج از دید
     *
     * 400px حاشیه: ویدیو قبل از رسیدن به viewport شروع می‌شود
     * تا وقتی کاربر اسکرول کرد، از قبل آماده باشد.
     */
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

              /**
               * اگر قبلاً به خاطر خارج شدن از دید دانلود را
               * متوقف کرده بودیم، از همان‌جا ادامه بده.
               */
              if (el.dataset.stopped === 'true') {
                delete el.dataset.stopped;
                hlsRef.current?.startLoad();
              }

              if (autoPlay && el.dataset.loaded === 'true') {
                el.play().catch(() => {});
              }
            } else if (el.dataset.loaded === 'true') {
              // Pause off-screen background loops (big mobile win).
              if (!el.paused) {
                el.pause();
              }

              if (pauseOffscreen && hlsRef.current) {
                el.dataset.stopped = 'true';
                hlsRef.current.stopLoad();
              }
            }
          }
        },
        { rootMargin: '400px 0px', threshold: 0.1 },
      );

      io.observe(el);

      return () => io.disconnect();
    }, [lazy, autoPlay, pauseOffscreen]);

    /**
     * ساخت پلیر HLS
     */
    useEffect(() => {
      if (!shouldLoad) return;

      const video = videoRef.current;
      if (!video) return;

      let cancelled = false;

      const init = async () => {
        /**
         * نسخه light حدود ۳۷٪ کوچک‌تر از بیلد کامل است
         * (DRM/CMCD/زیرنویس/صدای جایگزین حذف شده) و همه‌ی
         * چیزهایی که ما لازم داریم (TS + ABR + Worker) را دارد.
         */
        const { default: Hls } = await import('hls.js/light');

        if (cancelled || !video) return;

        video.dataset.loaded = 'true';

        if (Hls.isSupported()) {
          const estimate = fastStart ? getStartEstimate() : null;

          const instance = new Hls({
            enableWorker: true,
            capLevelToPlayerSize: true,

            /**
             * شروع سریع:
             *
             * startLevel: -1 یعنی «سطح شروع را خودت بر اساس تخمین
             * پهنای باند انتخاب کن». (اگر testBandwidth روشن باشد
             * hls.js به جای این کار، اول یک سیگمنت تست دانلود
             * می‌کند که باعث تأخیر اضافه می‌شود.)
             */
            startLevel: -1,
            testBandwidth: false,

            ...(estimate ? { abrEwmaDefaultEstimate: estimate.bps } : {}),

            /**
             * ABR مخصوص VOD: ثابت‌های زمانی کوتاه‌تر
             * (0.2/0.5 به جای 3/9 ثانیه) تا با هر سیگمنت
             * ۲ ثانیه‌ای، تخمین پهنای باند سریع اصلاح شود.
             */
            abrEwmaFastVoD: 0.2,
            abrEwmaSlowVoD: 0.5,

            /**
             * بالا رفتن از سطح فعلی فقط با 80% پهنای باند اندازه‌گیری‌شده
             * (انواع ABR پیش‌فرضش 70% است) تا سریع‌تر به کیفیت واقعی
             * اینترنت کاربر برسیم.
             */
            abrBandWidthUpFactor: 0.8,

            /**
             * بیتریت واقعی سیگمنت‌های دانلودشده را هم در تصمیم ABR
             * دخالت بده (نه فقط عدد BANDWIDTH داخل master).
             */
            abrMaxWithRealBitrate: true,

            /**
             * اولین سیگمنت را زودتر (قبل از آماده شدن مدیا) شروع کن
             * تا یک رفت و برگشت صرفه‌جویی شود.
             */
            startFragPrefetch: true,

            /**
             * بافر: کلیپ‌های این سایت ۱۰ تا ۳۰ ثانیه‌اند، پس با بافر
             * ۳۰ ثانیه‌ای معمولاً کل کلیپ یک‌بار بافر می‌شود →
             * حلقه (loop) بدون هیچ درخواست شبکه‌ای و بدون استال.
             */
            maxBufferLength: 20,
            maxMaxBufferLength: 30,
            maxBufferSize: 25 * 1000 * 1000,
            backBufferLength: 30,
          });

          hlsRef.current = instance;

          instance.loadSource(src);
          instance.attachMedia(video);

          instance.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                instance.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                instance.recoverMediaError();
                break;
              default:
                instance.destroy();
                break;
            }
          });

          if (autoPlay) {
            video.play().catch(() => {});
          }
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          /**
           * Safari / iOS: پخش بومی HLS
           *
           * اینجا hls.js در کار نیست و انتخاب کیفیت اول کارِ خودِ
           * پلیر است؛ به همین دلیل ترتیب واریانت‌های master.m3u8
           * صعودی نوشته می‌شود تا از سبک‌ترین کیفیت شروع کند.
           */
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

        hlsRef.current?.destroy();
        hlsRef.current = null;

        delete video.dataset.loaded;
        delete video.dataset.stopped;

        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }, [src, shouldLoad, autoPlay, fastStart]);

    return (
      <video
        ref={videoRef}
        muted={muted}
        loop={loop}
        autoPlay={false}
        playsInline={playsInline}
        preload={shouldLoad ? preload : 'none'}
        /**
         * پوستر فقط وقتی ست می‌شود که ویدیو به viewport نزدیک شده باشد.
         *
         * اگر پوستر از همان HTML اولیه ست شود، مرورگر پوسترِ همه‌ی
         * ویدیوهای پایین صفحه را هم بلافاصله دانلود می‌کند و روی
         * اینترنت کند با پوستر/JS بالای صفحه رقابت می‌کند
         * (اندازه‌گیری 3G: ~۲۰۰KB پوستر بی‌مصرف در ۲ ثانیه‌ی اول).
         */
        poster={shouldLoad ? poster : undefined}
        disablePictureInPicture
        className={className}
        {...props}
      />
    );
  },
);

HlsVideo.displayName = 'HlsVideo';

export default HlsVideo;
