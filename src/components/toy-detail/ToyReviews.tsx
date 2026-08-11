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
}

/**
 * 社区测评列表：排序与点赞状态由页面管理，这里只做展示。
 */
export default function ToyReviews({ reviews, total, sortBy, onSortChange, onLike }: ToyReviewsProps) {
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

      {reviews.length === 0 ? (
        <div className={styles.empty}>
          <p>还没有公开测评，来做第一个分享体验的人吧~</p>
        </div>
      ) : (
        reviews.map((review) => (
          <ToyReviewItem key={review.id} review={review} onLike={onLike} />
        ))
      )}
    </section>
  );
}
