'use client';

import { memo, useState } from 'react';
import type { MouseEvent, SyntheticEvent } from 'react';
import { resolvePostImage } from '@/lib/utils';
import SafeImage from '@/components/common/SafeImage';

/**
 * 帖子图片统一渲染组件（PostCard / 未来详情预览共用）。
 *
 * - 单图：按原始宽高比完整展示，禁止固定比例 / cover / 缩略框。
 *   通过 naturalWidth / naturalHeight 计算宽度：width = clamp(250, 420·√ratio, 680)，
 *   只设置宽度，高度由比例自然推出；用 max-width / max-height + object-fit:contain 兜底，
 *   因此超高截图不会细成一根，也绝不拉伸、不裁切。
 * - 多图：2 图并排、3 图一行、4 图 2×2；超过 maxCount 只展示前 N 张并在最后一张上叠 +N。
 *   网格内每张仍是 contain，允许高度略有差异，不做电商式齐边裁切。
 *
 * 不修改 resolvePostImage 的 URL 解析逻辑。
 */

interface PostMediaProps {
  images?: string[];
  /** 首页最多展示张数（默认 4），超出时在第 maxCount 张上叠加 +N */
  maxCount?: number;
  /** 点击图片回调（调用方负责跳详情 / 开查看器），组件内已 stopPropagation */
  onImageClick?: (url: string, index: number) => void;
  /** default：首页密度；search：搜索结果页，单图明显放大（横 620 / 竖 320 / 其他 460） */
  variant?: 'default' | 'search';
}

/** 单图展示宽度：连续公式 + 高度上限回退，禁止 portrait/square/landscape 三档硬分类。 */
export function computeSingleWidth(naturalWidth: number, naturalHeight: number): number {
  if (!naturalWidth || !naturalHeight) return 0;

  const ratio = naturalWidth / naturalHeight;

  // 横图自然更宽、方图中等、竖图自然收窄，但不至于细成一根
  let width = clamp(250, 420 * Math.sqrt(ratio), 680);

  const height = width / ratio;
  const maxHeight = 460;
  if (height > maxHeight) {
    // 超高截图：以高度为上限缩放，同时保证容器不小于最小视觉宽度（250px）
    width = Math.max(250, maxHeight * ratio);
  }

  return Math.round(width);
}

/** 搜索结果页单图宽度：按自然比例分档，竖图不放小到缩略图。 */
export function computeSearchWidth(naturalWidth: number, naturalHeight: number): number {
  if (!naturalWidth || !naturalHeight) return 0;

  const ratio = naturalWidth / naturalHeight;
  let width = ratio >= 1.2 ? 620 : ratio <= 0.8 ? 320 : 460;

  const height = width / ratio;
  const maxHeight = 620;
  if (height > maxHeight) {
    width = Math.max(220, maxHeight * ratio);
  }

  return Math.round(width);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 单图：保持原始比例，加载后按连续公式定宽。 */
function SingleImage({
  url,
  onClick,
  variant,
}: {
  url: string;
  onClick?: (url: string, index: number) => void;
  variant: 'default' | 'search';
}) {
  const [width, setWidth] = useState<number | null>(null);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const w =
      variant === 'search'
        ? computeSearchWidth(img.naturalWidth, img.naturalHeight)
        : computeSingleWidth(img.naturalWidth, img.naturalHeight);
    if (w > 0) setWidth(w);
  };

  return (
    <SafeImage
      src={resolvePostImage(url)}
      alt=""
      loading="lazy"
      className="post-media-single"
      style={width ? { width: `${width}px` } : undefined}
      onLoad={handleLoad}
      onClick={(event: MouseEvent<HTMLImageElement>) => {
        event.stopPropagation();
        onClick?.(url, 0);
      }}
    />
  );
}

/** 多图网格：2/3 并排、4 个 2×2，超限叠 +N，每张 contain。 */
function MediaGrid({
  images,
  maxCount,
  onClick,
}: {
  images: string[];
  maxCount: number;
  onClick?: (url: string, index: number) => void;
}) {
  const shown = images.slice(0, maxCount);
  const moreCount = images.length - shown.length;
  const lastIndex = shown.length - 1;

  return (
    <div className="post-media-grid" data-count={shown.length}>
      {shown.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className={`post-media-cell${index === lastIndex && moreCount > 0 ? ' post-media-cell--more' : ''}`}
        >
          <SafeImage
            src={resolvePostImage(url)}
            alt=""
            loading="lazy"
            onClick={(event: MouseEvent<HTMLImageElement>) => {
              event.stopPropagation();
              onClick?.(url, index);
            }}
          />
          {index === lastIndex && moreCount > 0 && (
            <div className="post-media-more" aria-hidden="true">
              +{moreCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PostMedia({ images, maxCount = 4, onImageClick, variant = 'default' }: PostMediaProps) {
  const validImages = (images ?? []).filter((url) => typeof url === 'string' && url.trim().length > 0);

  if (validImages.length === 0) return null;

  // 单图走原比例连续公式；多图走网格
  if (validImages.length === 1) {
    return (
      <div className={`post-media${variant === 'search' ? ' post-media--search' : ''}`}>
        <SingleImage url={validImages[0]} onClick={onImageClick} variant={variant} />
      </div>
    );
  }

  return (
    <div className={`post-media${variant === 'search' ? ' post-media--search' : ''}`}>
      <MediaGrid images={validImages} maxCount={maxCount} onClick={onImageClick} />
    </div>
  );
}

export default memo(PostMedia);
