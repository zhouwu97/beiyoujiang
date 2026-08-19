'use client';

import Link from 'next/link';
import type { Toy } from '@/lib/types';
import { formatCount } from '@/lib/utils';
import ToyImage from '@/components/toy/ToyImage';
import { categoryLabel, stimulationLabel } from '@/lib/toyLabels';
import styles from './ranking.module.css';

function ChampionBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#ffb45c] px-2.5 py-1 text-[11px] font-bold text-[#3a2a12]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      本周冠军
    </span>
  );
}

interface RankingTopThreeProps {
  toys: Toy[];
  /** 榜单接口单独返回的 weeklyTop，用于判断是否在 Top1 上加「本周冠军」角标 */
  weeklyTop: Toy | null;
}

/**
 * 榜单前三名（突出但克制的层级）：
 *  Top1 为深色 Feature 卡；Top2/3 为并排浅色卡。
 *  排名一律取数组顺序，不按评分重排。
 */
export default function RankingTopThree({ toys, weeklyTop }: RankingTopThreeProps) {
  if (toys.length === 0) return null;

  const [top, ...rest] = toys;
  const isWeeklyChampion = weeklyTop?.id === top.id;

  return (
    <div className="space-y-4">
      {/* Top 1 */}
      <Link
        href={`/bang/${top.id}`}
        className={`group block rounded-[22px] p-5 transition-transform duration-200 hover:-translate-y-0.5 sm:p-6 lg:p-7 ${styles.topFeature}`}
      >
        <div className={`flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7 ${styles.topFeatureContent}`}>
          <div className={`flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[var(--surface-subtle)] p-3 sm:h-40 sm:w-40 lg:h-44 lg:w-44 ${styles.topFeatureImage}`}>
            <ToyImage src={top.coverUrl?.[0]} alt={top.name} className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1 self-stretch sm:self-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {isWeeklyChampion && <ChampionBadge />}
                <div className={`${isWeeklyChampion ? 'mt-3' : 'mt-0'} text-[11px] font-bold tracking-[0.18em] text-white/35`}>
                  PRODUCT RANKING
                </div>
                <h2 className="mt-1.5 truncate text-xl font-bold tracking-[-0.03em] text-white sm:text-2xl">
                  {top.name}
                </h2>
                <p className="mt-1 truncate text-[12px] text-white/55">{top.merchant}</p>
                <p className="mt-1 truncate text-[11px] text-white/35">
                  {categoryLabel(top.category)} · {stimulationLabel(top.stimulation)}
                </p>
              </div>
              <span
                className={`text-4xl font-black tracking-tight sm:text-5xl ${
                  isWeeklyChampion ? 'text-[rgba(255,180,92,0.32)]' : 'text-white/18'
                }`}
                aria-hidden="true"
              >
                01
              </span>
            </div>

            <div className="mt-4 flex items-center gap-6 border-t border-white/10 pt-3.5">
              <div>
                <div
                  className={`text-xl font-black leading-none sm:text-2xl ${
                    isWeeklyChampion ? 'text-[#ffb45c]' : 'text-white'
                  }`}
                >
                  {top.rating ?? '-'}
                </div>
                <div className="mt-1.5 text-[11px] text-white/45">评分</div>
              </div>
              <div>
                <div className="text-[15px] font-bold leading-none text-white/70">
                  {formatCount(top.reviewCount ?? 0)}
                </div>
                <div className="mt-1.5 text-[11px] text-white/45">测评</div>
              </div>
              <div>
                <div className="text-[15px] font-bold leading-none text-white/70">
                  {formatCount(top.wantCount ?? 0)}
                </div>
                <div className="mt-1.5 text-[11px] text-white/45">想中</div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Top 2 / Top 3 */}
      {rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.slice(0, 2).map((toy, index) => {
            const rank = index + 2;
            const isSecond = rank === 2;
            return (
              <Link
                key={toy.id}
                href={`/bang/${toy.id}`}
                className={`group flex min-h-[116px] items-center gap-4 rounded-[18px] border p-4 transition-[box-shadow,border-color] duration-200 hover:shadow-[0_14px_36px_rgba(37,27,31,0.07)] ${
                  isSecond
                    ? 'border-[var(--line)] bg-white hover:border-[rgba(26,24,28,0.18)]'
                    : 'border-[#ebdcd0] bg-[#fdfbf9] hover:border-[#dbc5b3]'
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-black ${
                    isSecond ? 'bg-[#ececea] text-[#716b6e]' : 'bg-[#f4ebe1] text-[#8a6a48]'
                  }`}
                  aria-hidden="true"
                >
                  {String(rank).padStart(2, '0')}
                </span>
                <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[var(--surface-subtle)] p-2 xl:h-[92px] xl:w-[92px]">
                  <ToyImage src={toy.coverUrl?.[0]} alt={toy.name} className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-[var(--ink)]">{toy.name}</span>
                  <span className="mt-1 block truncate text-[11px] text-[var(--muted)]">{toy.merchant}</span>
                  <span className="mt-1 block truncate text-[11px] text-[var(--muted-light)]">
                    {categoryLabel(toy.category)} · {stimulationLabel(toy.stimulation)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end">
                  <span className="text-[19px] font-black leading-none text-[var(--ink)]">{toy.rating ?? '-'}</span>
                  <span className="mt-1.5 text-[11px] font-semibold text-[var(--muted-light)]">
                    {formatCount(toy.reviewCount ?? 0)} 测评
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
