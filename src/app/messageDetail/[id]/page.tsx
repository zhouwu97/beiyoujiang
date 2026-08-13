'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Comment, PostDetailData } from '@/lib/types';
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
import { useForumStore, getCachedPosts } from '@/stores/forum';
import { useRewardToast } from '@/components/common/RewardToast';
import { useCustomAlert } from '@/components/common/CustomAlert';
import LoginTipModal from '@/components/common/LoginTipModal';

/** 帖子图片完整路径 */
function postImageUrl(img: string): string {
  return resolvePostImage(img);
}

/** 图片尺寸信息 */
function ImageMeta({ src }: { src: string }) {
  const [size, setSize] = useState<string>('');
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setSize(`${img.naturalWidth} × ${img.naturalHeight}`);
    };
    img.src = src;
  }, [src]);
  if (!size) return null;
  return (
    <span className="mt-1.5 block text-[9px] text-[var(--muted-light)]">
      {size} · 点击查看原图 · 完整比例展示
    </span>
  );
}

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
      readingQuantity(postId).catch(() => {});
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleLike = useCallback(async () => {
    if (!me) { setShowLoginTip(true); return; }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    try {
      if (next) { await likePost(postId); showReward('点赞成功'); }
      else { await unlikePost(postId); }
    } catch {
      setLiked(!next);
      setLikeCount((c) => (next ? c - 1 : c + 1));
      showAlert('操作失败，请重试');
    }
  }, [liked, postId, me, showReward, showAlert]);

  const handleCollect = useCallback(async () => {
    if (!me) { setShowLoginTip(true); return; }
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
    try { await deletePost(postId); showAlert('删除成功'); router.push('/'); }
    catch { showAlert('删除失败'); }
  };

  // 分享：优先系统分享面板，不支持或失败则复制链接
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = post?.title ?? '杯友酱的帖子';
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        // 用户主动取消（AbortError）不处理；其余原因降级到剪贴板
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showAlert('链接已复制');
    } catch {
      showAlert('复制失败，请手动复制地址');
    }
  }, [post?.title, showAlert]);

  const submitComment = async () => {
    const content = commentText.trim();
    if (!content) { showAlert('内容不能为空哦'); return; }
    if (!me) { setShowLoginTip(true); return; }
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
    setReplyingTo({ parentId: c.id, rootId: c.rootId ?? c.id, username: c.author?.username ?? '杯友' });
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="loading-mark mx-auto">杯</div>
          <p className="mt-3 text-[13px] text-[var(--muted)]">杯酱正在装填弹药…</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-[var(--muted)]">帖子不存在或已删除</p>
          <button className="interactive-press btn-gradient mt-4 px-6 py-2.5 text-[13px]" onClick={() => router.push('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const images = detail?.imageUrlsArray?.length ? detail.imageUrlsArray : (post.imageUrls ?? []);
  const plateName = PLATES.find((p) => p.id === post.plate)?.name ?? '';
  const author = post.author;

  // 右侧推荐：从缓存取同板块帖子
  const cachedPosts = getCachedPosts().filter((p) => p.id !== post.id).slice(0, 5);

  // 作者统计数据
  const authorStats = [
    { label: '帖子', value: '—' },
    { label: '获赞', value: author?.likeNumber ?? 0 },
    { label: '关注者', value: author?.followersNumber ?? 0 },
  ];

  return (
    <div className="page-shell min-h-screen">
      {/* 顶栏（面包屑导航） */}
      <header className="site-header">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1200px] items-center gap-4 px-4 sm:px-6 lg:min-h-[68px] lg:px-0">
          <Link href="/" className="brand-lockup shrink-0">
            <span className="brand-mark" aria-hidden="true">杯</span>
            <span className="brand-wordmark"><strong>杯友酱</strong></span>
          </Link>
          <div className="flex items-center gap-2 border-l border-[var(--line)] pl-4 text-[11px] text-[var(--muted)]">
            <span>论坛</span>
            <span>›</span>
            <strong className="font-semibold text-[var(--ink-soft)]">帖子详情</strong>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => router.push('/search')} className="search-trigger desktop-search-trigger hidden xl:inline-flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7.5" /><path d="m16.5 16.5 4.5 4.5" /></svg>
              <span>搜索帖子、用户、话题</span>
              <span className="search-shortcut">Ctrl K</span>
            </button>
            <button onClick={() => router.back()} className="icon-button" aria-label="返回">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 lg:py-6">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,824px)_320px] lg:gap-7">
          {/* 左侧主内容 */}
          <div className="rail-panel min-w-0 overflow-hidden lg:rounded-[16px]">
            <article className="px-5 pt-5 sm:px-7 sm:pt-6">
              {/* 作者行 */}
              <div className="flex items-center gap-2.5">
                <img
                  src={resolveAvatar(author?.photo)}
                  alt=""
                  className="h-[38px] w-[38px] rounded-[11px] border border-[var(--line)] object-cover ring-2 ring-white"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[14px] font-semibold text-[var(--ink)]">
                    {author?.username ?? '杯友'}
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                    {plateName && (
                      <span className="rounded-[5px] bg-[var(--accent-soft)] px-1.5 py-[3px] text-[10px] font-bold text-[var(--accent-ink)]">
                        {plateName}
                      </span>
                    )}
                    <span>{post.timeAgo ?? ''}</span>
                    <span>阅读 {post.readingQuantity ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* 标题 */}
              <h1 className="mt-4 text-[22px] font-bold leading-[1.45] tracking-[-0.025em] text-[var(--ink)]">
                {post.title}
              </h1>

              {/* 正文 */}
              <div
                className="mt-2 max-w-[68ch] text-[14px] leading-[1.82] text-[var(--ink-soft)]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
              />

              {/* 图片画廊 */}
              {images.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-start">
                    <div className="max-w-full overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface-subtle)]">
                      {images.map((img, i) => (
                        <div key={i} className="relative">
                          <img
                            src={postImageUrl(img)}
                            alt=""
                            loading="lazy"
                            className="block max-h-[680px] max-w-full object-contain"
                            onClick={() => setPreviewImage(postImageUrl(img))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {images.length === 1 && <ImageMeta src={postImageUrl(images[0])} />}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3.5">
                <button
                  onClick={handleLike}
                  className={`pill-btn interactive-press flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-semibold transition-colors ${
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
                  className={`pill-btn interactive-press flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-semibold transition-colors ${
                    collected ? 'bg-orange-50 text-orange-500' : 'bg-[var(--surface-subtle)] text-[var(--muted)]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={collected ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {collected ? '已收藏' : '收藏'}
                </button>
                <button
                  onClick={handleShare}
                  className="pill-btn interactive-press flex h-8 items-center gap-1.5 rounded-[9px] bg-[var(--surface-subtle)] px-3 text-[12px] font-semibold text-[var(--muted)]"
                >
                  分享
                </button>
                {me === author?.id && (
                  <button
                    onClick={handleDeletePost}
                    className="pill-btn interactive-press ml-2 flex h-8 items-center rounded-[9px] bg-red-50 px-3 text-[12px] font-semibold text-red-400"
                  >
                    删除
                  </button>
                )}
                <span className="ml-auto text-[11px] text-[var(--muted-light)]">
                  {post.commentCount ?? comments.length} 条评论
                </span>
              </div>
            </article>

            {/* 评论区 */}
            <section className="border-t border-[var(--line)] px-5 py-5 sm:px-7">
              <h2 className="mb-1 text-[16px] font-bold text-[var(--ink)]">
                全部评论 <span className="text-[12px] font-normal text-[var(--muted)]">{post.commentCount ?? comments.length}</span>
              </h2>

              {comments.length === 0 && (
                <p className="py-6 text-center text-[14px] text-[var(--muted)]">还没有评论，抢个沙发~</p>
              )}

              <div className="space-y-0">
                {comments.map((c) => (
                  <div key={c.id} className="border-b border-[var(--line)] py-3.5 last:border-0">
                    {/* 评论头 */}
                    <div className="flex items-center gap-2">
                      <img
                        src={resolveAvatar(c.author?.photo)}
                        alt=""
                        className="h-[30px] w-[30px] rounded-[9px] border border-[var(--line)] object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-[var(--ink)]">
                            {c.author?.username ?? '杯友'}
                          </span>
                          {c.isPostAuthor && (
                            <span className="rounded bg-blue-50 px-1 py-[1px] text-[10px] font-medium text-blue-500">
                              楼主
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--muted-light)]">{c.floor}楼</span>
                        </div>
                        <span className="block text-[10px] text-[var(--muted-light)]">{c.timeString ?? ''}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
                        {me === c.author?.id && (
                          <button onClick={() => handleDeleteComment(c.id)} className="transition-colors hover:text-red-400">
                            删除
                          </button>
                        )}
                        <button onClick={() => focusReply(c)} className="transition-colors hover:text-[var(--ink-soft)]">
                          回复
                        </button>
                        <button
                          onClick={async () => {
                            if (!me) { setShowLoginTip(true); return; }
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
                          className={`flex items-center gap-0.5 transition-colors ${c.isLiked ? 'text-[var(--accent)]' : ''}`}
                        >
                          ♡ {c.likeCount > 0 ? c.likeCount : ''}
                        </button>
                      </div>
                    </div>

                    {/* 评论内容（兼容旧站表情 HTML，须走 sanitize 后渲染） */}
                    <div
                      className="comment-content ml-[38px] mt-2 text-[13px] leading-[1.7] text-[var(--ink-soft)]"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.content) }}
                    />

                    {/* 评论图片 */}
                    {c.imageUrlsArray?.length > 0 && (
                      <div className="ml-[38px] mt-2 flex flex-wrap gap-1.5">
                        {c.imageUrlsArray.map((img, i) => (
                          <img
                            key={i}
                            src={postImageUrl(img)}
                            alt=""
                            className="h-16 w-16 cursor-zoom-in rounded-[8px] border border-[var(--line)] object-cover"
                            onClick={() => setPreviewImage(postImageUrl(img))}
                          />
                        ))}
                      </div>
                    )}

                    {/* 楼中楼 */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="ml-[38px] mt-2 space-y-1 rounded-[9px] bg-[var(--surface-subtle)] p-2.5">
                        {c.replies.map((r) => (
                          <div key={r.id} className="text-[12px]">
                            <span className="font-semibold text-[var(--ink)]">{r.author?.username ?? '杯友'}</span>
                            <span className="text-[var(--muted-light)]">：</span>
                            <span
                              className="comment-content text-[var(--ink-soft)]"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(r.content) }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 底部输入栏 */}
            <div className="sticky bottom-0 z-30 flex items-end gap-2 border-t border-[var(--line)] bg-white/95 px-4 py-2.5 backdrop-blur-md sm:px-6">
              <div className="flex-1">
                {replyingTo && (
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
                    <span>回复 @{replyingTo.username}</span>
                    <button onClick={() => setReplyingTo(null)} className="text-[var(--accent)]">取消</button>
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyingTo ? '写下你的回复…' : '说点什么吧…'}
                  rows={1}
                  className="w-full min-h-[38px] resize-none rounded-[10px] border border-[var(--line)] bg-[var(--surface-subtle)] px-3 py-2 text-[12px] outline-none transition-colors focus:border-[var(--accent)] focus:bg-white"
                />
              </div>
              <button
                onClick={submitComment}
                disabled={sending}
                className="interactive-press h-[38px] shrink-0 rounded-[10px] bg-[var(--accent)] px-4 text-[12px] font-bold text-white transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-50"
              >
                {sending ? '发送中' : '发送'}
              </button>
            </div>
          </div>

            {/* 右侧边栏 */}
          <aside className="sticky top-[90px] hidden space-y-3.5 lg:flex lg:flex-col">
            {/* 作者卡片 */}
            <section className="rail-panel sidecard p-4">
              <div className="eyebrow mb-2">POST AUTHOR</div>
              <div className="flex items-center gap-2.5">
                <img
                  src={resolveAvatar(author?.photo)}
                  alt=""
                  className="h-[42px] w-[42px] rounded-[11px] border border-[var(--line)] object-cover ring-2 ring-white"
                  loading="lazy"
                />
                <div>
                  <span className="block text-[13px] font-semibold text-[var(--ink)]">{author?.username ?? '杯友'}</span>
                  <span className="block text-[10px] text-[var(--muted)]">
                    Lv.{author?.level ?? 1} · {author?.introduction ? '杯友' : '杯友'}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-[1.7] text-[var(--muted)]">
                {author?.introduction || '这位杯友还没有写简介~'}
              </p>
              <div className="mt-3 grid grid-cols-3 border-t border-[var(--line)] pt-3">
                {authorStats.map((s) => (
                  <div key={s.label} className="text-center">
                    <span className="block text-[13px] font-bold text-[var(--ink)]">{s.value}</span>
                    <span className="block text-[10px] text-[var(--muted)]">{s.label}</span>
                  </div>
                ))}
              </div>
              {/* 关注作者：官方 API 未提供关注接口（已实测 404），移除假按钮 */}
            </section>

            {/* 同类热门 */}
            <section className="rail-panel sidecard p-4">
              <div className="mb-3 flex items-end justify-between">
                <h3 className="sectiontitle text-[14px] font-bold text-[var(--ink)]">同类热门</h3>
                <span className="text-[10px] text-[var(--muted-light)]">更多推荐</span>
              </div>
              <div className="space-y-0">
                {cachedPosts.length > 0 ? cachedPosts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/messageDetail/${p.id}`)}
                    className="rel-btn group w-full rounded-[8px] px-2 py-2 text-left transition-colors hover:bg-[var(--surface-subtle)]"
                  >
                    <span className="block truncate text-[12px] font-semibold text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent-ink)]">
                      {p.title}
                    </span>
                    <span className="mt-1 block text-[10px] text-[var(--muted)]">
                      {p.commentCount ?? 0} 条回复 · {p.timeAgo ?? '刚刚'}
                    </span>
                  </button>
                )) : (
                  <p className="text-[11px] text-[var(--muted)]">暂无更多推荐</p>
                )}
              </div>
            </section>

            {/* 本帖信息 */}
            <section className="rail-panel sidecard p-4">
              <div className="mb-3 flex items-end justify-between">
                <h3 className="sectiontitle text-[14px] font-bold text-[var(--ink)]">本帖信息</h3>
                <span className="text-[10px] text-[var(--muted-light)]">#{post.id}</span>
              </div>
              <div className="space-y-0">
                {[
                  { label: '所属版块', value: plateName || '—' },
                  { label: '发布时间', value: post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
                  { label: '阅读', value: post.readingQuantity ?? 0 },
                  { label: '最后回复', value: comments.length > 0 ? (comments[comments.length - 1]?.timeString ?? '刚刚') : '—' },
                ].map((item) => (
                  <div key={item.label} className="ctx-row flex h-[35px] items-center justify-between border-b border-[var(--line)] text-[11px] last:border-0">
                    <span className="text-[var(--muted)]">{item.label}</span>
                    <span className="text-[var(--ink-soft)]">{item.value}</span>
                  </div>
                ))}
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

      <LoginTipModal open={showLoginTip} onClose={() => setShowLoginTip(false)} />
    </div>
  );
}
