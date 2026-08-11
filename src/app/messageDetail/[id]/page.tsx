'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { getUserId, useAuthStore } from '@/stores/auth';
import { useRewardToast } from '@/components/common/RewardToast';
import { useCustomAlert } from '@/components/common/CustomAlert';
import LoginTipModal from '@/components/common/LoginTipModal';

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

  return (
    <div className="min-h-screen bg-[#F7F7F9]">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-[#e8e8ec] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-[920px] items-center px-4 sm:px-6 lg:h-[72px] lg:px-0">
          <button onClick={() => router.back()} className="p-2" aria-label="返回">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[16px] font-semibold text-[#2C2C2C]">
            帖子详情
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[920px] bg-white lg:my-6 lg:rounded-[18px] lg:border lg:border-[#e7e7eb] lg:shadow-[0_10px_30px_rgba(27,27,38,0.035)]">
      <article className="px-4 pt-4 lg:px-8 lg:pt-8">
        {/* 作者行 */}
        <div className="flex items-center gap-2 mb-3">
          <img
            src={resolveAvatar(post.author?.photo)}
            alt=""
            className="w-10 h-10 rounded-full object-cover bg-[#F7F7F9]"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-semibold text-[#2C2C2C]">
                {post.author?.username ?? '杯友'}
              </span>
              {post.author?.level ? (
                <img
                  src={resolveImage(`/images/level/leve${post.author.level}.png`)}
                  alt=""
                  className="w-4 h-4"
                />
              ) : null}
              {post.author?.isAdmin && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FFE8EC] text-[#FB7299]">
                  管理员
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#929292]">
              {plateName && <span>{plateName}</span>}
              <span>{post.timeAgo ?? ''}</span>
              <span>阅读 {post.readingQuantity ?? 0}</span>
            </div>
          </div>
          {me === post.author?.id && (
            <button
              onClick={handleDeletePost}
              className="text-[12px] text-[#DC2626] px-2 py-1 rounded-full bg-red-50"
            >
              删除
            </button>
          )}
        </div>

        {/* 标题 + 正文 */}
        <h2 className="text-[18px] font-bold text-[#2C2C2C] leading-snug mb-3">{post.title}</h2>
        <div
          className="text-[15px] text-[#2C2C2C] leading-[1.8] break-words [&_img]:inline-block [&_img]:align-middle [&_img]:max-w-full [&_img]:h-auto [&_a]:text-[#007BFF] [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />

        {/* 图片画廊 */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {images.map((img, i) => (
              <img
                key={i}
                src={postImageUrl(img)}
                alt=""
                loading="lazy"
                className="rounded-[12px] w-full h-36 object-cover bg-[#F7F7F9]"
                onClick={() => setPreviewImage(postImageUrl(img))}
              />
            ))}
          </div>
        )}

        {/* 点赞/收藏 */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
              liked ? 'bg-[#FFE8EC] text-[#FB7299]' : 'bg-[#F7F7F9] text-[#666]'
            }`}
          >
            <img
              src={
                liked
                  ? resolveImage('/images/new3_a.png')
                  : resolveImage('/images/new3.png')
              }
              alt=""
              className="w-4 h-4"
            />
            {likeCount}
          </button>
          <button
            onClick={handleCollect}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
              collected ? 'bg-[#FFF3E0] text-[#FF9800]' : 'bg-[#F7F7F9] text-[#666]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={collected ? '#FF9800' : 'none'} stroke={collected ? '#FF9800' : '#666'} strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {collected ? '已收藏' : '收藏'}
          </button>
        </div>
      </article>

      {/* 评论区 */}
      <section className="mt-6 px-4 pb-4 lg:px-8 lg:pb-8">
        <h3 className="text-[15px] font-semibold text-[#2C2C2C] mb-3">
          评论 {post.commentCount ?? comments.length}
        </h3>

        {comments.length === 0 && (
          <p className="text-center text-[13px] text-[#929292] py-8">还没有评论，抢个沙发~</p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="py-3 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={resolveAvatar(c.author?.photo)}
                alt=""
                className="w-7 h-7 rounded-full object-cover bg-[#F7F7F9]"
              />
              <span className="text-[13px] font-medium text-[#2C2C2C]">
                {c.author?.username ?? '杯友'}
              </span>
              {c.isPostAuthor && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E8F0FF] text-[#007BFF]">
                  楼主
                </span>
              )}
              <span className="text-[11px] text-[#929292]">{c.timeString ?? ''}</span>
              <span className="text-[11px] text-[#929292]">{c.floor}楼</span>
              <span className="ml-auto flex items-center gap-2">
                {me === c.author?.id && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-[11px] text-[#DC2626]"
                  >
                    删除
                  </button>
                )}
                <button
                  onClick={() => focusReply(c)}
                  className="text-[11px] text-[#929292]"
                >
                  回复
                </button>
                <button
                  onClick={async () => {
                    if (!me) {
                      setShowLoginTip(true);
                      return;
                    }
                    // 评论点赞走乐观更新（接口契约：likeComment {commentId}）
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
                  className={`flex items-center gap-1 text-[12px] ${c.isLiked ? 'text-[#FB7299]' : 'text-[#929292]'}`}
                >
                  <img
                    src={
                      c.isLiked
                        ? resolveImage('/images/new3_a.png')
                        : resolveImage('/images/new3.png')
                    }
                    alt=""
                    className="w-3.5 h-3.5"
                  />
                  {c.likeCount > 0 ? c.likeCount : ''}
                </button>
              </span>
            </div>

            <p className="text-[14px] text-[#2C2C2C] leading-relaxed ml-9">{c.content}</p>
            {c.imageUrlsArray?.length > 0 && (
              <div className="flex gap-2 ml-9 mt-2">
                {c.imageUrlsArray.map((img, i) => (
                  <img
                    key={i}
                    src={postImageUrl(img)}
                    alt=""
                    className="w-20 h-20 rounded-[8px] object-cover"
                    onClick={() => setPreviewImage(postImageUrl(img))}
                  />
                ))}
              </div>
            )}

            {/* 楼中楼 */}
            {c.replies && c.replies.length > 0 && (
              <div className="ml-9 mt-2 bg-[#F7F7F9] rounded-[12px] p-3 space-y-2">
                {c.replies.map((r) => (
                  <div key={r.id} className="text-[13px]">
                    <span className="font-medium text-[#2C2C2C]">
                      {r.author?.username ?? '杯友'}
                    </span>
                    <span className="text-[#929292]"> 回复：</span>
                    <span className="text-[#2C2C2C] leading-relaxed">{r.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
      </main>

      {/* 图片预览 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="" className="max-w-full max-h-full object-contain" />
          <button className="absolute top-6 right-6 text-white text-[24px]" aria-label="关闭">
            ×
          </button>
        </div>
      )}

      {/* 底部评论输入栏 */}
      <div className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[920px] -translate-x-1/2 items-end gap-2 border-t border-gray-100 bg-white px-3 py-2.5 lg:bottom-5 lg:rounded-[16px] lg:border lg:border-[#e7e7eb] lg:px-4 lg:py-3 lg:shadow-[0_10px_30px_rgba(27,27,38,0.1)]">
        <div className="flex-1">
          {replyingTo && (
            <div className="text-[11px] text-[#929292] mb-1 flex items-center justify-between">
              <span>回复 @{replyingTo.username}</span>
              <button onClick={() => setReplyingTo(null)} className="text-[#FB7299]">
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
            className="w-full text-[14px] bg-[#F7F7F9] rounded-[16px] px-4 py-2.5 outline-none resize-none max-h-28"
          />
        </div>
        <button
          onClick={submitComment}
          disabled={sending}
          className="interactive-press rounded-full bg-[#FB7299] px-5 py-2.5 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[#ee628b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? '发送中' : '发送'}
        </button>
      </div>
      <div className="h-16" />

      <LoginTipModal open={showLoginTip} onClose={() => setShowLoginTip(false)} />
    </div>
  );
}
