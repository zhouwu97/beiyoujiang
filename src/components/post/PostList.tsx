'use client';

import { useEffect, useRef } from 'react';
import { useForumStore, fetchNextPage, getCachedPosts } from '@/stores/forum';
import PostCard from '@/components/post/PostCard';

/**
 * 帖子流加载骨架：纵向布局（作者 / 标题 / 摘要 / 可选图片 / 统计），
 * 与真实帖子结构一致，避免 loading 态与真实态布局完全不同。
 */
function PostSkeleton({ withMedia = false }: { withMedia?: boolean }) {
  return (
    <div className="post-row" aria-hidden="true">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="skeleton post-avatar h-[34px] w-[34px] rounded-[11px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-3 w-28 rounded-full" />
            <div className="skeleton h-2.5 w-16 rounded-full" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded-full" />
          <div className="skeleton h-3 w-1/2 rounded-full" />
        </div>
        {withMedia && <div className="skeleton mt-4 h-[220px] w-[320px] rounded-[12px]" />}
        <div className="mt-4 flex items-center gap-5">
          <div className="skeleton h-3 w-12 rounded-full" />
          <div className="skeleton h-3 w-12 rounded-full" />
          <div className="skeleton h-3 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 帖子流：无限滚动列表，全部帖子统一使用 PostCard（贴吧式纵向内容流）。
 * 行与行之间只用 1px 分割线，不出现独立悬浮卡片。
 */
export default function PostList() {
  const plate = useForumStore((state) => state.plate);
  const sort = useForumStore((state) => state.sort);
  const error = useForumStore((state) => state.error);
  const loading = useForumStore((state) => state.loading);
  const exhausted = useForumStore((state) => state.exhausted);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const posts = getCachedPosts();

  useEffect(() => {
    fetchNextPage();
  }, [plate, sort]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !exhausted) fetchNextPage();
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, exhausted]);

  return (
    <div>
      {posts.length === 0 && loading && (
        <div aria-label="帖子加载中">
          <PostSkeleton withMedia />
          <PostSkeleton />
          <PostSkeleton withMedia />
        </div>
      )}

      {posts.length === 0 && !loading && error && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="mb-4 text-[13px] text-[var(--muted)]">加载失败，请检查网络后重试</p>
          <button
            onClick={() => fetchNextPage()}
            className="interactive-press rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-strong)]"
          >
            重新加载
          </button>
        </div>
      )}

      {posts.length === 0 && !loading && !error && (
        <div className="py-16 text-center text-[13px] text-[var(--muted)]">
          这里还没有帖子，快来发布第一帖吧~
        </div>
      )}

      {posts.map((post, index) => (
        <div key={post.id} className="feed-item" style={{ animationDelay: `${Math.min(index + 1, 8) * 30}ms` }}>
          <PostCard post={post} />
        </div>
      ))}

      <div ref={sentinelRef} className="py-7 text-center" aria-live="polite">
        {loading ? (
          <div className="end-marker">
            <span className="loading-dots" aria-hidden="true"><span /><span /><span /></span>
            正在加载新的分享
          </div>
        ) : error ? (
          <div className="end-marker">
            <span className="text-[13px] text-[var(--muted)]">加载失败，</span>
            <button onClick={() => fetchNextPage()} className="text-[13px] text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]">
              重试
            </button>
          </div>
        ) : exhausted ? (
          <div className="end-marker">已经到底啦</div>
        ) : null}
      </div>
    </div>
  );
}
