'use client';

import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import Banner from '@/components/home/Banner';
import PostList from '@/components/post/PostList';
import PlateFilterDropdown from '@/components/post/PlateFilterDropdown';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import DesktopRightRail from '@/components/layout/DesktopRightRail';
import DesktopPageShell from '@/components/layout/DesktopPageShell';
import { useForumStore, setSort, reset } from '@/stores/forum';
import { SortOrder } from '@/lib/types';

/**
 * 首页：宽屏三栏（左导航 + 帖子流 + 右信息栏），与榜单页共用 DesktopPageShell。
 */
export default function HomePage() {
  const sort = useForumStore((s) => s.sort);

  const handleSortChange = (s: SortOrder) => {
    if (s === sort) return;
    setSort(s);
    reset();
    window.scrollTo({ top: 0 });
  };

  const handleRefresh = () => {
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-shell">
      <Header />

      <DesktopPageShell
        left={<DesktopSidebar />}
        main={
          <section className="feed-surface">
            <div className="hero">
              <Banner />
            </div>

            <div className="feed-toolbar">
              <div className="feed-tabs" role="tablist" aria-label="帖子排序">
                <button
                  onClick={() => handleSortChange(SortOrder.ByTime)}
                  className="feed-tab"
                  data-active={sort === SortOrder.ByTime}
                  role="tab"
                  aria-selected={sort === SortOrder.ByTime}
                >
                  最新发布
                </button>
                <button
                  onClick={() => handleSortChange(SortOrder.ByReply)}
                  className="feed-tab"
                  data-active={sort === SortOrder.ByReply}
                  role="tab"
                  aria-selected={sort === SortOrder.ByReply}
                >
                  最近回复
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="ghost-btn hidden lg:inline-flex"
                  aria-label="刷新帖子"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 4v6h-6" />
                    <path d="M20.5 15a9 9 0 1 1-2.1-9.3L23 10" />
                  </svg>
                  刷新
                </button>

                <PlateFilterDropdown />
              </div>
            </div>

            <PostList />
          </section>
        }
        right={<DesktopRightRail />}
      />

      <div className="fixed bottom-[88px] right-4 z-30 flex lg:hidden">
        <button
          onClick={handleRefresh}
          aria-label="刷新"
          className="interactive-press flex h-10 w-10 items-center justify-center rounded-[13px] border border-[var(--line)] bg-white/90 text-[var(--ink-soft)] shadow-[0_10px_24px_rgba(37,27,31,0.1)] backdrop-blur"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M20.5 15a9 9 0 1 1-2.1-9.3L23 10" />
          </svg>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
