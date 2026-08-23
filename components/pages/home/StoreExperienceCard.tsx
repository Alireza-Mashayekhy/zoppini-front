'use client';

import './StoreExperienceCard.css';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

/**
 * کارت فروشگاه — مکعب سه‌بعدی افقی مثل کارت سرویس گوچی.
 * چهار عکس روی چهار وجه هستند و هر بار ۹۰ درجه می‌چرخند.
 */
const DEFAULT_IMAGES = [
  {
    src: '/home/store-01.png',
    alt: 'فروشگاه زوپینی — عکس ۱',
  },
  {
    src: '/home/store-02.png',
    alt: 'فروشگاه زوپینی — عکس ۲',
  },
  {
    src: '/home/store-03.png',
    alt: 'فروشگاه زوپینی — عکس ۳',
  },
  {
    src: '/home/store-04.png',
    alt: 'فروشگاه زوپینی — عکس ۴',
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export default function StoreExperienceCard({
  images = DEFAULT_IMAGES,
  holdMs = 3000,
  spinMs = 820,
}) {
  const reactId = useId();
  const blurId = `zse-spin-blur-${reactId.replace(/:/g, '')}`;
  const cardRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const faces = (images.length ? images : DEFAULT_IMAGES).slice(0, 4);

  const [turn, setTurn] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [snap, setSnap] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);

  const canAutoplay = faces.length > 1 && !reducedMotion;
  const isPaused = userPaused || hoverPaused || focusPaused || !canAutoplay;
  const incoming = faces[turn % faces.length] || faces[0];
  const outgoing = faces[(turn + faces.length - 1) % faces.length] || incoming;
  const leavingIndex = (turn + faces.length - 1) % faces.length;
  const enteringIndex = turn % faces.length;

  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;

    const syncSize = () => {
      node.style.setProperty('--zse-half', `${node.clientWidth / 2}px`);
    };
    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!snap) return undefined;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSnap(false));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [snap]);

  useEffect(() => {
    if (isPaused || spinning || snap) return undefined;

    const timer = window.setTimeout(() => {
      setSpinning(true);
      setTurn(value => value + 1);
    }, holdMs);

    return () => window.clearTimeout(timer);
  }, [holdMs, isPaused, spinning, snap, turn]);

  function handleTransitionEnd(event) {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'transform') return;
    if (!spinning) return;

    setSpinning(false);
    if (turn >= faces.length) {
      setSnap(true);
      setTurn(0);
    }
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusPaused(false);
    }
  }

  return (
    <section
      ref={cardRef}
      className={[
        'zse',
        spinning && canAutoplay ? 'zse--spinning' : '',
        snap ? 'zse--snap' : '',
        reducedMotion ? 'zse--static' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        '--zse-spin-ms': `${spinMs}ms`,
        '--zse-turn': String(turn),
        '--zse-seam-filter': `url(#${blurId})`,
      }}
      aria-label="تجربه فروشگاه‌های زوپینی"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={handleBlur}
    >
      <svg className="zse__svg-filters" aria-hidden="true" focusable="false">
        <filter
          id={blurId}
          x="-12%"
          y="-4%"
          width="124%"
          height="108%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="14 0"
            edgeMode="duplicate"
          />
        </filter>
      </svg>

      <div className="zse__fill" aria-hidden="true">
        <img className="zse__fill-image" src={outgoing.src} alt="" />
        <img className="zse__fill-image" src={incoming.src} alt="" />
      </div>

      <div className="zse__stage">
        <div className="zse__spin">
          <div className="zse__cube" onTransitionEnd={handleTransitionEnd}>
            {faces.map((face, index) => (
              <figure
                className={[
                  'zse__face',
                  spinning && index === leavingIndex
                    ? 'zse__face--leaving'
                    : '',
                  spinning && index === enteringIndex
                    ? 'zse__face--entering'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={`${face.src}-${index}`}
                style={{
                  backgroundImage: `url(${face.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <img
                  className="zse__image"
                  src={face.src}
                  alt={index === turn % faces.length ? incoming.alt : ''}
                  draggable="false"
                  decoding={index === 0 ? 'sync' : 'async'}
                  fetchPriority={index === 0 ? 'high' : 'low'}
                />
                <img
                  className="zse__image zse__image--seam"
                  src={face.src}
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                />
              </figure>
            ))}
          </div>
        </div>
      </div>

      {canAutoplay ? (
        <button
          className="zse__pause"
          type="button"
          aria-label={userPaused ? 'پخش نمایش فروشگاه' : 'توقف نمایش فروشگاه'}
          aria-pressed={userPaused}
          onClick={() => setUserPaused(value => !value)}
        >
          {userPaused ? (
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.2 1.2v9.6L11 6 2.2 1.2z" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <rect x="2" y="1.4" width="2.4" height="9.2" />
              <rect x="7.6" y="1.4" width="2.4" height="9.2" />
            </svg>
          )}
        </button>
      ) : null}

      <div className="zse__preload" aria-hidden="true">
        {faces.map(face => (
          <img key={face.src} src={face.src} alt="" />
        ))}
      </div>
    </section>
  );
}
