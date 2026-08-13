'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Toy } from '@/lib/types';
import { getAllToy } from '@/lib/api';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import DesktopPageShell from '@/components/layout/DesktopPageShell';
import RankingFilters from '@/components/ranking/RankingFilters';
import RankingTopThree from '@/components/ranking/RankingTopThree';
import RankingList from '@/components/ranking/RankingList';
import RankingRightRail from '@/components/ranking/RankingRightRail';
import RankingSkeleton from '@/components/ranking/RankingSkeleton';
import styles from '@/components/ranking/ranking.module.css';

const PAGE_SIZE = 10;

function StateCard({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string;
  hint: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[18px] border border-[var(--line)] bg-white/90 px-6 py-12 text-center">
      <div>
        <p className="text-[14px] font-bold text-[var(--ink)]">{title}</p>
        <p className="mt-1.5 text-[12px] text-[var(--muted)]">{hint}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="interactive-press btn-gradient px-5 py-2.5 text-[12px]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

/**
 * 榜单页：共享 Header + DesktopPageShell，组件拆分，请求状态收敛到页面。
 * 排名严格采用 API 返回顺序，前端绝不按 rating 重排。
 */
export default function RankingListPage() {
  const [type, setType] = useState('');
  const [classify, setClassify] = useState('');
  const [toys, setToys] = useState<Toy[]>([]);
  const [weeklyTop, setWeeklyTop] = useState<Toy | null>(null);
  const [filterLoading, setFilterLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const pageRef = useRef(1);
  const requestVersionRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 拉取第一页：重置列表 + 请求（requestVersion 丢弃过期响应）。
  // 仅由事件处理器调用，避免在 effect 内同步 setState。
  const fetchFirstPage = (nextType: string, nextClassify: string) => {
    requestVersionRef.current += 1;
    const version = requestVersionRef.current;
    setFilterLoading(true);
    setLoadingMore(false);
    setError(false);
    setToys([]);
    setWeeklyTop(null);
    setHasMore(false);
    pageRef.current = 1;

    getAllToy(nextType, nextClassify, 0, 1, PAGE_SIZE)
      .then((res) => {
        if (version !== requestVersionRef.current) return;
        setWeeklyTop(res.weeklyTop);
        setToys(res.list);
        setHasMore(res.pagination.hasMore);
      })
      .catch(() => {
        if (version !== requestVersionRef.current) return;
        setError(true);
      })
      .finally(() => {
        if (version === requestVersionRef.current) setFilterLoading(false);
      });
  };

  // 首次进入 + URL 恢复：从地址栏读取筛选条件并拉取第一页。
  // setState 均在异步回调内；同步的 setType/setClassify/setFilterLoading 按代码库惯例禁用该规则。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get('type') ?? '';
    const urlClassify = params.get('classify') ?? '';
    requestVersionRef.current += 1;
    const version = requestVersionRef.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setType(urlType);
    setClassify(urlClassify);
    setFilterLoading(true);
    setError(false);
    setToys([]);
    setWeeklyTop(null);
    setHasMore(false);
    pageRef.current = 1;

    getAllToy(urlType, urlClassify, 0, 1, PAGE_SIZE)
      .then((res) => {
        if (version !== requestVersionRef.current) return;
        setWeeklyTop(res.weeklyTop);
        setToys(res.list);
        setHasMore(res.pagination.hasMore);
      })
      .catch(() => {
        if (version !== requestVersionRef.current) return;
        setError(true);
      })
      .finally(() => {
        if (version === requestVersionRef.current) setFilterLoading(false);
      });
  }, []);

  // 浏览器后退/前进时按地址栏恢复筛选
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const urlType = params.get('type') ?? '';
      const urlClassify = params.get('classify') ?? '';
      if (urlType === type && urlClassify === classify) return;
      fetchFirstPage(urlType, urlClassify);
      setType(urlType);
      setClassify(urlClassify);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [type, classify]);

  // 加载更多（与首屏/筛选请求独立加锁）
  const loadMore = useCallback(async () => {
    if (filterLoading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const version = requestVersionRef.current;
    try {
      const res = await getAllToy(type, classify, 0, pageRef.current + 1, PAGE_SIZE);
      if (version !== requestVersionRef.current) return;
      setToys((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...res.list.filter((t) => !seen.has(t.id))];
      });
      setHasMore(res.pagination.hasMore);
      pageRef.current += 1;
    } catch {
      // 保留 hasMore，允许下次滚动重试
    } finally {
      if (version === requestVersionRef.current) setLoadingMore(false);
    }
  }, [type, classify, filterLoading, loadingMore, hasMore]);

  // 无限滚动
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // 筛选状态写入地址栏（后退/前进可恢复）
  const syncUrl = (nextType: string, nextClassify: string) => {
    const params = new URLSearchParams();
    if (nextType) params.set('type', nextType);
    if (nextClassify) params.set('classify', nextClassify);
    const qs = params.toString();
    router.replace(qs ? `/rankingList?${qs}` : '/rankingList', { scroll: false });
  };

  const handleTypeChange = (value: string) => {
    if (value === type) return;
    setType(value);
    syncUrl(value, classify);
    fetchFirstPage(value, classify);
  };

  const handleClassifyChange = (value: string) => {
    if (value === classify) return;
    setClassify(value);
    syncUrl(type, value);
    fetchFirstPage(type, value);
  };

  const resetFilter = () => {
    setType('');
    setClassify('');
    syncUrl('', '');
    fetchFirstPage('', '');
  };

  const handleRetry = () => {
    fetchFirstPage(type, classify);
  };

  const showList = !filterLoading && !error && toys.length > 0;

  return (
    <div className="page-shell min-h-screen">
      <Header />

      <DesktopPageShell
        variant="ranking"
        left={<DesktopSidebar />}
        main={
          <div className="min-w-0">
            <div className={`${styles.pageTitle} mb-4 pt-3 md:pt-0`}>
              <h1>玩具榜单</h1>
            </div>

            {/* 筛选条为高列的直属子元素，sticky 才能整列跟随 */}
            <RankingFilters
              type={type}
              classify={classify}
              onTypeChange={handleTypeChange}
              onClassifyChange={handleClassifyChange}
            />

            <div className="mt-5">
              {filterLoading ? (
                <RankingSkeleton />
              ) : error ? (
                <StateCard
                  title="榜单加载失败"
                  hint="可能是网络波动，筛选与页面导航仍可正常使用。"
                  actionLabel="重新加载"
                  onAction={handleRetry}
                />
              ) : toys.length === 0 ? (
                <StateCard
                  title="当前筛选暂无榜单数据"
                  hint="换个筛选条件试试，或返回综合热榜。"
                  actionLabel="查看全部"
                  onAction={resetFilter}
                />
              ) : (
                <div className="space-y-5">
                  <RankingTopThree toys={toys.slice(0, 3)} weeklyTop={weeklyTop} />
                  {toys.length > 3 && <RankingList toys={toys.slice(3)} offset={4} />}
                </div>
              )}
            </div>

            {/* 无限滚动哨兵 / 底部状态 */}
            <div ref={sentinelRef} className="py-7 text-center" aria-live="polite">
              {showList &&
                (loadingMore ? (
                  <span className="loading-dots" aria-label="正在加载更多" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : hasMore ? (
                  <span className="text-[11px] text-[var(--muted-light)]">下拉加载更多</span>
                ) : (
                  <span className="end-marker">已经到底啦</span>
                ))}
            </div>
          </div>
        }
        right={<RankingRightRail weeklyTop={weeklyTop} topToyId={toys[0]?.id} />}
      />

      <BottomNav />
    </div>
  );
}
