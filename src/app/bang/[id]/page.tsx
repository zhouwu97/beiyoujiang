'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ToyDetail, ToyReview } from '@/lib/types';
import { getToy, getToyAllReview, wantToy, buyToy, likeToyReview } from '@/lib/api';
import { resolveImage } from '@/lib/utils';
import { getUserId } from '@/stores/auth';
import { useCustomAlert } from '@/components/common/CustomAlert';
import LoginTipModal from '@/components/common/LoginTipModal';

/** 玩具图片完整 URL */
function toyImage(url: string | null | undefined): string {
  if (!url) return resolveImage('/images/homepage.webp');
  if (url.startsWith('http')) return resolveImage(url);
  if (url.startsWith('/')) return resolveImage(url);
  return resolveImage(`/ToyImg/${url}`);
}

/** 评分分布条 */
function ScoreBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-3 text-[var(--muted-light)]">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-[var(--muted-light)]">{count}</span>
    </div>
  );
}

/** 爱心评分 */
function HeartRating({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={i <= score ? '#FB7299' : 'none'}
          stroke={i <= score ? '#FB7299' : '#d4d0d2'}
          strokeWidth="1.5"
        >
          <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
        </svg>
      ))}
    </div>
  );
}

export default function ToyDetailPage() {
  const params = useParams<{ id: string }>();
  const toyId = Number(params.id);
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const me = getUserId();

  const [toy, setToy] = useState<ToyDetail | null>(null);
  const [reviews, setReviews] = useState<ToyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginTip, setShowLoginTip] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        getToy(toyId).catch(() => null),
        getToyAllReview(toyId).catch(() => []),
      ]);
      if (t) setToy(t);
      setReviews(r);
    } catch {
      showAlert('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [toyId, showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWant = async () => {
    if (!me) {
      setShowLoginTip(true);
      return;
    }
    if (!toy) return;
    const next = !toy.isWant;
    setToy({ ...toy, isWant: next, wantCount: next ? toy.wantCount + 1 : toy.wantCount - 1 });
    try {
      await wantToy(toyId);
    } catch {
      setToy({ ...toy, isWant: !next, wantCount: !next ? toy.wantCount + 1 : toy.wantCount - 1 });
      showAlert('操作失败');
    }
  };

  const handleBuy = async () => {
    if (!me) {
      setShowLoginTip(true);
      return;
    }
    if (!toy) return;
    const next = !toy.isBuy;
    setToy({ ...toy, isBuy: next });
    try {
      await buyToy(toyId);
    } catch {
      setToy({ ...toy, isBuy: !next });
      showAlert('操作失败');
    }
  };

  const handleReviewLike = async (review: ToyReview) => {
    if (!me) {
      setShowLoginTip(true);
      return;
    }
    const next = !review.isLiked;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id
          ? { ...r, isLiked: next, likeCount: r.likeCount + (next ? 1 : -1) }
          : r
      )
    );
    try {
      await likeToyReview(review.id);
    } catch {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id
            ? { ...r, isLiked: !next, likeCount: r.likeCount + (next ? -1 : 1) }
            : r
        )
      );
      showAlert('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="loading-overlay fixed inset-0 z-50">
          <div className="loading-mark">杯</div>
          <p className="mt-3 text-[13px] text-[var(--muted)]">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!toy) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-[var(--muted)]">玩具不存在或已下架</p>
          <button
            onClick={() => router.push('/rankingList')}
            className="interactive-press btn-gradient mt-4 px-6 py-2.5 text-[13px]"
          >
            返回榜单
          </button>
        </div>
      </div>
    );
  }

  const cover = toyImage(toy.coverUrl?.[0]);
  const tags = (toy.tags ?? '').split(/[,，]/).filter(Boolean);
  const totalScoreCount = Object.values(toy.scoreDistribution ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="page-shell min-h-screen">
      {/* 顶栏 */}
      <header className="site-header">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[960px] items-center px-4 sm:px-6 lg:min-h-[68px] lg:px-0">
          <button onClick={() => router.back()} className="icon-button" aria-label="返回">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[15px] font-semibold text-[var(--ink)]">{toy.name}</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[960px] lg:my-6">
        <div className="rail-panel overflow-hidden lg:rounded-[22px]">
          {/* 主体内容 */}
          <div className="flex flex-col gap-0 lg:flex-row">
            {/* 左侧封面 */}
            <div className="relative flex-shrink-0 lg:w-[320px]">
              <img
                src={cover}
                alt={toy.name}
                className="w-full object-cover lg:h-[420px]"
                loading="eager"
              />
            </div>

            {/* 右侧信息 */}
            <div className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
              {/* 名称品牌 */}
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[var(--ink)]">
                {toy.name}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                {toy.merchant} · {toy.releaseYear || '2024'}
              </p>

              {/* 标签 */}
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-ink)]"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* 描述 */}
              <p className="mt-4 text-[13px] leading-[1.8] text-[var(--ink-soft)]">
                {toy.description || toy.detail}
              </p>

              {/* 评分区 */}
              <div className="mt-5 rounded-[16px] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-end gap-3">
                  <div>
                    <p className="text-[11px] text-[var(--muted)]">酱友评分</p>
                    <p className="text-[32px] font-extrabold leading-none tracking-[-0.03em] text-[var(--accent)]">
                      {toy.score ?? toy.rating ?? '-'}
                    </p>
                  </div>
                  <div className="mb-1 flex-1 space-y-1">
                    {['5', '4', '3', '2', '1'].map((key) => (
                      <ScoreBar
                        key={key}
                        label={key}
                        count={toy.scoreDistribution?.[key] ?? 0}
                        total={totalScoreCount}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleWant}
                  className={`interactive-press flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3 text-[14px] font-semibold transition-colors ${
                    toy.isWant
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-[var(--surface-subtle)] text-[var(--ink-soft)]'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={toy.isWant ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
                  </svg>
                  想冲
                  <span className="text-[12px] font-medium">{toy.wantCount}人想冲</span>
                </button>
                <button
                  onClick={handleBuy}
                  className={`interactive-press flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3 text-[14px] font-semibold transition-colors ${
                    toy.isBuy
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-[var(--surface-subtle)] text-[var(--ink-soft)]'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={toy.isBuy ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {toy.isBuy ? '已买过' : '买过'}
                </button>
              </div>
            </div>
          </div>

          {/* 评价列表 */}
          <div className="border-t border-[var(--line)] px-4 py-5 lg:px-6 lg:py-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[var(--ink)]">
                评价 <span className="text-[13px] font-normal text-[var(--muted)]">{reviews.length}</span>
              </h3>
              {toy.shopLink && (
                <a
                  href={toy.shopLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-semibold text-[var(--accent)] transition-opacity hover:opacity-70"
                >
                  去购买 →
                </a>
              )}
            </div>

            {reviews.length === 0 && (
              <p className="py-8 text-center text-[13px] text-[var(--muted)]">
                还没有评价，快来分享体验~
              </p>
            )}

            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="flex gap-3">
                  <img
                    src={resolveImage(review.author?.photo)}
                    alt=""
                    className="author-avatar h-9 w-9 flex-shrink-0 rounded-[10px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[var(--ink)]">
                        {review.author?.username ?? '杯友'}
                      </span>
                      <HeartRating score={review.score} />
                      <span className="ml-auto text-[11px] text-[var(--muted-light)]">
                        {review.timeString}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-[1.7] text-[var(--ink-soft)]">
                      {review.content}
                    </p>
                    {review.images?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {review.images.map((img, i) => (
                          <img
                            key={i}
                            src={toyImage(img)}
                            alt=""
                            className="h-20 w-20 rounded-[10px] object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => handleReviewLike(review)}
                      className={`mt-2 flex items-center gap-1 text-[12px] transition-colors ${
                        review.isLiked ? 'text-[var(--accent)]' : 'text-[var(--muted-light)]'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={review.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
                      </svg>
                      {review.likeCount > 0 ? review.likeCount : '赞'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <LoginTipModal open={showLoginTip} onClose={() => setShowLoginTip(false)} />
    </div>
  );
}
