'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import type { Post } from '@/lib/types';
import { PLATES } from '@/lib/types';
import { resolveAvatar } from '@/lib/utils';
import { usePostLike } from '@/components/post/usePostLike';
import PostMedia from '@/components/post/PostMedia';

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function StatIcon({ type }: { type: 'eye' | 'comment' | 'heart' }) {
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
 * 帖子行（贴吧式纵向内容流）：作者 → 标题 → 正文摘要 → 图片/图片组 → 浏览/回复/点赞。
 * 图片作为正文的一部分下置（PostMedia 统一渲染，保持原始宽高比、禁止 cover/固定比例）。
 * 无图帖不预留图片区，纯文字帖保持紧凑。
 */
function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { liked, likeCount, liking, handleLike } = usePostLike(post);

  const plateName = PLATES.find((plate) => plate.id === post.plate)?.name ?? '';
  const preview = stripHtml(post.content);
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
      className="post-row"
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
              <strong className="max-w-[150px] truncate text-[14px] font-bold text-[var(--ink)]">
                {post.author?.username ?? '杯友'}
              </strong>
              {plateName && <span className="topic">{plateName}</span>}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">
              {post.timeAgo ?? '刚刚'} · #{String(post.id).padStart(4, '0')}
            </div>
          </div>
        </div>

        <h2 className="post-title">{post.title}</h2>
        {preview && <p className="post-desc">{preview}</p>}

        <PostMedia images={post.imageUrls ?? []} onImageClick={openPost} />

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
    </article>
  );
}

export default memo(PostCard);
