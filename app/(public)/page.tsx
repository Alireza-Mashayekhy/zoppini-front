'use client';

import 'keen-slider/keen-slider.min.css';

import CategoriesSection from '@/components/pages/home/category-section';
import HeroSection from '@/components/pages/home/hero-section';

// gsap.registerPlugin(Observer);

export default function StackedPanels() {
  // const container = useRef<HTMLDivElement>(null);

  // const [sliderRef] = useKeenSlider({
  //   rtl: true,
  //   slides: {
  //     perView: 3.5,
  //     spacing: 2,
  //   },
  // });

  // const products = [
  //   {
  //     videoSrc: '/home/video-2.mov',
  //     name: 'لینن کالکشن',
  //     enName: 'linkencollenction',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F19.jpg&w=640&q=90',
  //     name: 'کت تک',
  //     enName: 'coat&vest',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2Fshacket-green-2513902-1-0.jpg&w=640&q=90',
  //     name: 'پیراهن',
  //     enName: 'shirt',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F20.jpg&w=640&q=90',
  //     name: 'شلوار',
  //     enName: 'pants',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F11.jpg&w=640&q=90',
  //     name: 'اسنیکرز',
  //     enName: 'sneakers',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F21.jpg&w=640&q=90',
  //     name: 'پولوشرت',
  //     enName: 'poloshirt',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F16.jpg&w=640&q=90',
  //     name: 'تخته نرد',
  //     enName: 'backgammon',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F18.jpg&w=640&q=90',
  //     name: 'شلوارک',
  //     enName: 'short',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F12.1.jpg&w=640&q=90',
  //     name: 'کالج',
  //     enName: 'loafer',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F17.jpg&w=640&q=90',
  //     name: 'تی شرت',
  //     enName: 't-shirt',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F405%2FSlider%2F13.1.jpg&w=640&q=90',
  //     name: 'شکت و روپوش',
  //     enName: 'overshirt',
  //   },
  //   {
  //     src: 'https://corumofficial.com/_next/image?url=%2Fapi%2Fdynamic-assets%2Ffiles%2Fimages%2F168%2Fwebsite-menu%2F404%2FMehr404%2Fslider%2FNeww%2Foxford-shoes-brown-2512019-1.jpg&w=640&q=90',
  //     name: 'کفش آکسفورد',
  //     enName: 'oxfordshoes',
  //   },
  // ];

  // useEffect(() => {
  //   const ctx = gsap.context(() => {
  //     const panels = gsap.utils.toArray<HTMLElement>('.panel');

  //     gsap.set(panels, {
  //       yPercent: 100,
  //     });

  //     gsap.set(panels[0], {
  //       yPercent: 0,
  //     });

  //     gsap.set(panels, {
  //       opacity: 1,
  //     });

  //     let currentIndex = 0;
  //     let animating = false;

  //     const gotoPanel = (index: number, direction: number) => {
  //       if (animating || index < 0 || index >= panels.length) return;

  //       animating = true;

  //       const current = panels[currentIndex];
  //       const next = panels[index];

  //       const tl = gsap.timeline({
  //         defaults: {
  //           duration: 0.6,
  //           ease: 'power2.out',
  //         },
  //         onComplete: () => {
  //           currentIndex = index;
  //           animating = false;
  //         },
  //       });

  //       if (direction > 0) {
  //         // scroll down
  //         gsap.set(next, { yPercent: 100 });

  //         tl.to(
  //           next,
  //           {
  //             yPercent: 0,
  //           },
  //           0,
  //         );
  //       } else {
  //         // scroll up
  //         gsap.set(next, { yPercent: 0 });

  //         tl.to(
  //           current,
  //           {
  //             yPercent: 100,
  //           },
  //           0,
  //         );
  //       }
  //     };

  //     Observer.create({
  //       target: window,
  //       type: 'wheel,touch',
  //       preventDefault: true,
  //       tolerance: 10,
  //       onUp: () => gotoPanel(currentIndex - 1, -1),
  //       onDown: () => gotoPanel(currentIndex + 1, 1),
  //     });
  //   }, container);

  //   return () => ctx.revert();
  // }, []);

  return (
    <div>
      <div className="h-screen">
        <HeroSection />
      </div>
      <CategoriesSection />
      {/* <SectionContainer isFirstChild>
        <Image
          alt="hero section"
          fill
          loading="eager"
          objectFit="cover"
          src="/home/24 (4).jpg"
        />
      </SectionContainer>
      <SectionContainer>
        <Image
          alt="hero section"
          fill
          objectFit="cover"
          src="/home/5 (5).jpg"
        />
      </SectionContainer>
      <SectionContainer>
        <Image
          alt="hero section"
          fill
          objectFit="cover"
          src="/home/21 (4).jpg"
        />
      </SectionContainer>
      <SectionContainer>
        <Image
          alt="hero section"
          fill
          objectFit="cover"
          src="/home/24 (4).jpg"
        />
      </SectionContainer>
      <SectionContainer>
        <div ref={sliderRef} className="keen-slider h-full">
          {products.map(product => (
            <div
              key={product.name}
              className="keen-slider__slide flex flex-col h-full"
            >
              {product.videoSrc ? (
                <video
                  autoPlay
                  muted
                  loop
                  controls={false}
                  className="w-full h-full object-cover"
                >
                  <source className="w-full h-full" src={product.videoSrc} />
                </video>
              ) : (
                <div className="h-full relative">
                  <Image
                    alt="product"
                    fill
                    objectFit="cover"
                    src={product.src || ''}
                  />
                </div>
              )}
              <div className="bg-[#c9c3b7] h-16 flex flex-col items-center justify-center relative">
                <div className="text-[#111] text-xs py-1">
                  {product.enName.toUpperCase()}
                </div>
                <div className="text-[#111] text-xs py-1">{product.name}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionContainer> */}
    </div>
  );
}
