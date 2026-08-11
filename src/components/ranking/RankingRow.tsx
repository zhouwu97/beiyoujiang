'use client';

import Link from 'next/link';
import type { Toy } from '@/lib/types';
import { formatCount } from '@/lib/utils';
import ToyImage from '@/components/toy/ToyImage';
import styles from './ranking.module.css';

interface RankingRowProps {
  toy: Toy;
  /** 真实排名（第 4 名起） */
  rank: number;
}

/**
 * 第 4 名以后的单行：高信息密度列表行，整体为 Link（可键盘访问、可右键新标签）。
 * 封面 68px + contain，完整展示包装，不 cover 硬裁。
 */
export default function RankingRow({ toy, rank }: RankingRowProps) {
  return (
    <Link href={`/bang/${toy.id}`} className={styles.row}>
      <span className={styles.rowRank} aria-label={`第 ${rank} 名`}>
        {rank}
      </span>
      <span className={styles.rowStage}>
        <ToyImage src={toy.coverUrl?.[0]} alt={toy.name} className="h-full w-full object-contain" />
      </span>
      <span className={styles.rowInfo}>
        <span className={styles.rowName}>{toy.name}</span>
        <span className={styles.rowMeta}>{toy.merchant}</span>
        <span className={styles.rowTags}>{toy.tags}</span>
      </span>
      <span className={styles.rowScore}>
        <span className={styles.rowScoreValue}>{toy.rating ?? '-'}</span>
        <span className={styles.rowScoreLabel}>评分</span>
        <span className={styles.rowScoreLabel}>
          {formatCount(toy.reviewCount ?? 0)} 测评 · {formatCount(toy.wantCount ?? 0)} 想中
        </span>
      </span>
    </Link>
  );
}
