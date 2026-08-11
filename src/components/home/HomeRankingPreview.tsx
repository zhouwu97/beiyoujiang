'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Toy } from '@/lib/types';
import { getAllToy } from '@/lib/api';
import { formatCount } from '@/lib/utils';
import { stimulationLabel } from '@/lib/toyLabels';
import ToyImage from '@/components/toy/ToyImage';

/** 2/3/4 名的序号着色，与参考稿一致 */
const ROW_NUM_COLORS = ['#b9834d', '#8a8a8a', '#a97b68'];

/**
 * 首页右栏「本周玩具榜」预览：只显示真实榜单前 4 名（综合热榜）。
 * 第一名做成深色 rank-hero 建立层级，2~4 名用紧凑 row。
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
  const top = toys[0];

  return (
    <section className="rail-panel p-[17px]">
      <div className="rail-head">
        <h3>本周玩具榜</h3>
        <Link href="/rankingList">进入榜单 →</Link>
      </div>

      {top && (
        <Link href={`/bang/${top.id}`} className="rank-hero">
          <div className="rank-kicker">本周榜首</div>
          <div className="rank-top-name">{top.name}</div>
          <div className="rank-top-meta">
            {top.reviewCount ?? 0} 篇测评 · {formatCount(top.wantCount ?? 0)} 人想要
          </div>
          <div className="rank-score-big">{top.rating ?? '—'}</div>
        </Link>
      )}

      {toys.slice(1, 4).map((toy, index) => (
        <Link key={toy.id} href={`/bang/${toy.id}`} className="rank-row">
          <span className="rank-num" style={{ color: ROW_NUM_COLORS[index] }}>
            {index + 2}
          </span>
          <span className="rank-thumb">
            <ToyImage src={toy.coverUrl?.[0]} alt={toy.name} className="h-full w-full object-contain" />
          </span>
          <span className="min-w-0">
            <span className="rank-name">{toy.name}</span>
            <span className="rank-meta">
              {stimulationLabel(toy.stimulation)} · {toy.reviewCount ?? 0} 测评
            </span>
          </span>
          <span className="rank-score">{toy.rating ?? '—'}</span>
        </Link>
      ))}
    </section>
  );
}
