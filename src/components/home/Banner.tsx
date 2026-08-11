'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const BANNERS = [
  // 首页主视觉使用随应用发布的静态资源，避免外部图片服务异常时 Banner 留白。
  { id: 1, img: '/images/banners/community-featured.webp', postId: 2321, label: '社区精选' },
  { id: 2, img: '/images/banners/experience-sharing.webp', postId: 448, label: '体验分享' },
];

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

/**
 * 顶部 Banner 轮播（参考稿 hero-frame）：
 * 高 260px 圆角外框，图片 object-fit: fill（拉伸沾满外框）；
 * 左右箭头默认隐藏，hover 后淡入；dot 6×6，active 拉长为 20px。
 */
export default function Banner() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent((index + BANNERS.length) % BANNERS.length);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((value) => (value + 1) % BANNERS.length);
    }, 15000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) goTo(delta < 0 ? current + 1 : current - 1);
  };

  return (
    <div
      className="hero-frame"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="轮播"
      aria-label="社区精选内容"
    >
      <div className="hero-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {BANNERS.map((banner) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`查看${banner.label}`}
            className="hero-slide"
            onClick={() => router.push(`/messageDetail/${banner.postId}`)}
          >
            <Image
              src={banner.img}
              alt={banner.label}
              fill
              priority={banner.id === 1}
              sizes="(min-width: 1280px) 820px, 100vw"
              className="object-fill"
              draggable={false}
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="banner-arrow prev"
        onClick={() => goTo(current - 1)}
        aria-label="上一张"
      >
        <ChevronIcon direction="left" />
      </button>
      <button
        type="button"
        className="banner-arrow next"
        onClick={() => goTo(current + 1)}
        aria-label="下一张"
      >
        <ChevronIcon direction="right" />
      </button>

      <div className="hero-dots" aria-label="轮播位置">
        {BANNERS.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            className={`hero-dot${index === current ? ' active' : ''}`}
            data-active={index === current}
            onClick={() => goTo(index)}
            aria-label={`第${index + 1}张`}
            aria-current={index === current ? 'true' : undefined}
          />
        ))}
      </div>
    </div>
  );
}
