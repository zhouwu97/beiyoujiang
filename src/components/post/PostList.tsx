'use client';

import { useEffect, useRef } from 'react';
import { useForumStore, fetchNextPage, getCachedPosts } from '@/stores/forum';
import PostCard from '@/components/post/PostCard';

function PostSkeleton() {
  return (
    <div className="post-row no-image" aria-hidden="true">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="skeleton h-[34px] w-[34px] rounded-[11px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-3 w-28 rounded-full" />
            <div className="skeleton h-2.5 w-16 rounded-full" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded-full" />
          <div className="skeleton h-3 w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 帖子流：无限滚动列表。
 * 行与行之间只用 1px 分割线，不出现独立悬浮卡片。
 */
export default function PostList() {
  const plate = useForumStore((state) => state.plate);
  const sort = useForumStore((state) => state.sort);
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
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="py-16 text-center text-[13px] text-[var(--muted)]">
          这里还没有帖子，快来发布第一帖吧~
        </div>
      )}

      {posts.map((post, index) => (
        <div key={post.id} className="feed-item" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
          <PostCard post={post} />
        </div>
      ))}

      <div ref={sentinelRef} className="py-7 text-center" aria-live="polite">
        {loading ? (
          <div className="end-marker">
            <span className="loading-dots" aria-hidden="true"><span /><span /><span /></span>
            正在加载新的分享
          </div>
        ) : exhausted ? (
          <div className="end-marker">已经到底啦</div>
        ) : null}
      </div>
    </div>
  );
}
