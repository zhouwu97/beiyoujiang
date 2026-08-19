'use client';

import type { ToyReview } from '@/lib/types';
import ToyReviewItem from './ToyReviewItem';
import styles from './toy-detail.module.css';

interface ToyReviewsProps {
  reviews: ToyReview[];
  total: number;
  sortBy: 'latest' | 'useful';
  onSortChange: (sort: 'latest' | 'useful') => void;
  onLike: (review: ToyReview) => void;
  /** 测评加载失败（API 挂了 / 网络异常） */
  error?: boolean;
  /** 点击测评图片 → 打开大图查看器 */
  onPreview?: (url: string) => void;
}

/**
 * 社区测评列表：排序与点赞状态由页面管理，这里只做展示。
 */
export default function ToyReviews({ reviews, total, sortBy, onSortChange, onLike, error, onPreview }: ToyReviewsProps) {
  return (
    <section className={styles.reviews} aria-label="社区测评">
      <div className={styles.sectionHead}>
        <h2>
          社区测评 <span>{total}</span>
        </h2>
        <div className={styles.tabs} role="tablist" aria-label="测评排序">
          <button
            type="button"
            role="tab"
            aria-selected={sortBy === 'latest'}
            className={`${styles.tab}${sortBy === 'latest' ? ` ${styles.tabActive}` : ''}`}
            onClick={() => onSortChange('latest')}
          >
            最新
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sortBy === 'useful'}
            className={`${styles.tab}${sortBy === 'useful' ? ` ${styles.tabActive}` : ''}`}
            onClick={() => onSortChange('useful')}
          >
            最有用
          </button>
        </div>
      </div>

      {error ? (
        <div className={styles.empty}>
          <p>测评加载失败，请检查网络后重试</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles.empty}>
          <p>暂无公开测评</p>
        </div>
      ) : (
        reviews.map((review) => (
          <ToyReviewItem key={review.id} review={review} onLike={onLike} onPreview={onPreview} />
        ))
      )}
    </section>
  );
}
