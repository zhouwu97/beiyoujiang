'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeRankingPreview from '@/components/home/HomeRankingPreview';
import { useForumStore } from '@/stores/forum';

/**
 * 仅接受接口明确提供的主题字段；当前 Post 类型没有 topic/tag 时返回空数组。
 * 这样「正在讨论」的结构会保留，但绝不将原型话题伪装成线上真实数据。
 */
function extractDiscussionTopics(posts: ReadonlyArray<unknown>): string[] {
  const topics = posts.flatMap((post) => {
    if (!post || typeof post !== 'object') return [];

    const record = post as { tags?: unknown; topics?: unknown };
    return [record.tags, record.topics].flatMap((field) => {
      if (typeof field === 'string' && field.trim()) return [field.trim()];
      if (!Array.isArray(field)) return [];
      return field.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    });
  });

  return Array.from(new Set(topics)).slice(0, 18);
}

/**
 * 首页右栏：刚刚更新 / 本周玩具榜 / 正在讨论 / 发布 CTA。
 * 所有可见块均位于同一纵向轨道，使用一致的 rail-panel 边界与间距。
 */
export default function DesktopRightRail() {
  const router = useRouter();
  const [topicOffset, setTopicOffset] = useState(0);
  const plate = useForumStore((state) => state.plate);
  const sort = useForumStore((state) => state.sort);
  const postsCache = useForumStore((state) => state.postsCache);
  const posts = postsCache[`${plate}-${sort}`] ?? [];
  const recentPosts = posts.slice(0, 4);
  const discussionTopics = extractDiscussionTopics(posts);
  const visibleTopics = discussionTopics.slice(topicOffset, topicOffset + 6);

  const rotateTopics = () => {
    if (discussionTopics.length <= 6) return;
    setTopicOffset((offset) => (offset + 6) % discussionTopics.length);
  };

  return (
    <aside className="desktop-right-rail">
      <section className="rail-panel p-[17px]">
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

      {visibleTopics.length > 0 ? (
        <section className="rail-panel p-[17px]">
          <div className="rail-head">
            <h3>正在讨论</h3>
            <button type="button" onClick={rotateTopics} className="rail-head-action">换一批</button>
          </div>
          <div className="topic-cloud">
            {visibleTopics.map((topic) => <span key={topic} className="chip"># {topic}</span>)}
          </div>
        </section>
      ) : null}

      <section className="notice">
        <h3>有话想说？</h3>
        <p>把体验、问题和踩坑都留在社区。少一点营销话术，多一点真实使用。</p>
        <button type="button" onClick={() => router.push('/postMessage')}>＋ 发布新帖</button>
      </section>
    </aside>
  );
}
