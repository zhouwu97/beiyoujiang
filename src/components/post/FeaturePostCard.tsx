'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import type { Post } from '@/lib/types';
import { PLATES } from '@/lib/types';
import { resolveAvatar, resolvePostImage } from '@/lib/utils';
import { StatIcon, stripHtml } from '@/components/post/PostCard';
import { usePostLike } from '@/components/post/usePostLike';
import SafeImage from '@/components/common/SafeImage';

interface FeaturePostCardProps {
  post: Post;
}

/**
 * 首页精选主帖（参考稿 featured-post）：
 * 由 PostList 从真实帖子中选择（优先第一条带图帖，否则 posts[0]），绝不硬编码。
 * desktop 两列：左 68%（作者 + 18px 标题 + 2~3 行摘要 + 统计），右 32%（第一张真实配图，按原始宽高比展示，max 280×240）。
 * 仍是 feed-surface 内的扁平块，仅以分割线与下方紧凑行区分，不出现独立卡片阴影。
 */
function FeaturePostCard({ post }: FeaturePostCardProps) {
  const router = useRouter();
  const { liked, likeCount, liking, handleLike } = usePostLike(post);

  const plateName = PLATES.find((plate) => plate.id === post.plate)?.name ?? '';
  const preview = stripHtml(post.content);
  const cover = (post.imageUrls ?? [])[0];
  const openPost = () => router.push(`/messageDetail/${post.id}`);

  return (
    <article
      onClick={openPost}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPost();
        }
      }}
      tabIndex={0}
      className={`featured-post${cover ? '' : ' no-image'}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <SafeImage
            src={resolveAvatar(post.author?.photo)}
            alt=""
            className="h-[40px] w-[40px] rounded-[12px] bg-[var(--surface-subtle)] object-cover"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <strong className="max-w-[160px] truncate text-[14px] font-bold text-[var(--ink)]">
                {post.author?.username ?? '杯友'}
              </strong>
              {plateName && <span className="topic">{plateName}</span>}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">
              {post.timeAgo ?? '刚刚'} · #{String(post.id).padStart(4, '0')}
            </div>
          </div>
        </div>

        <h2 className="featured-title">{post.title}</h2>
        {preview && <p className="featured-desc">{preview}</p>}

        <div className="stats">
          <span className="post-stat"><StatIcon type="eye" />{post.readingQuantity ?? 0}</span>
          <span className="post-stat"><StatIcon type="comment" />{post.commentCount ?? 0}</span>
          <button
            onClick={handleLike}
            className="post-stat post-like interactive-press"
            data-liked={liked}
            aria-label={liked ? '取消点赞' : '点赞'}
            aria-pressed={liked}
            disabled={liking}
          >
            <StatIcon type="heart" />
            <span>{likeCount}</span>
          </button>
          <span className="post-open-hint hidden items-center gap-1.5 sm:inline-flex">
            查看讨论
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>
          </span>
        </div>
      </div>

      {cover && (
        <div className="featured-thumb">
          <SafeImage src={resolvePostImage(cover)} alt="" loading="lazy" />
        </div>
      )}
    </article>
  );
}

export default memo(FeaturePostCard);
