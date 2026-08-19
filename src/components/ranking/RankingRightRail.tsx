'use client';

import Link from 'next/link';
import type { Toy } from '@/lib/types';
import { formatCount } from '@/lib/utils';
import ToyImage from '@/components/toy/ToyImage';
import { stimulationLabel } from '@/lib/toyLabels';

interface RankingRightRailProps {
  weeklyTop: Toy;
}

/**
 * 榜单右栏：本周冠军卡。
 * 由页面在「本周冠军 ≠ 当前榜首」时才渲染（否则整页收成两栏，无幽灵右栏）；
 * 榜单规则已上移到标题旁 ⓘ Popover，不再占右栏空间。
 */
export default function RankingRightRail({ weeklyTop }: RankingRightRailProps) {
  return (
    <section className="rail-panel p-4">
      <div className="rail-kicker">每周更新</div>
      <h2 className="mt-1.5 text-[14px] font-bold text-[var(--ink)]">本周冠军</h2>
      <Link
        href={`/bang/${weeklyTop.id}`}
        className="group mt-3 block rounded-[14px] border border-[var(--line)] bg-[var(--surface-subtle)] p-3 transition-colors duration-200 hover:border-[rgba(26,24,28,0.16)]"
      >
        <div className="flex h-28 items-center justify-center overflow-hidden rounded-[10px] bg-white p-2">
          <ToyImage src={weeklyTop.coverUrl?.[0]} alt={weeklyTop.name} className="h-full w-full object-contain" />
        </div>
        <div className="mt-2.5">
          <p className="truncate text-[13px] font-bold text-[var(--ink)]">{weeklyTop.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
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
  );
}
