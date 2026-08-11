'use client';

import type { ToyDetail } from '@/lib/types';
import { formatCount } from '@/lib/utils';
import styles from './toy-detail.module.css';

interface ToyMetricsProps {
  toy: ToyDetail;
}

/**
 * 三个关键指标（社区评分 / 想冲 / 公开测评）：一个容器内部分隔，不再 cell 卡片化。
 */
export default function ToyMetrics({ toy }: ToyMetricsProps) {
  const rawScore = toy.score ?? toy.rating;
  const scoreDisplay = rawScore != null ? String(rawScore) : '-';

  return (
    <div className={styles.metrics}>
      <div className={styles.metric}>
        <span>社区评分</span>
        <b>
          {scoreDisplay}
          <small>/ 10</small>
        </b>
      </div>
      <div className={styles.metric}>
        <span>想中</span>
        <b>{formatCount(toy.wantCount)}</b>
      </div>
      <div className={styles.metric}>
        <span>公开测评</span>
        <b>
          {toy.reviewCount ?? 0}
          <small>篇</small>
        </b>
      </div>
    </div>
  );
}
