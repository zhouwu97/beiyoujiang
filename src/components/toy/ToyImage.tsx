'use client';

import { resolveToyImage } from '@/lib/utils';
import SafeImage from '@/components/common/SafeImage';

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
  const resolved = src ? resolveToyImage(src) : '';

  if (!resolved) return <div className={`flex h-full w-full items-center justify-center bg-[var(--surface-subtle)] text-[var(--muted-light)] ${className}`} role="img" aria-label={`${alt}暂无图片`}>暂无图片</div>;

  return (
    <SafeImage
      src={resolved}
      alt={alt}
      loading={loading}
      draggable={false}
      className={className}
    />
  );
}
