'use client';

import type { ToyDetail } from '@/lib/types';
import styles from './toy-detail.module.css';

interface ScoreDistributionProps {
  toy: ToyDetail;
}

/**
 * 评分分布：accent 纯色条形，不做渐变/发光。
 */
export default function ScoreDistribution({ toy }: ScoreDistributionProps) {
  // 实测 getToy 返回的评分分布字段名是 starCounts
  const scoreDist = toy.starCounts ?? toy.scoreDistribution ?? {};
  const total = Object.values(scoreDist).reduce((a, b) => a + b, 0);
  const rawScore = toy.score ?? toy.rating;
  const scoreDisplay = rawScore != null ? String(rawScore) : '-';

  return (
    <div className={styles.scoreBox}>
      <div className={styles.scoreMain}>
        <span>评分分布</span>
        <strong>{scoreDisplay}</strong>
        <small>{total} 人参与</small>
      </div>
      <div className={styles.bars}>
        {['5', '4', '3', '2', '1'].map((key) => {
          const count = scoreDist[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className={styles.bar}>
              <span>{key}</span>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${pct}%` }} />
              </div>
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
