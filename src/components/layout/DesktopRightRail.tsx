'use client';

import { useRouter } from 'next/navigation';
import { useForumStore } from '@/stores/forum';
import HomeRankingPreview from '@/components/home/HomeRankingPreview';

export default function DesktopRightRail() {
  const router = useRouter();
  const plate = useForumStore((state) => state.plate);
  const sort = useForumStore((state) => state.sort);
  const postsCache = useForumStore((state) => state.postsCache);
  const posts = postsCache[`${plate}-${sort}`] ?? [];
  const recentPosts = posts.slice(0, 4);

  return (
    <aside className="sticky top-[92px] space-y-4">
      {/* 刚刚更新 */}
      <section className="rail-panel p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="rail-kicker">实时动态</div>
            <h2 className="mt-1.5 text-[14px] font-bold text-[var(--ink)]">刚刚更新</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            实时
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {recentPosts.length > 0 ? (
            recentPosts.map((post, index) => (
              <button
                key={post.id}
                onClick={() => router.push(`/messageDetail/${post.id}`)}
                className="right-feed-item group flex w-full items-start gap-2.5 text-left"
              >
                <span className="mt-0.5 min-w-[19px] text-[10px] font-bold tracking-[0.1em] text-[var(--muted-light)] group-hover:text-[var(--accent)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-[var(--ink-soft)] transition-colors duration-150 group-hover:text-[var(--accent-ink)]">
                    {post.title}
                  </span>
                  <span className="mt-1 block text-[10px] text-[var(--muted)]">
                    {post.commentCount ?? 0} 条回复 · {post.timeAgo ?? '刚刚'}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="py-4 text-[11px] leading-5 text-[var(--muted)]">帖子加载后，这里会显示最近更新。</p>
          )}
        </div>
      </section>

      {/* 本周玩具榜（真实榜单 Top4，加载失败时自动隐藏） */}
      <HomeRankingPreview />

      {/* 轻量发布 CTA */}
      <section className="rail-panel p-4">
        <div className="rail-kicker">参与讨论</div>
        <h2 className="mt-2 text-[15px] font-bold tracking-[-0.02em] text-[var(--ink)]">有话想说？</h2>
        <p className="mt-1.5 text-[11px] leading-5 text-[var(--muted)]">
          把你的体验和问题留在社区，和杯友一起交流。
        </p>
        <button
          onClick={() => router.push('/postMessage')}
          className="interactive-press mt-3.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[11px] bg-[var(--ink)] text-[12px] font-bold text-white transition-colors duration-160 hover:bg-[#30282d]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          发布新帖
        </button>
      </section>
    </aside>
  );
}
