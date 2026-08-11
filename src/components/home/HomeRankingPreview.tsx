'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Toy } from '@/lib/types';
import { getAllToy } from '@/lib/api';
import ToyImage from '@/components/toy/ToyImage';

/**
 * 首页右栏「本周玩具榜」预览：只显示真实榜单前 4 名（综合热榜）。
 * 加载失败或无数据时直接隐藏模块，绝不展示假榜单数据。
 */
export default function HomeRankingPreview() {
  const [toys, setToys] = useState<Toy[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllToy('', '', 0, 1, 4)
      .then((res) => {
        if (cancelled) return;
        if (res.list.length > 0) {
          setToys(res.list);
          setVisible(true);
        }
      })
      .catch(() => {
        if (!cancelled) setVisible(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <section className="rail-panel p-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="rail-kicker">真实数据</div>
          <h2 className="mt-1.5 text-[14px] font-bold text-[var(--ink)]">本周玩具榜</h2>
        </div>
        <span className="text-[10px] font-semibold text-[var(--muted)]">TOP 4</span>
      </div>

      <div className="mt-3 space-y-0.5">
        {toys.map((toy, index) => (
          <Link
            key={toy.id}
            href={`/bang/${toy.id}`}
            className="group flex w-full items-center gap-2.5 rounded-[11px] px-2 py-2 text-left transition-colors duration-150 hover:bg-[var(--surface-subtle)]"
          >
            <span className="min-w-[20px] text-center text-[11px] font-bold tabular-nums text-[var(--muted-light)] transition-colors duration-150 group-hover:text-[var(--accent)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-[var(--line)] bg-[#f3f1ef] p-[3px]">
              <ToyImage src={toy.coverUrl?.[0]} alt={toy.name} className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-[var(--ink-soft)] transition-colors duration-150 group-hover:text-[var(--accent-ink)]">
                {toy.name}
              </span>
              <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                {toy.rating ?? '-'} 分 · {toy.reviewCount ?? 0} 测评
              </span>
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/rankingList"
        className="mt-1 inline-flex w-full items-center gap-1.5 rounded-[10px] px-2 py-2 text-[12px] font-bold text-[var(--accent-ink)] transition-colors duration-150 hover:text-[var(--accent)]"
      >
        查看完整榜单
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h13" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </Link>
    </section>
  );
}
