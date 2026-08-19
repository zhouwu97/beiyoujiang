'use client';

import { useRouter } from 'next/navigation';
import HomeRankingPreview from '@/components/home/HomeRankingPreview';
import { useForumStore } from '@/stores/forum';


/**
 * 首页右栏：三段式「刚刚更新 / 本周玩具榜 / 轻量发布 CTA」。
 * 榜单使用真实 getAllToy 数据（HomeRankingPreview），不造数据。
 * CTA 做轻量，避免与榜单争夺视觉重心。
 */
export default function DesktopRightRail() {
  const router = useRouter();
  const plate = useForumStore((state) => state.plate);
  const sort = useForumStore((state) => state.sort);
  const postsCache = useForumStore((state) => state.postsCache);
  const posts = postsCache[`${plate}-${sort}`] ?? [];
  const recentPosts = posts.slice(0, 4);

  return (
    <aside className="desktop-right-rail">
      <section className="rail-panel p-[18px]">
        <div className="rail-head">
          <h3>刚刚更新</h3>
          <button type="button" onClick={() => router.push('/')} className="rail-head-action">全部</button>
        </div>
        {recentPosts.length > 0 ? (
          recentPosts.map((post, index) => (
            <button
              key={post.id}
              type="button"
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

      <HomeRankingPreview />
    </aside>
  );
}
