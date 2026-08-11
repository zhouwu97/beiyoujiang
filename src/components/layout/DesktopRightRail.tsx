'use client';

import { useRouter } from 'next/navigation';
import { useForumStore } from '@/stores/forum';
import HomeRankingPreview from '@/components/home/HomeRankingPreview';

/**
 * 首页右栏：刚刚更新 / 本周玩具榜 / 发布 CTA。
 * 卡片 padding 17px，行内字号收敛到 9~12px，保持与左栏一致的信息密度。
 */
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
      <section className="rail-panel p-[17px]">
        <div className="rail-head">
          <h3>刚刚更新</h3>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            实时
          </span>
        </div>
        {recentPosts.length > 0 ? (
          recentPosts.map((post, index) => (
            <button
              key={post.id}
              onClick={() => router.push(`/messageDetail/${post.id}`)}
              className="live-row"
            >
              <span className="live-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0">
                <span className="live-title">{post.title}</span>
                <span className="live-meta">
                  {post.commentCount ?? 0} 条回复 · {post.timeAgo ?? '刚刚'}
                </span>
              </span>
            </button>
          ))
        ) : (
          <p className="py-4 text-[11px] leading-5 text-[var(--muted)]">
            帖子加载后，这里会显示最近更新。
          </p>
        )}
      </section>

      {/* 本周玩具榜（真实榜单 Top4，加载失败时自动隐藏） */}
      <HomeRankingPreview />

      {/* 深色发布 CTA */}
      <section className="notice">
        <h3>有话想说？</h3>
        <p>把你的体验和问题留在社区，和杯友一起交流。</p>
        <button onClick={() => router.push('/postMessage')}>
          ＋ 发布新帖
        </button>
      </section>
    </aside>
  );
}
