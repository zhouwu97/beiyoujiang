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
    // 由 effect 启动请求，fetchToys 内部统一管理 loading 状态。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchToys(1, true);
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
    <div className="min-h-screen bg-[#F7F7F9]">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-[#e8e8ec] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center px-4 sm:px-6 lg:h-[72px] lg:px-0">
          <button onClick={() => router.back()} className="p-2" aria-label="返回">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[16px] font-semibold text-[#2C2C2C]">玩具榜单</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] pb-12 lg:my-6 lg:rounded-[18px] lg:border lg:border-[#e7e7eb] lg:bg-white lg:shadow-[0_10px_30px_rgba(27,27,38,0.035)]">
      {/* 刺激等级 Tab（横向滚动） */}
      <div className="relative border-b border-gray-50 lg:rounded-t-[18px]">
        <div
          id="type-tabs"
          className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        >
          {TYPE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors ${
                type === t.id ? 'bg-[#FFAFBD] text-white' : 'bg-[#F7F7F9] text-[#666]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => scrollTabs(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-gradient-to-r from-white flex items-center justify-center text-[#929292]"
          aria-label="左滑"
        >
          ‹
        </button>
        <button
          onClick={() => scrollTabs(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-gradient-to-l from-white flex items-center justify-center text-[#929292]"
          aria-label="右滑"
        >
          ›
        </button>
      </div>

      {/* 分类 Tab */}
      <div className="flex items-center gap-2 px-4 py-3">
        {CLASSIFY_TABS.map((c) => (
          <button
            key={c.id}
            onClick={() => setClassify(c.id)}
            className={`px-3 py-1 rounded-[10px] text-[12px] transition-colors ${
              classify === c.id ? 'bg-[#FFE8EC] text-[#FB7299] font-medium' : 'text-[#929292]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 周榜冠军 */}
      {weeklyTop && (
        <div className="px-4 mb-3">
          <div className="relative rounded-[20px] overflow-hidden">
            <img
              src={toyImage(weeklyTop.coverUrl?.[0])}
              alt={weeklyTop.name}
              className="w-full h-36 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
              <div>
                <p className="text-[11px] text-yellow-300 mb-1">⭐ 本周冠军</p>
                <p className="text-[16px] font-bold text-white">{weeklyTop.name}</p>
                <p className="text-[11px] text-white/70 mt-0.5">
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
            className="flex items-center gap-3 py-3 border-b border-gray-50 cursor-pointer active:bg-[#FDF5F6]"
            onClick={() => t.shopLink && window.open(t.shopLink, '_blank')}
          >
            {/* 排名 */}
            <span
              className={`w-7 text-center text-[16px] font-bold ${
                i === 0 ? 'text-[#FF9800]' : i === 1 ? 'text-[#929292]' : i === 2 ? 'text-[#C98A5A]' : 'text-[#C4C4C4]'
              }`}
            >
              {i + 1}
            </span>
            <img
              src={toyImage(t.coverUrl?.[0])}
              alt={t.name}
              loading="lazy"
              className="w-14 h-14 rounded-[12px] object-cover bg-[#F7F7F9]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#2C2C2C] truncate">{t.name}</p>
              <p className="text-[11px] text-[#929292] mt-0.5">{t.merchant ?? ''}</p>
              <p className="text-[11px] text-[#FB7299] mt-0.5 truncate">{t.tags ?? ''}</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-bold text-[#FF9800]">{t.rating ?? '-'}</p>
              <p className="text-[10px] text-[#929292]">评分</p>
              <p className="text-[10px] text-[#929292] mt-0.5">{t.reviewCount ?? 0} 测评</p>
            </div>
          </div>
        ))}

        <div ref={sentinelRef} className="py-4 text-center text-[12px] text-[#929292]">
          {loading ? '加载中...' : hasMore ? '' : '已经到底啦~'}
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
