'use client';

import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import Banner from '@/components/home/Banner';
import PostList from '@/components/post/PostList';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import DesktopRightRail from '@/components/layout/DesktopRightRail';
import { useForumStore, setSort, reset } from '@/stores/forum';
import { SortOrder } from '@/lib/types';

/**
 * 首页：宽屏展开三栏，中等桌面保留内容与信息栏，较窄桌面优先保证主内容完整展示。
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

      <main className="mx-auto w-full max-w-[1480px] px-3 py-5 sm:px-6 lg:px-7 lg:py-6">
        <div className="main-grid grid min-w-0 gap-5 xl:grid-cols-[200px_minmax(0,1fr)_268px] xl:gap-5 2xl:grid-cols-[216px_minmax(0,1fr)_284px] 2xl:gap-6">
          <DesktopSidebar />

          <section className="feed-column">
            <Banner />

            <div className="feed-toolbar">
              <div className="feed-tabs" role="tablist" aria-label="帖子排序">
                <button
                  onClick={() => handleSortChange(SortOrder.ByTime)}
                  className="feed-tab"
                  data-active={sort === SortOrder.ByTime}
                  role="tab"
                  aria-selected={sort === SortOrder.ByTime}
                >
                  发布
                </button>
                <button
                  onClick={() => handleSortChange(SortOrder.ByReply)}
                  className="feed-tab"
                  data-active={sort === SortOrder.ByReply}
                  role="tab"
                  aria-selected={sort === SortOrder.ByReply}
                >
                  回复
                </button>
              </div>

              <button
                onClick={handleRefresh}
                className="quiet-action hidden lg:inline-flex"
                aria-label="刷新帖子"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 4v6h-6" />
                  <path d="M20.5 15a9 9 0 1 1-2.1-9.3L23 10" />
                </svg>
                刷新
              </button>
            </div>

            <PostList />
          </section>

          <DesktopRightRail />
        </div>
      </main>

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
