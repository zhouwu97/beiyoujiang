'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cacheKey, useForumStore } from '@/stores/forum';
import type { Post } from '@/lib/types';

function FireIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-[var(--accent)]"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </svg>
  );
}

/**
 * 首页桌面端「今日热议」卡片：
 * 位于 Banner 右侧（>=1280px 展示），从当前已加载的真实帖子流中
 * 按评论数本地降序挑选最多 4 条，不调用新 API，不造假数据，不改变真正 Feed 的接口顺序。
 */
export default function HomeHotTopics() {
  const router = useRouter();
  const query = useForumStore((s) => s.queries[cacheKey(s.plate, s.sort)]);
  const cachedPosts = query?.posts;
  const loading = query?.loading ?? false;

  const posts = useMemo(() => cachedPosts ?? [], [cachedPosts]);

  const hotPosts = useMemo(() => {
    if (posts.length === 0) return [];
    return [...posts]
      .sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0))
      .slice(0, 4);
  }, [posts]);

  return (
    <div className="home-hot-topics flex h-full flex-col rounded-[18px] border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2.5">
        <div className="flex items-center gap-1.5">
          <FireIcon />
          <h2 className="text-[14px] font-bold tracking-[-0.02em] text-[var(--ink)]">今日热议</h2>
        </div>
        <span className="text-[11px] font-medium text-[var(--muted-light)]">实时互动</span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1.5">
        {posts.length === 0 && loading ? (
          <div className="space-y-2.5 py-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2.5 animate-pulse">
                <span className="h-4 w-4 rounded bg-[var(--surface-subtle)]" />
                <div className="h-3.5 flex-1 rounded bg-[var(--surface-subtle)]" />
              </div>
            ))}
          </div>
        ) : hotPosts.length > 0 ? (
          hotPosts.map((post: Post, index: number) => {
            const isTop = index === 0;
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => router.push(`/messageDetail/${post.id}`)}
                className="group flex w-full items-start gap-2.5 rounded-[10px] p-1.5 text-left transition-colors hover:bg-[var(--surface-subtle)]"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[11px] font-black ${
                    isTop
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                      : 'text-[var(--muted-light)]'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[var(--ink)] transition-colors group-hover:text-[var(--accent-ink)]">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                    {post.commentCount ?? 0} 条回复 · {post.readingQuantity ?? 0} 阅读
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-1 items-center justify-center py-6 text-center text-[12px] text-[var(--muted)]">
            帖子加载后在此展示热议
          </div>
        )}
      </div>
    </div>
  );
}
