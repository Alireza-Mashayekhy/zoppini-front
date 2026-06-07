'use client';

import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ========== مسیر تصاویر خود را اینجا اصلاح کنید ==========
// تصاویر باید در پوشه public قرار داشته باشند، مثلاً public/home/5 (5).jpg
const DESKTOP_IMAGES = [
  '/home/5 (5).jpg',
  '/home/21 (4).jpg',
  '/home/24 (4).jpg',
];
const MOBILE_IMAGES = [
  '/home/5 (5).jpg',
  '/home/21 (4).jpg',
  '/home/24 (4).jpg',
]; // =====================================================

const POINTS_COUNT = 12;
const MAX_DIM = 2000; // حداکثر بعد تصویر (کیفیت عالی و عملکرد خوب)
const STEP = 1; // هر پیکسل یک ذره

// ---------- Vertex Shader (کامل) ----------
const vertexShader = `
  float PI = 3.1415926535897932384626433;
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) { 
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  uniform vec3 p1v; uniform vec3 p1c;
  uniform vec3 p2v; uniform vec3 p2c;
  uniform vec3 p3v; uniform vec3 p3c;
  uniform vec3 p4v; uniform vec3 p4c;
  uniform vec3 p5v; uniform vec3 p5c;
  uniform vec3 p6v; uniform vec3 p6c;
  uniform vec3 p7v; uniform vec3 p7c;
  uniform vec3 p8v; uniform vec3 p8c;
  uniform vec3 p9v; uniform vec3 p9c;
  uniform vec3 p10v; uniform vec3 p10c;
  uniform vec3 p11v; uniform vec3 p11c;
  uniform vec3 p12v; uniform vec3 p12c;

  uniform float progress;
  uniform float w;
  uniform float h;

  attribute vec3 aCoordinates;
  varying vec2 vCoordinates;
  varying float delayedProgress;

  void main() {
    vec3 position = position;
    float shortest = max(w, h) + 1.0;
    vec3 color = vec3(0.0);
    vec3 closest = vec3(0.0);
    float d;
    d = distance(p1v,position); if(d < shortest) { shortest = d; closest = p1v; color = p1c; }
    d = distance(p2v,position); if(d < shortest) { shortest = d; closest = p2v; color = p2c; }
    d = distance(p3v,position); if(d < shortest) { shortest = d; closest = p3v; color = p3c; }
    d = distance(p4v,position); if(d < shortest) { shortest = d; closest = p4v; color = p4c; }
    d = distance(p5v,position); if(d < shortest) { shortest = d; closest = p5v; color = p5c; }
    d = distance(p6v,position); if(d < shortest) { shortest = d; closest = p6v; color = p6c; }
    d = distance(p7v,position); if(d < shortest) { shortest = d; closest = p7v; color = p7c; }
    d = distance(p8v,position); if(d < shortest) { shortest = d; closest = p8v; color = p8c; }
    d = distance(p9v,position); if(d < shortest) { shortest = d; closest = p9v; color = p9c; }
    d = distance(p10v,position); if(d < shortest) { shortest = d; closest = p10v; color = p10c; }
    d = distance(p11v,position); if(d < shortest) { shortest = d; closest = p11v; color = p11c; }
    d = distance(p12v,position); if(d < shortest) { shortest = d; closest = p12v; color = p12c; }

    vCoordinates = aCoordinates.xy;
    float dir = color.x > 0.5 ? -1.0 : 1.0;
    float progressPerc = progress / 100.0;
    float lowerBound = color.r * 0.5;
    float upperBound = 1.0 - (color.g * 0.5);
    delayedProgress = smoothstep(lowerBound, upperBound, progressPerc);
    float leverProgress = 1.0 - abs((delayedProgress - 0.5) * 2.0);

    vec3 newPos = position;
    float dst = distance(closest, newPos);
    float a = newPos.y - closest.y;
    float b = newPos.x - closest.x;
    float angle = atan(a, b);
    angle += 6.28318 * delayedProgress;
    float x = cos(angle) * dst;
    float y = sin(angle) * dst;
    newPos.x = closest.x + x;
    newPos.z = newPos.z + (closest.z + y) * leverProgress + (500.0 * leverProgress * dir);

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    gl_PointSize = 2000.0 * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// ---------- Fragment Shader (کامل) ----------
const fragmentShader = `
  uniform float progress;
  uniform float w;
  uniform float h;
  uniform sampler2D currentImg;
  uniform sampler2D nextImg;
  varying vec2 vCoordinates;
  varying float delayedProgress;

  void main() {
    vec2 imgUv = vec2(vCoordinates.x / w, vCoordinates.y / h);
    vec4 current = texture2D(currentImg, imgUv);
    vec4 next = texture2D(nextImg, imgUv);
    vec4 image = mix(current, next, delayedProgress);
    gl_FragColor = image;
  }
`;

async function resizeImage(
  img: HTMLImageElement,
  maxDim: number,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    if (width > height && width > maxDim) {
      height = (height * maxDim) / width;
      width = maxDim;
    } else if (height > maxDim) {
      width = (width * maxDim) / height;
      height = maxDim;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D context'));
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(
      (blob: Blob | null) => {
        if (!blob) {
          reject(new Error('Canvas toBlob returned null'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const resizedImg = new Image();
        resizedImg.onload = () => {
          URL.revokeObjectURL(url);
          resolve(resizedImg);
        };
        resizedImg.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load resized image'));
        };
        resizedImg.src = url;
      },
      'image/jpeg',
      1.0,
    );
  });
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Points | null>(null);
  const pointsPosRef = useRef<THREE.Vector3[]>([]);
  const pointsAccRef = useRef<THREE.Vector3[]>([]);
  const pointsColorRef = useRef<THREE.Vector3[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const activeIndexRef = useRef<number>(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [imageList, setImageList] = useState<string[]>(DESKTOP_IMAGES);

  const [isReady, setIsReady] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const texturesRef = useRef<THREE.Texture[]>([]);

  useEffect(() => {
    if (imageList.length === 0) return; // منتظر بمان تا imageList پر شود

    const loadImages = async () => {
      try {
        // بارگذاری تصاویر اصلی
        const imgLoadPromises = imageList.map(src => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = err => {
              console.error(`Failed to load image: ${src}`, err);
              reject(new Error(`Failed to load ${src}`));
            };
            img.src = src;
          });
        });
        const imgs = await Promise.all(imgLoadPromises);

        // ریسایز همه تصاویر (با بررسی خروجی)
        const resizedImgs: HTMLImageElement[] = [];
        for (const img of imgs) {
          try {
            const resized = await resizeImage(img, MAX_DIM);
            if (!resized) {
              throw new Error('resizeImage returned null/undefined');
            }
            resizedImgs.push(resized);
          } catch (err) {
            console.error('Error resizing image:', err);
            // در صورت خطا در ریسایز، همان تصویر اصلی را استفاده کن (یا می‌توانی reject کنی)
            resizedImgs.push(img);
          }
        }

        if (resizedImgs.length === 0) throw new Error('No images after resize');
        const firstImg = resizedImgs[0];
        if (!firstImg) throw new Error('First image is undefined');
        const w = firstImg.width;
        const h = firstImg.height;
        console.log(`Resized image dimensions: ${w}x${h}`);
        setDimensions({ w, h });

        const textures = resizedImgs.map(img => {
          const tex = new THREE.Texture(img);
          tex.needsUpdate = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = true;
          return tex;
        });
        texturesRef.current = textures;
        setIsReady(true);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    loadImages();
  }, [imageList]);

  // مقداردهی صحنه (با STEP=1)
  useEffect(() => {
    if (!isReady || !dimensions.w || !dimensions.h) return;

    const { w, h } = dimensions;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      6000,
    );
    camera.position.set(0, 0, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // تولید نقاط
    const step = STEP;
    const cols = Math.ceil(w / step);
    const rows = Math.ceil(h / step);
    const particleCount = cols * rows;
    const positions = new Float32Array(particleCount * 3);
    const coordinates = new Float32Array(particleCount * 3);
    let idx = 0;
    for (let i = 0; i < cols; i++) {
      const x = i * step;
      for (let j = 0; j < rows; j++) {
        const y = j * step;
        positions[idx * 3] = x - w / 2;
        positions[idx * 3 + 1] = y - h / 2;
        positions[idx * 3 + 2] = 0;
        coordinates[idx * 3] = x;
        coordinates[idx * 3 + 1] = y;
        coordinates[idx * 3 + 2] = 0;
        idx++;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      'aCoordinates',
      new THREE.BufferAttribute(coordinates, 3),
    );

    // نقاط ورونوی متحرک
    const pointsPos: THREE.Vector3[] = [];
    const pointsAcc: THREE.Vector3[] = [];
    const pointsColor: THREE.Vector3[] = [];
    for (let i = 0; i < POINTS_COUNT; i++) {
      pointsPos.push(
        new THREE.Vector3(
          Math.random() * w - w / 2,
          Math.random() * h - h / 2,
          0,
        ),
      );
      pointsAcc.push(
        new THREE.Vector3(
          Math.random() * 20 * (Math.random() < 0.5 ? 1 : -1),
          Math.random() * 20 * (Math.random() < 0.5 ? 1 : -1),
          0,
        ),
      );
      pointsColor.push(
        new THREE.Vector3(Math.random(), Math.random(), Math.random()),
      );
    }
    pointsPosRef.current = pointsPos;
    pointsAccRef.current = pointsAcc;
    pointsColorRef.current = pointsColor;

    // یونیفرم‌ها
    const uniforms: { [key: string]: THREE.IUniform } = {
      progress: { value: 0 },
      w: { value: w },
      h: { value: h },
      currentImg: { value: texturesRef.current[0] },
      nextImg: { value: texturesRef.current[1] },
    };
    for (let i = 1; i <= POINTS_COUNT; i++) {
      uniforms[`p${i}v`] = { value: pointsPos[i - 1] };
      uniforms[`p${i}c`] = { value: pointsColor[i - 1] };
    }

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: false,
      depthTest: false,
      depthWrite: false,
    });

    const pointsMesh = new THREE.Points(geometry, shaderMaterial);
    scene.add(pointsMesh);
    meshRef.current = pointsMesh;

    // تنظیم anistropy حداکثر
    if (renderer.capabilities) {
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      texturesRef.current.forEach(tex => {
        tex.anisotropy = maxAniso;
      });
    }

    // حالت cover
    const fitToScreen = () => {
      const windowAspect = window.innerWidth / window.innerHeight;
      const imageAspect = w / h;
      let scaleX: number, scaleY: number;
      if (windowAspect > imageAspect) {
        scaleX = window.innerWidth / w;
        scaleY = scaleX;
      } else {
        scaleY = window.innerHeight / h;
        scaleX = scaleY;
      }
      pointsMesh.scale.set(scaleX, scaleY, 1);
    };
    fitToScreen();
    const handleResize = () => {
      if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
      if (renderer) renderer.setSize(window.innerWidth, window.innerHeight);
      fitToScreen();
    };
    window.addEventListener('resize', handleResize);

    // انیمیشن نقاط ورونوی
    const animate = () => {
      if (!meshRef.current) return;
      const material = meshRef.current.material;
      if (!(material instanceof THREE.ShaderMaterial)) return;

      const pts = pointsPosRef.current;
      const accs = pointsAccRef.current;
      const wLim = w / 2;
      const hLim = h / 2;
      for (let i = 0; i < POINTS_COUNT; i++) {
        pts[i].x += accs[i].x;
        pts[i].y += accs[i].y;
        if (pts[i].x <= -wLim) {
          pts[i].x = -wLim;
          accs[i].x *= -1;
        }
        if (pts[i].x >= wLim) {
          pts[i].x = wLim;
          accs[i].x *= -1;
        }
        if (pts[i].y <= -hLim) {
          pts[i].y = -hLim;
          accs[i].y *= -1;
        }
        if (pts[i].y >= hLim) {
          pts[i].y = hLim;
          accs[i].y *= -1;
        }
        material.uniforms[`p${i + 1}v`].value = pts[i];
      }
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      geometry.dispose();
      shaderMaterial.dispose();
      texturesRef.current.forEach(tex => tex.dispose());
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, [isReady, dimensions]);

  // تغییر اسلاید (بدون فلش)
  const transitionTo = (newIndex: number) => {
    if (isTransitioningRef.current) return;
    const currentActive = activeIndexRef.current;
    if (newIndex === currentActive) return;
    isTransitioningRef.current = true;

    if (tweenRef.current) tweenRef.current.kill();

    if (meshRef.current) {
      const material = meshRef.current.material;
      if (material instanceof THREE.ShaderMaterial) {
        material.uniforms.progress.value = 0;
      }
    }

    const currentTex = texturesRef.current[currentActive];
    const nextTex = texturesRef.current[newIndex];
    if (meshRef.current) {
      const material = meshRef.current.material;
      if (material instanceof THREE.ShaderMaterial) {
        material.uniforms.currentImg.value = currentTex;
        material.uniforms.nextImg.value = nextTex;
      }
    }

    const progressObj = { val: 0 };
    tweenRef.current = gsap.to(progressObj, {
      val: 100,
      duration: 2,
      ease: 'power1.inOut',
      onUpdate: () => {
        if (meshRef.current) {
          const material = meshRef.current.material;
          if (material instanceof THREE.ShaderMaterial) {
            material.uniforms.progress.value = progressObj.val;
          }
        }
      },
      onComplete: () => {
        activeIndexRef.current = newIndex;
        isTransitioningRef.current = false;
      },
    });
  };
  const handleNext = () => {
    if (isTransitioningRef.current) return;
    let newIdx = activeIndexRef.current + 1;
    if (newIdx >= imageList.length) newIdx = 0;
    transitionTo(newIdx);
  };

  useEffect(() => {
    if (!isReady) return;
    // شروع تایمر
    intervalRef.current = setInterval(() => {
      handleNext();
    }, 5000); // ۳ ثانیه

    // پاکسازی تایمر هنگام unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isReady]); // وابستگی به isReady تا بعد از بارگذاری تصاویر شروع شود

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setImageList(isMobile ? MOBILE_IMAGES : DESKTOP_IMAGES);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />
    </>
  );
}
