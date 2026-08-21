'use client';

import { useState, type ImgHTMLAttributes } from 'react';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  /** 复用图片区域尺寸，避免失败时页面塌陷。 */
  fallbackClassName?: string;
}

/** 图片统一降级组件：保留尺寸、展示可读占位，并允许用户主动重试。 */
export default function SafeImage({ src, alt, className, fallbackClassName, onError, ...props }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (failedSrc === src) {
    return (
      <div
        className={`flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-1 bg-[var(--surface-subtle)] text-[11px] text-[var(--muted-light)] ${fallbackClassName ?? className ?? ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${alt || '图片'}加载失败，点击重试`}
        title="点击重试"
        onClick={(event) => {
          // SafeImage 可能位于搜索结果 button 内，重试时不能触发外层导航。
          event.stopPropagation();
          setFailedSrc(null);
          setAttempt((value) => value + 1);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          setFailedSrc(null);
          setAttempt((value) => value + 1);
        }}
      >
        <span>图片加载失败</span>
        <span className="text-[var(--accent)]">点击重试</span>
      </div>
    );
  }

  const retrySrc = attempt > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src;
  return (
    <img
      {...props}
      src={retrySrc}
      alt={alt}
      className={className}
      onError={(event) => {
        onError?.(event);
        setFailedSrc(src);
      }}
    />
  );
}
