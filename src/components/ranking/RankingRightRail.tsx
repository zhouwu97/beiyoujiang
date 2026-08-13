'use client';

import Link from 'next/link';
import type { Toy } from '@/lib/types';
import { formatCount } from '@/lib/utils';
import ToyImage from '@/components/toy/ToyImage';
import { stimulationLabel } from '@/lib/toyLabels';

interface RankingRightRailProps {
  weeklyTop: Toy | null;
  /** 榜单第 1 名 id（若 weeklyTop 已是 Top1 则不重复展示右栏冠军卡） */
  topToyId?: number;
}

/**
 * 榜单右栏：本周冠军（独立） + 简短榜单规则。
 * 只展示主列没有的额外信息，不重复筛选状态。
 */
export default function RankingRightRail({ weeklyTop, topToyId }: RankingRightRailProps) {
  const showWeekly = weeklyTop !== null && weeklyTop.id !== topToyId;

  return (
    <div className="space-y-4">
      {showWeekly && weeklyTop && (
        <section className="rail-panel p-4">
          <div className="rail-kicker">每周更新</div>
          <h2 className="mt-1.5 text-[14px] font-bold text-[var(--ink)]">本周冠军</h2>
          <Link
            href={`/bang/${weeklyTop.id}`}
            className="group mt-3 block rounded-[14px] border border-[var(--line)] bg-[#f4f2f0] p-3 transition-colors duration-200 hover:border-[rgba(26,24,28,0.16)]"
          >
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-[10px] bg-white p-2">
              <ToyImage src={weeklyTop.coverUrl?.[0]} alt={weeklyTop.name} className="h-full w-full object-contain" />
            </div>
            <div className="mt-2.5">
              <p className="truncate text-[13px] font-bold text-[var(--ink)]">{weeklyTop.name}</p>
              <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">
                {weeklyTop.merchant} · {stimulationLabel(weeklyTop.stimulation)}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-[11px]">
                <span className="font-black text-[var(--accent)]">{weeklyTop.rating ?? '-'} 分</span>
                <span className="text-[var(--muted)]">{formatCount(weeklyTop.reviewCount ?? 0)} 测评</span>
              </p>
            </div>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-ink)] transition-colors duration-150 group-hover:text-[var(--accent)]">
              查看详情
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h13" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </Link>
        </section>
      )}

      <section className="rail-panel p-4">
        <div className="rail-kicker">榜单规则</div>
        <h2 className="mt-1.5 text-[14px] font-bold text-[var(--ink)]">说明</h2>
        <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">
          榜单按官方站实时数据排序，每周更新。
          <br />
          评分、测评量与想中数作为商品信息展示。
        </p>
      </section>
    </div>
  );
}
