'use client';

import type { ToyReview } from '@/lib/types';
import { resolveAvatar, resolveToyImage, sanitizeHtml } from '@/lib/utils';
import ToyImage from '@/components/toy/ToyImage';
import styles from './toy-detail.module.css';

function HeartRating({ score }: { score: number }) {
  return (
    <div className={styles.hearts} aria-label={`${score} 分`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={i <= score ? 'currentColor' : 'none'}
          stroke={i <= score ? 'currentColor' : 'var(--muted-light)'}
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
        </svg>
      ))}
    </div>
  );
}

interface ToyReviewItemProps {
  review: ToyReview;
  onLike: (review: ToyReview) => void;
  /** 点击测评图片 → 打开大图查看器（页面持有预览状态） */
  onPreview?: (url: string) => void;
}

/** 按图片数量决定布局：1 张大图 / 2 张并排 / 3~4 张缩略网格 */
function reviewImagesLayout(count: number): string {
  if (count === 1) return styles.single;
  if (count === 2) return styles.pair;
  return styles.thumb;
}

/**
 * 单条测评：状态（点赞）提升到页面，组件只负责展示与回调。
 */
export default function ToyReviewItem({ review, onLike, onPreview }: ToyReviewItemProps) {
  const images = review.images ?? [];

  return (
    <article className={styles.review}>
      <div className={styles.reviewHead}>
        <img src={resolveAvatar(review.author?.photo)} alt="" className={styles.avatar} loading="lazy" />
        <div className={styles.reviewUser}>
          <strong>{review.author?.username ?? '杯友'}</strong>
          <HeartRating score={review.score} />
        </div>
        <span className={styles.reviewTime}>{review.timeString}</span>
      </div>

      <div
        className={styles.reviewBody}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(review.content) }}
      />

      {images.length > 0 && (
        <div className={`${styles.reviewImgs} ${reviewImagesLayout(images.length)}`}>
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className={styles.reviewImgBtn}
              onClick={() => onPreview?.(resolveToyImage(img))}
              aria-label="查看大图"
            >
              <ToyImage src={img} alt="" className={styles.reviewImg} />
            </button>
          ))}
        </div>
      )}

      <div className={styles.reviewFoot}>
        <button
          type="button"
          onClick={() => onLike(review)}
          className={`${styles.likeBtn}${review.isLiked ? ` ${styles.liked}` : ''}`}
          aria-pressed={review.isLiked}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={review.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
          </svg>
          {review.likeCount}
        </button>
        {review.replyCount ? <span>回复 {review.replyCount}</span> : null}
      </div>
    </article>
  );
}
