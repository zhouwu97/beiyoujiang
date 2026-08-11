'use client';

import { memo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Post } from '@/lib/types';
import { PLATES } from '@/lib/types';
import { resolveAvatar, resolveImage, resolvePostImage } from '@/lib/utils';
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
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5Z" />
        <circle cx="12" cy="12" r="2.3" />
      </svg>
    );
  }

  if (type === 'comment') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-3.8 3v-3H7.5A2.5 2.5 0 0 1 5 12.5z" />
      </svg>
    );
  }

  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
    </svg>
  );
}

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { show: showReward } = useRewardToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [liking, setLiking] = useState(false);

  const plateName = PLATES.find((plate) => plate.id === post.plate)?.name ?? '';
  const preview = stripHtml(post.content);
  const images = (post.imageUrls ?? []).slice(0, 3);
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
      className="post-card group cursor-pointer p-5 sm:p-6"
    >
      <div className="flex items-center gap-3">
        <img
          src={resolveAvatar(post.author?.photo)}
          alt=""
          className="author-avatar h-9 w-9 rounded-[12px] bg-[var(--surface-subtle)] object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="max-w-[150px] truncate text-[13px] font-semibold text-[var(--ink)]">
              {post.author?.username ?? '杯友'}
            </span>
            {post.author?.level ? (
              <img
                src={resolveImage(`/images/level/leve${post.author.level}.png`)}
                alt={`Lv.${post.author.level}`}
                className="h-4 w-4 object-contain"
                loading="lazy"
              />
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {plateName && <span className="topic-tag">{plateName}</span>}
            <span className="text-[11px] text-[var(--muted)]">{post.timeAgo ?? '刚刚'}</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold tracking-[0.12em] text-[var(--muted-light)]">#{String(post.id).padStart(4, '0')}</span>
      </div>

      <h2 className="mt-5 text-[17px] font-bold leading-[1.45] tracking-[-0.02em] text-[var(--ink)] sm:text-[18px]">
        {post.title}
      </h2>

      {images.length === 0 && preview && (
        <p className="mt-2.5 line-clamp-3 max-w-[62ch] text-[13px] leading-6 text-[var(--ink-soft)] sm:text-[14px]">{preview}</p>
      )}

      {images.length > 0 && (
        <div className={`mt-4 grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((image, index) => (
            <div key={`${post.id}-${index}`} className={`post-media ${images.length === 1 ? 'post-media--single' : 'post-media--grid'}`}>
              <img
                src={resolvePostImage(image)}
                alt=""
                loading="lazy"
                className={images.length === 1 ? 'post-img-single' : 'post-img-grid'}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-5 border-t border-[var(--line)] pt-4">
        <span className="post-stat"><StatIcon type="eye" />{post.readingQuantity ?? 0}</span>
        <span className="post-stat"><StatIcon type="comment" />{post.commentCount ?? 0}</span>
        <span className="post-open-hint hidden items-center gap-1.5 text-[11px] font-semibold text-[var(--muted)] sm:inline-flex">
          查看讨论
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>
        </span>
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
      </div>
    </article>
  );
}

export default memo(PostCard);
