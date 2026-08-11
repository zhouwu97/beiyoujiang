'use client';

import type { Toy } from '@/lib/types';
import RankingRow from './RankingRow';

interface RankingListProps {
  /** 第 4 名起的切片（或任意从 offset 名开始的列表） */
  toys: Toy[];
  /** 起始排名 */
  offset: number;
}

/**
 * 第 4 名以后的列表容器：浅色 panel + 行间分隔线。
 */
export default function RankingList({ toys, offset }: RankingListProps) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white/90 px-2 py-1">
      {toys.map((toy, index) => (
        <RankingRow key={toy.id} toy={toy} rank={offset + index} />
      ))}
    </div>
  );
}
