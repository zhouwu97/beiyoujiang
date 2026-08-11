'use client';

import { useState } from 'react';
import { resolveToyImage } from '@/lib/utils';

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[var(--surface-subtle)] text-[var(--muted-light)] ${className ?? ''}`}
      aria-hidden="true"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}

interface ToyImageProps {
  /** 原始文件名/相对路径/完整 URL，由组件统一解析并 contain 展示 */
  src: string | null | undefined;
  alt: string;
  /** 应用到图片与占位上的 class（尺寸、圆角、object-fit 等） */
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * 玩具图片统一组件：解析 URL、加载失败占位、contain、alt、lazy。
 * 榜单 / 详情 / 相似条目共用，禁止各页面维护各自的 fallback。
 */
export default function ToyImage({ src, alt, className = '', loading = 'lazy' }: ToyImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = src ? resolveToyImage(src) : '';

  if (!resolved || failed) {
    return <ImagePlaceholder className={className} />;
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      draggable={false}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
