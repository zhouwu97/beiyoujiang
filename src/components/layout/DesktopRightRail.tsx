'use client';

import { useRouter } from 'next/navigation';
import HomeRankingPreview from '@/components/home/HomeRankingPreview';
import { useForumStore } from '@/stores/forum';

/** 发布 CTA 小图标（分享/编辑） */
function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.5 5.5 18.5 10.5M5 19l3.5-.8L19.2 7.5a2.1 2.1 0 0 0-3-3L5.8 14.9z" />
    </svg>
  );
}

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

      <section className="notice">
        <div className="notice-head">
          <ShareIcon />
          <h3>分享真实体验</h3>
        </div>
        <p>问题、踩坑、长期使用感受都可以留在这里。</p>
        <button type="button" onClick={() => router.push('/postMessage')}>发布新帖</button>
      </section>
    </aside>
  );
}
