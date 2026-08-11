'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Toy } from '@/lib/types';
import { getAllToy } from '@/lib/api';
import { resolveImage } from '@/lib/utils';

/** 玩具封面完整 URL */
function toyImage(url: string | null | undefined): string {
  if (!url) return resolveImage('/images/homepage.webp');
  if (url.startsWith('http')) return resolveImage(url);
  if (url.startsWith('/')) return resolveImage(url);
  return resolveImage(`/ToyImg/${url}`);
}

/** 榜单 Tab（type 参数与官方一致） */
const TYPE_TABS = [
  { id: '', label: '综合热榜' },
  { id: 'ENTRY', label: '慢玩入门' },
  { id: 'ADVANCED', label: '进阶训练' },
  { id: 'HIGH', label: '超高刺激' },
  { id: 'EXTREME', label: '榨汁玩具' },
];

/** 分类（classify 参数） */
const CLASSIFY_TABS = [
  { id: '', label: '全部' },
  { id: 'CUP', label: '杯子' },
  { id: 'LARGE_MOLD', label: '大型倒模' },
  { id: 'HALF_BODY', label: '半身' },
];

/**
 * 榜单页：玩具热度排行（刺激等级 Tab + 分类 Tab + 无限滚动）
 */
export default function RankingListPage() {
  const router = useRouter();
  const [type, setType] = useState('');
  const [classify, setClassify] = useState('');
  const [toys, setToys] = useState<Toy[]>([]);
  const [weeklyTop, setWeeklyTop] = useState<Toy | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchToys = useCallback(async (page: number, resetList: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await getAllToy(type, classify, 0, page, 10);
      if (resetList) {
        setWeeklyTop(res.weeklyTop);
        setToys(res.list);
      } else {
        setToys((prev) => {
          const seen = new Set(prev.map((t) => t.id));
          return [...prev, ...res.list.filter((t) => !seen.has(t.id))];
        });
      }
      setHasMore(res.pagination.hasMore);
      pageRef.current = page;
    } catch {
      // ignore
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [type, classify]);

  // Tab 变化 → 重置列表
  useEffect(() => {
    pageRef.current = 1;
    fetchToys(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, classify, fetchToys]);

  // 无限滚动
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMore) {
          fetchToys(pageRef.current + 1, false);
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchToys]);

  const scrollTabs = (dir: number) => {
    document.getElementById('type-tabs')?.scrollBy({ left: dir * 120, behavior: 'smooth' });
  };

  return (
    <div className="page-shell min-h-screen">
      {/* 顶栏 */}
      <header className="rank-header">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1120px] items-center px-4 sm:px-6 lg:min-h-[68px] lg:px-8">
          <button onClick={() => router.back()} className="icon-button" aria-label="返回">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[15px] font-semibold text-[var(--ink)]">玩具榜单</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] pb-12 lg:my-6">
        <div className="rank-panel overflow-hidden lg:rounded-[22px]">
          {/* 刺激等级 Tab（横向滚动） */}
          <div className="relative border-b border-[var(--line)]">
            <div
              id="type-tabs"
              className="flex items-center gap-2.5 px-4 py-3.5 scrollbar-hide"
            >
              {TYPE_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="rank-tab"
                  data-active={type === t.id}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollTabs(-1)}
              className="absolute left-0 top-1/2 flex h-full -translate-y-1/2 items-center justify-center bg-gradient-to-r from-white via-white/90 to-transparent px-2 text-[var(--muted)] lg:hidden"
              aria-label="左滑"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button
              onClick={() => scrollTabs(1)}
              className="absolute right-0 top-1/2 flex h-full -translate-y-1/2 items-center justify-center bg-gradient-to-l from-white via-white/90 to-transparent px-2 text-[var(--muted)] lg:hidden"
              aria-label="右滑"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          {/* 分类 Tab */}
          <div className="flex items-center gap-2 px-4 py-3">
            {CLASSIFY_TABS.map((c) => (
              <button
                key={c.id}
                onClick={() => setClassify(c.id)}
                className="rank-subtab"
                data-active={classify === c.id}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* 周榜冠军 */}
          {weeklyTop && (
            <div className="px-4 pb-3 cursor-pointer" onClick={() => router.push(`/bang/${weeklyTop.id}`)}>
              <div className="rank-champion">
                <img
                  src={toyImage(weeklyTop.coverUrl?.[0])}
                  alt={weeklyTop.name}
                />
                <div className="rank-champion-overlay">
                  <div>
                    <span className="rank-champion-badge">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      本周冠军
                    </span>
                    <p className="mt-1.5 text-[17px] font-bold text-white">{weeklyTop.name}</p>
                    <p className="mt-0.5 text-[11px] text-white/70">
                      评分 {weeklyTop.rating ?? '-'} · {weeklyTop.reviewCount ?? 0} 篇测评
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 榜单列表 */}
          <div className="px-4 pb-6">
            {toys.map((t, i) => (
              <div
                key={t.id}
                className="rank-item"
                onClick={() => router.push(`/bang/${t.id}`)}
              >
                {/* 排名 */}
                <span
                  className={`rank-num ${
                    i === 0 ? 'rank-num--gold' : i === 1 ? 'rank-num--silver' : i === 2 ? 'rank-num--bronze' : 'rank-num--normal'
                  }`}
                >
                  {i + 1}
                </span>
                <img
                  src={toyImage(t.coverUrl?.[0])}
                  alt={t.name}
                  loading="lazy"
                  className="rank-thumb"
                />
                <div className="min-w-0 flex-1">
                  <p className="rank-name truncate">{t.name}</p>
                  <p className="rank-meta">{t.merchant ?? ''}</p>
                  <p className="rank-tags truncate">{t.tags ?? ''}</p>
                </div>
                <div className="rank-score">
                  <p className="rank-score-value">{t.rating ?? '-'}</p>
                  <p className="rank-score-label">评分</p>
                  <p className="rank-score-label">{t.reviewCount ?? 0} 测评</p>
                </div>
              </div>
            ))}

            <div ref={sentinelRef} className="py-6 text-center">
              {loading ? (
                <span className="end-marker">正在加载更多</span>
              ) : hasMore ? (
                <span className="text-[11px] text-[var(--muted-light)]">下拉加载更多</span>
              ) : (
                <span className="end-marker">已经到底啦</span>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
