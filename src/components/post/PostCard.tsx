'use client';

import { memo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Post } from '@/lib/types';
import { PLATES } from '@/lib/types';
import { resolveAvatar, resolvePostImage } from '@/lib/utils';
import { likePost, unlikePost } from '@/lib/api';
import { useRewardToast } from '@/components/common/RewardToast';

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function StatIcon({ type }: { type: 'eye' | 'comment' | 'heart' }) {
  if (type === 'eye') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5Z" />
        <circle cx="12" cy="12" r="2.3" />
      </svg>
    );
  }

  if (type === 'comment') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-3.8 3v-3H7.5A2.5 2.5 0 0 1 5 12.5z" />
      </svg>
    );
  }

  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
    </svg>
  );
}

interface PostCardProps {
  post: Post;
}

/**
 * 帖子行（参考稿 post-row）：扁平行，无独立卡片边框/阴影/大圆角。
 * hover 仅轻微改背景；有图帖子在右侧显示 136×98 contain 缩略图。
 * 点赞乐观更新逻辑保持不变。
 */
function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { show: showReward } = useRewardToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [liking, setLiking] = useState(false);

  const plateName = PLATES.find((plate) => plate.id === post.plate)?.name ?? '';
  const preview = stripHtml(post.content);
  const cover = (post.imageUrls ?? [])[0];
  const openPost = () => router.push(`/messageDetail/${post.id}`);

  const handleLike = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (liking) return;

    setLiking(true);
    setLiked(!liked);
    setLikeCount((count) => (liked ? count - 1 : count + 1));

    try {
      if (liked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
        showReward('点赞成功');
      }
    } catch {
      setLiked(liked);
      setLikeCount((count) => (liked ? count + 1 : count - 1));
    } finally {
      setLiking(false);
    }
  };

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
      className={`post-row${cover ? '' : ' no-image'}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <img
            src={resolveAvatar(post.author?.photo)}
            alt=""
            className="h-[34px] w-[34px] rounded-[11px] bg-[var(--surface-subtle)] object-cover"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <strong className="max-w-[150px] truncate text-[12px] font-bold text-[var(--ink)]">
                {post.author?.username ?? '杯友'}
              </strong>
              {plateName && <span className="topic">{plateName}</span>}
            </div>
            <div className="mt-0.5 text-[9px] text-[var(--muted)]">
              {post.timeAgo ?? '刚刚'} · #{String(post.id).padStart(4, '0')}
            </div>
          </div>
        </div>

        <h2 className="post-title">{post.title}</h2>
        {preview && <p className="post-desc">{preview}</p>}

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
        <div className="thumb">
          <img src={resolvePostImage(cover)} alt="" loading="lazy" />
        </div>
      )}
    </article>
  );
}

export default memo(PostCard);
