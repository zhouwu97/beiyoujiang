'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Comment, PostDetailData, Post } from '@/lib/types';
import { PLATES } from '@/lib/types';
import {
  getPost,
  getPostComments,
  readingQuantity,
  likePost,
  unlikePost,
  collectPost,
  uncollectPost,
  addComment,
  deletePost,
  deleteComment,
} from '@/lib/api';
import { resolveAvatar, resolveImage, resolvePostImage, sanitizeHtml } from '@/lib/utils';
import { getUserId } from '@/stores/auth';
import { useRewardToast } from '@/components/common/RewardToast';
import { useCustomAlert } from '@/components/common/CustomAlert';
import LoginTipModal from '@/components/common/LoginTipModal';
import { useForumStore, getCachedPosts } from '@/stores/forum';

/** 帖子图片完整路径 */
function postImageUrl(img: string): string {
  return resolvePostImage(img);
}

/**
 * 帖子详情页：正文 + 图片画廊 + 点赞收藏 + 评论区 + 楼中楼
 */
export default function MessageDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const router = useRouter();
  const { show: showReward } = useRewardToast();
  const { show: showAlert } = useCustomAlert();

  const [detail, setDetail] = useState<PostDetailData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [collected, setCollected] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ parentId: number; rootId: number; username: string } | null>(null);
  const [showLoginTip, setShowLoginTip] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const me = getUserId();

  const post = detail?.post;

  // 加载详情 + 评论 + 阅读量
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, c] = await Promise.all([
          getPost(postId),
          getPostComments(postId).catch(() => []),
        ]);
        if (cancelled) return;
        setDetail(d);
        setLiked(d.isLiked);
        setLikeCount(d.post.likeCount ?? 0);
        setCollected(d.isCollection);
        setComments(c);
      } catch {
        if (!cancelled) showAlert('帖子加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
      // 阅读量+1（异步，失败忽略）
      readingQuantity(postId).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleLike = useCallback(async () => {
    if (!me) {
      setShowLoginTip(true);
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    try {
      if (next) {
        await likePost(postId);
        showReward('点赞成功');
      } else {
        await unlikePost(postId);
      }
    } catch {
      setLiked(!next);
      setLikeCount((c) => (next ? c - 1 : c + 1));
      showAlert('操作失败，请重试');
    }
  }, [liked, postId, me, showReward, showAlert]);

  const handleCollect = useCallback(async () => {
    if (!me) {
      setShowLoginTip(true);
      return;
    }
    const next = !collected;
    setCollected(next);
    try {
      if (next) await collectPost(postId);
      else await uncollectPost(postId);
      showAlert(next ? '收藏成功' : '已取消收藏');
    } catch {
      setCollected(!next);
      showAlert('操作失败，请重试');
    }
  }, [collected, postId, me, showAlert]);

  const handleDeletePost = async () => {
    if (!window.confirm('确定删除这篇帖子吗？')) return;
    try {
      await deletePost(postId);
      showAlert('删除成功');
      router.push('/');
    } catch {
      showAlert('删除失败');
    }
  };

  /** 提交评论/回复 */
  const submitComment = async () => {
    const content = commentText.trim();
    if (!content) {
      showAlert('内容不能为空哦');
      return;
    }
    if (!me) {
      setShowLoginTip(true);
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      fd.append('postId', String(postId));
      fd.append('parentId', String(replyingTo?.parentId ?? 0));
      fd.append('rootId', String(replyingTo?.rootId ?? 0));
      await addComment(fd);
      setCommentText('');
      setReplyingTo(null);
      // 重新拉取评论
      const c = await getPostComments(postId).catch(() => []);
      setComments(c);
      showReward('评论成功');
    } catch {
      showAlert('评论失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('确定删除这条评论吗？')) return;
    try {
      await deleteComment(commentId);
      const c = await getPostComments(postId).catch(() => []);
      setComments(c);
      showAlert('删除成功');
    } catch {
      showAlert('删除失败');
    }
  };

  const focusReply = (c: Comment) => {
    setReplyingTo({
      parentId: c.id,
      rootId: c.rootId ?? c.id,
      username: c.author?.username ?? '杯友',
    });
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-[14px] text-[#929292]">杯酱正在装填弹药...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center py-32">
        <p className="text-[14px] text-[#929292] mb-4">帖子不存在或已删除</p>
        <button className="btn-gradient" onClick={() => router.push('/')}>
          返回首页
        </button>
      </div>
    );
  }

  const images = detail?.imageUrlsArray?.length ? detail.imageUrlsArray : (post.imageUrls ?? []);
  const plateName = PLATES.find((p) => p.id === post.plate)?.name ?? '';

  // 右侧推荐：从缓存取同板块帖子（排除当前帖子）
  const cachedPosts = getCachedPosts().filter((p) => p.id !== post.id).slice(0, 5);

  return (
    <div className="page-shell min-h-screen">
      {/* 顶栏 */}
      <header className="site-header">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1440px] items-center px-4 sm:px-6 lg:min-h-[68px] lg:px-8">
          <button onClick={() => router.back()} className="icon-button" aria-label="返回">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[15px] font-semibold text-[var(--ink)]">帖子详情</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] lg:my-6">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,680px)_300px] lg:gap-6 xl:grid-cols-[minmax(0,720px)_320px] xl:gap-8">
          {/* 主内容 */}
          <div className="rail-panel min-w-0 overflow-hidden lg:rounded-[22px]">
            <article className="px-5 pt-5 sm:px-6 sm:pt-6">
              {/* 作者行 */}
              <div className="mb-3 flex items-center gap-2.5">
                <img
                  src={resolveAvatar(post.author?.photo)}
                  alt=""
                  className="author-avatar h-9 w-9 rounded-[10px] object-cover"
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
                        alt=""
                        className="h-3.5 w-3.5 object-contain"
                        loading="lazy"
                      />
                    ) : null}
                    {post.author?.isAdmin && (
                      <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--accent-ink)]">
                        管理
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                    {plateName && <span className="topic-tag !text-[9px]">{plateName}</span>}
                    <span>{post.timeAgo ?? ''}</span>
                    <span>阅读 {post.readingQuantity ?? 0}</span>
                  </div>
                </div>
                {me === post.author?.id && (
                  <button
                    onClick={handleDeletePost}
                    className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-100"
                  >
                    删除
                  </button>
                )}
              </div>

              {/* 标题 */}
              <h2 className="mb-3 text-[17px] font-bold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                {post.title}
              </h2>

              {/* 正文 */}
              <div
                className="prose-content text-[14px] leading-[1.75] tracking-[-0.005em] text-[var(--ink-soft)]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
              />

              {/* 图片 */}
              {images.length > 0 && (
                <div className={`mt-4 grid gap-1.5 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {images.map((img, i) => (
                    <div key={i} className={`overflow-hidden rounded-[12px] ${images.length === 1 ? 'w-fit max-w-full' : 'h-48'}`}>
                      <img
                        src={postImageUrl(img)}
                        alt=""
                        loading="lazy"
                        className={`cursor-zoom-in ${images.length === 1 ? 'max-h-[480px] w-auto max-w-full rounded-[12px] object-contain' : 'h-full w-full rounded-[12px] object-cover'}`}
                        onClick={() => setPreviewImage(postImageUrl(img))}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 点赞/收藏 */}
              <div className="mt-5 flex items-center gap-2.5 pb-5">
                <button
                  onClick={handleLike}
                  className={`interactive-press flex items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
                    liked ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--surface-subtle)] text-[var(--muted)]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
                  </svg>
                  {likeCount}
                </button>
                <button
                  onClick={handleCollect}
                  className={`interactive-press flex items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
                    collected ? 'bg-orange-50 text-orange-500' : 'bg-[var(--surface-subtle)] text-[var(--muted)]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={collected ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {collected ? '已收藏' : '收藏'}
                </button>
                <span className="ml-auto text-[11px] text-[var(--muted-light)]">
                  {post.commentCount ?? comments.length} 条评论
                </span>
              </div>
            </article>

            {/* 评论区 */}
            <section className="border-t border-[var(--line)] px-5 pb-5 pt-4 sm:px-6">
              <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
                全部评论 <span className="text-[12px] font-normal text-[var(--muted)]">{post.commentCount ?? comments.length}</span>
              </h3>

              {comments.length === 0 && (
                <p className="py-6 text-center text-[13px] text-[var(--muted)]">还没有评论，抢个沙发~</p>
              )}

              <div className="space-y-0">
                {comments.map((c) => (
                  <div key={c.id} className="border-b border-[var(--line)] py-3.5 last:border-0">
                    {/* 评论头 */}
                    <div className="mb-1.5 flex items-center gap-2">
                      <img
                        src={resolveAvatar(c.author?.photo)}
                        alt=""
                        className="h-7 w-7 rounded-[9px] object-cover ring-1 ring-[var(--line)]"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-semibold text-[var(--ink)]">
                            {c.author?.username ?? '杯友'}
                          </span>
                          {c.isPostAuthor && (
                            <span className="rounded bg-blue-50 px-1 text-[9px] font-medium text-blue-500">
                              楼主
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--muted-light)]">{c.floor}楼</span>
                        </div>
                        <span className="text-[10px] text-[var(--muted-light)]">{c.timeString ?? ''}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {me === c.author?.id && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-[10px] text-red-400 transition-colors hover:text-red-500"
                          >
                            删除
                          </button>
                        )}
                        <button
                          onClick={() => focusReply(c)}
                          className="text-[10px] text-[var(--muted)] transition-colors hover:text-[var(--ink-soft)]"
                        >
                          回复
                        </button>
                        <button
                          onClick={async () => {
                            if (!me) {
                              setShowLoginTip(true);
                              return;
                            }
                            try {
                              const { likeComment } = await import('@/lib/api');
                              if (c.isLiked) {
                                const { unlikeComment } = await import('@/lib/api');
                                await unlikeComment(c.id);
                              } else {
                                await likeComment(c.id);
                              }
                              setComments((prev) =>
                                prev.map((x) =>
                                  x.id === c.id
                                    ? { ...x, isLiked: !x.isLiked, likeCount: x.likeCount + (x.isLiked ? -1 : 1) }
                                    : x
                                )
                              );
                            } catch {
                              showAlert('操作失败');
                            }
                          }}
                          className={`flex items-center gap-0.5 text-[11px] transition-colors ${c.isLiked ? 'text-[var(--accent)]' : 'text-[var(--muted-light)]'}`}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill={c.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
                          </svg>
                          {c.likeCount > 0 ? c.likeCount : ''}
                        </button>
                      </div>
                    </div>

                    {/* 评论内容 */}
                    <p className="text-[13px] leading-[1.7] text-[var(--ink-soft)]">{c.content}</p>

                    {/* 评论图片 */}
                    {c.imageUrlsArray?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.imageUrlsArray.map((img, i) => (
                          <img
                            key={i}
                            src={postImageUrl(img)}
                            alt=""
                            className="h-16 w-16 cursor-zoom-in rounded-[8px] object-cover"
                            onClick={() => setPreviewImage(postImageUrl(img))}
                          />
                        ))}
                      </div>
                    )}

                    {/* 楼中楼 */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="mt-2 space-y-1.5 rounded-[10px] bg-[var(--surface-subtle)] p-2.5">
                        {c.replies.map((r) => (
                          <div key={r.id} className="text-[12px]">
                            <span className="font-semibold text-[var(--ink)]">
                              {r.author?.username ?? '杯友'}
                            </span>
                            <span className="text-[var(--muted-light)]">：</span>
                            <span className="leading-relaxed text-[var(--ink-soft)]">{r.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 右侧推荐 */}
          <aside className="sticky top-[92px] hidden space-y-3 xl:block">
            <section className="rail-panel p-4">
              <div className="rail-kicker">更多推荐</div>
              <h2 className="mt-1.5 text-[14px] font-bold text-[var(--ink)]">同类热门</h2>
              <div className="mt-3 space-y-2.5">
                {cachedPosts.length > 0 ? cachedPosts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/messageDetail/${p.id}`)}
                    className="right-feed-item group flex w-full items-start gap-2 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent-ink)]">
                        {p.title}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                        {p.commentCount ?? 0} 条回复 · {p.timeAgo ?? '刚刚'}
                      </span>
                    </span>
                  </button>
                )) : (
                  <p className="text-[11px] text-[var(--muted)]">暂无更多推荐</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* 图片预览 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="" className="max-h-[90vh] max-w-[90vw] rounded-[12px] object-contain shadow-2xl" />
          <button className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[22px] text-white backdrop-blur transition-colors hover:bg-white/20" aria-label="关闭">
            ×
          </button>
        </div>
      )}

      {/* 底部评论输入栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-end gap-2 border-t border-[var(--line)] bg-white px-3 py-2 sm:left-[calc(50%-340px+16px)] sm:right-auto sm:w-[calc(680px-32px)] lg:left-[calc(50%-360px+16px)] lg:w-[calc(720px-32px)] xl:left-[calc((1440px-320px-8px)/2-720px/2+16px)] xl:w-[calc(720px-32px)]">
        <div className="flex-1">
          {replyingTo && (
            <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--muted)]">
              <span>回复 @{replyingTo.username}</span>
              <button onClick={() => setReplyingTo(null)} className="text-[var(--accent)]">
                取消
              </button>
            </div>
          )}
          <textarea
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={replyingTo ? '写下你的回复...' : '说点什么吧~'}
            rows={1}
            className="w-full max-h-28 resize-none rounded-[14px] border border-[var(--line)] bg-[var(--surface-subtle)] px-3.5 py-2 text-[13px] outline-none transition-colors focus:border-[var(--accent)] focus:bg-white"
          />
        </div>
        <button
          onClick={submitComment}
          disabled={sending}
          className="interactive-press shrink-0 rounded-full bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? '发送中' : '发送'}
        </button>
      </div>
      <div className="h-14" />

      <LoginTipModal open={showLoginTip} onClose={() => setShowLoginTip(false)} />
    </div>
  );
}
