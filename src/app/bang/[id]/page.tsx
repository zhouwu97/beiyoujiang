'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ToyDetail, ToyReview, Toy } from '@/lib/types';
import { getToy, getToyAllReview, getAllToy, wantToy, buyToy, likeToyReview } from '@/lib/api';
import { resolveAvatar, resolveToyImage, normalizeImageList, formatCount } from '@/lib/utils';
import { getUserId } from '@/stores/auth';
import { useCustomAlert } from '@/components/common/CustomAlert';
import LoginTipModal from '@/components/common/LoginTipModal';

/** 刺激等级 → 中文 */
const STIMULATION_LABELS: Record<string, string> = {
  ENTRY: '慢玩入门',
  ADVANCED: '进阶训练',
  HIGH: '超高刺激',
  EXTREME: '榨汁玩具',
};

/** 分类 → 中文 */
const CATEGORY_LABELS: Record<string, string> = {
  CUP: '杯子',
  LARGE_MOLD: '大型倒模',
  HALF_BODY: '半身',
  SMALL_MOLD: '杯酱名器',
};

/** 统一解析玩具图片（兼容数组/JSON 字符串数组/裸文件名） */
function getToyCover(toy: ToyDetail | null): string {
  if (!toy) return resolveToyImage(null);
  // getToy 实测：coverUrl 是 JSON 字符串，coverUrlsArray 才是真正数组
  const raw = toy.coverUrlsArray?.length ? toy.coverUrlsArray : toy.coverUrl;
  const urls = normalizeImageList(raw);
  if (urls.length > 0) return resolveToyImage(urls[0]);
  // 备用：images 字段
  if (Array.isArray(toy.images) && toy.images.length > 0) {
    return resolveToyImage(toy.images[0]);
  }
  return resolveToyImage(null);
}

/** 收集画廊图片（封面 + 周榜图 + 详情图，去重） */
function collectGalleryImages(toy: ToyDetail | null): string[] {
  if (!toy) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (v: unknown) => {
    for (const u of normalizeImageList(v)) {
      if (u && !seen.has(u)) {
        seen.add(u);
        out.push(u);
      }
    }
  };
  push(toy.coverUrlsArray?.length ? toy.coverUrlsArray : toy.coverUrl);
  push(toy.weeklyTopImg);
  push(toy.images);
  return out;
}

/** 评分分布条 */
function ScoreBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="td-bar">
      <span>{label}</span>
      <div className="td-track">
        <div className="td-fill" style={{ width: `${pct}%` }} />
      </div>
      <span>{count}</span>
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
          fill={i <= score ? 'var(--accent)' : 'none'}
          stroke={i <= score ? 'var(--accent)' : 'var(--muted-light)'}
          strokeWidth="1.5"
        >
          <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
        </svg>
      ))}
    </div>
  );
}

/** 图片错误 fallback */
function ImgFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--surface-subtle)] text-[var(--muted)] ${className}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} loading="lazy" />;
}

export default function ToyDetailPage() {
  const params = useParams<{ id: string }>();
  const toyId = Number(params.id);
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const me = getUserId();

  const [toy, setToy] = useState<ToyDetail | null>(null);
  const [reviews, setReviews] = useState<ToyReview[]>([]);
  const [similar, setSimilar] = useState<Toy[]>([]);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLoginTip, setShowLoginTip] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, r] = await Promise.all([
          getToy(toyId).catch(() => null),
          getToyAllReview(toyId).catch(() => []),
        ]);
        if (cancelled) return;
        if (t) {
          setToy(t);
          setGalleryIdx(0);
          // 同类热卖（侧边栏相似条目）
          getAllToy('', t.category || '', 0, 1, 8)
            .then((res) => {
              if (!cancelled) setSimilar(res.list.filter((x) => x.id !== toyId).slice(0, 3));
            })
            .catch(() => {
              if (!cancelled) setSimilar([]);
            });
        }
        setReviews(r);
      } catch {
        if (!cancelled) showAlert('加载失败，请重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toyId, showAlert]);

  const galleryImages = useMemo(() => collectGalleryImages(toy), [toy]);

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
        <div className="text-center">
          <div className="loading-mark mx-auto">杯</div>
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

  const cover = getToyCover(toy);
  const tags = (toy.tags ?? '').split(/[,，]/).filter(Boolean);
  // getToy 实测评分分布字段名是 starCounts
  const scoreDist = toy.starCounts ?? toy.scoreDistribution ?? {};
  const totalScoreCount = Object.values(scoreDist).reduce((a, b) => a + b, 0);
  const rawScore = toy.score ?? toy.rating;
  const scoreDisplay = rawScore != null ? String(rawScore) : '-';
  const categoryLabel = CATEGORY_LABELS[toy.category] ?? (toy.category || '未分类');
  const stimulationLabel = STIMULATION_LABELS[toy.stimulation] ?? '—';
  const hotScore = toy.hotScore != null && toy.hotScore > 0 ? String(toy.hotScore) : '—';

  return (
    <div className="page-shell min-h-screen">
      {/* 顶栏 */}
      <header className="site-header">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1200px] items-center px-4 sm:px-6 lg:min-h-[68px] lg:px-8">
          <button onClick={() => router.back()} className="icon-button" aria-label="返回">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="flex-1 truncate text-center text-[15px] font-semibold text-[var(--ink)]">
            {toy.name}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="td-main">
        <div className="td-grid">
          {/* 主面板 */}
          <div className="panel toymain">
            {/* 头部：画廊 + 信息 */}
            <section className="td-hero">
              <div className="td-gallery">
                <div className="td-cover">
                  <ImgFallback
                    src={
                      galleryImages.length > 0
                        ? resolveToyImage(galleryImages[galleryIdx] ?? galleryImages[0])
                        : cover
                    }
                    alt={toy.name}
                    className="td-cover-img"
                  />
                </div>
                {galleryImages.length > 1 && (
                  <div className="td-thumbs">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        className={`td-thumb${i === galleryIdx ? ' on' : ''}`}
                        onClick={() => setGalleryIdx(i)}
                        aria-label={`图片 ${i + 1}`}
                      >
                        <img
                          src={resolveToyImage(img)}
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </button>
                    ))}
                    <span className="td-thumbcount">
                      {galleryIdx + 1} / {galleryImages.length}
                    </span>
                  </div>
                )}
              </div>

              <div className="td-info">
                <div className="eyebrow">{toy.merchant || 'BEIYOUJIANG'} · PRODUCT DETAIL</div>
                <h1 className="td-name">{toy.name}</h1>
                <div className="td-merchant">
                  {toy.merchant}
                  {toy.releaseYear ? ` · ${toy.releaseYear}` : ''}
                </div>

                {tags.length > 0 && (
                  <div className="td-tags">
                    {tags.map((tag) => (
                      <span key={tag} className="td-tag">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <p className="td-desc">{toy.description || toy.detail || '暂无描述'}</p>

                <div className="td-score">
                  <div className="td-score-num">
                    <small>酱友评分</small>
                    <strong>{scoreDisplay}</strong>
                    <em>共 {totalScoreCount} 人评分</em>
                  </div>
                  <div className="td-bars">
                    {['5', '4', '3', '2', '1'].map((key) => (
                      <ScoreBar
                        key={key}
                        label={key}
                        count={scoreDist[key] ?? 0}
                        total={totalScoreCount}
                      />
                    ))}
                  </div>
                </div>

                <div className="td-acts">
                  <button
                    onClick={handleWant}
                    className={`td-btn${toy.isWant ? ' on' : ''}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={toy.isWant ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
                    </svg>
                    想冲 · {formatCount(toy.wantCount)}
                  </button>
                  <button
                    onClick={handleBuy}
                    className={`td-btn primary${toy.isBuy ? ' on' : ''}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    {toy.isBuy ? '已买过' : '买过'}
                  </button>
                </div>
              </div>
            </section>

            {/* 信息条 */}
            <div className="td-strip">
              <div className="td-cell">
                <span>分类</span>
                <b>{categoryLabel}</b>
              </div>
              <div className="td-cell">
                <span>发行年份</span>
                <b>{toy.releaseYear || '—'}</b>
              </div>
              <div className="td-cell">
                <span>热度</span>
                <b>{hotScore}</b>
              </div>
              <div className="td-cell">
                <span>评价数</span>
                <b>{toy.reviewCount ?? 0} 篇测评</b>
              </div>
            </div>

            {/* 评价 */}
            <section className="td-reviews">
              <div className="td-reviewhead">
                <h2>
                  评价 <span>{reviews.length}</span>
                </h2>
                {toy.shopLink && (
                  <a className="td-purchase" href={toy.shopLink} target="_blank" rel="noopener noreferrer">
                    去购买 →
                  </a>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="td-empty">
                  <div className="td-empty-icon">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p>还没有公开评价，来做第一个分享体验的人吧~</p>
                </div>
              ) : (
                <div className="td-reviewlist">
                  {reviews.map((review) => (
                    <div key={review.id} className="td-review">
                      <div className="td-rhead">
                        <img
                          src={resolveAvatar(review.author?.photo)}
                          alt=""
                          className="td-rava"
                          loading="lazy"
                        />
                        <div className="td-rname">
                          <span>{review.author?.username ?? '杯友'}</span>
                          <HeartRating score={review.score} />
                        </div>
                        <span className="td-rtime">{review.timeString}</span>
                      </div>
                      <p className="td-rbody">{review.content}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="td-rimgs">
                          {review.images.map((img, i) => (
                            <img
                              key={i}
                              src={resolveToyImage(img)}
                              alt=""
                              className="td-rimg"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleReviewLike(review)}
                        className={`td-like${review.isLiked ? ' on' : ''}`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={review.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M20.8 8.7c0 5.5-8.8 10-8.8 10s-8.8-4.5-8.8-10A4.2 4.2 0 0 1 11 6.1a4.2 4.2 0 0 1 9.8 2.6Z" />
                        </svg>
                        {review.likeCount > 0 ? review.likeCount : '赞'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 右侧栏 */}
          <aside className="td-side">
            <section className="panel sidecard">
              <div className="td-sidetitle">
                <h3 className="sectiontitle">社区数据</h3>
                <small>实时</small>
              </div>
              <div className="td-quick">
                <div>
                  <span>想冲</span>
                  <b>{formatCount(toy.wantCount)}</b>
                </div>
                <div>
                  <span>浏览</span>
                  <b>{toy.viewCount ? formatCount(toy.viewCount) : '—'}</b>
                </div>
                <div>
                  <span>热度</span>
                  <b>{hotScore}</b>
                </div>
                <div>
                  <span>评价</span>
                  <b>{toy.reviewCount ?? 0}</b>
                </div>
              </div>
            </section>

            <section className="panel sidecard">
              <div className="td-sidetitle">
                <h3 className="sectiontitle">基础信息</h3>
                <small>INFO</small>
              </div>
              <div className="td-spec">
                <span>品牌</span>
                <span>{toy.merchant || '—'}</span>
              </div>
              <div className="td-spec">
                <span>年份</span>
                <span>{toy.releaseYear || '—'}</span>
              </div>
              <div className="td-spec">
                <span>类别</span>
                <span>{categoryLabel}</span>
              </div>
              <div className="td-spec">
                <span>刺激度</span>
                <span>{stimulationLabel}</span>
              </div>
              {toy.shopLink && (
                <a
                  href={toy.shopLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="td-buy"
                >
                  前往购买
                </a>
              )}
            </section>

            {similar.length > 0 && (
              <section className="panel sidecard">
                <div className="td-sidetitle">
                  <h3 className="sectiontitle">相似条目</h3>
                  <small>更多</small>
                </div>
                <div className="td-minilist">
                  {similar.map((item) => (
                    <button
                      key={item.id}
                      className="td-mini"
                      onClick={() => {
                        setGalleryIdx(0);
                        router.push(`/bang/${item.id}`);
                      }}
                    >
                      <span className="td-minicov">
                        <img
                          src={resolveToyImage(
                            normalizeImageList(item.coverUrl)[0] ??
                              normalizeImageList(item.weeklyTopImg)[0] ??
                              null
                          )}
                          alt=""
                        />
                      </span>
                      <span className="td-minicopy">
                        <b>{item.name}</b>
                        <span>
                          {item.rating ?? '—'} 分 · {formatCount(item.wantCount ?? 0)} 想冲
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>

      <LoginTipModal open={showLoginTip} onClose={() => setShowLoginTip(false)} />

      <style>{`
        /* ===== 玩具详情页（桌面端产品详情系统） ===== */
        .td-main {
          width: min(1200px, calc(100% - 28px));
          margin: 0 auto;
          padding: 0 0 64px;
        }
        .td-grid {
          display: block;
          max-width: 900px;
          margin: 0 auto;
          padding-top: 16px;
        }
        .toymain {
          overflow: hidden;
        }
        .td-hero {
          display: flex;
          flex-direction: column;
        }
        .td-gallery {
          padding: 20px;
          border-bottom: 1px solid var(--line);
          background: var(--surface-subtle);
          display: flex;
          flex-direction: column;
        }
        .td-cover {
          flex: 1;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .td-cover-img {
          display: block;
          max-width: 100%;
          max-height: 420px;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(37, 27, 31, 0.1);
        }
        .td-thumbs {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .td-thumb {
          width: 46px;
          height: 46px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: #eee9e7;
          overflow: hidden;
          padding: 0;
          transition: border-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out), transform 130ms var(--ease-out);
        }
        .td-thumb:active {
          transform: scale(0.96);
        }
        .td-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .td-thumb.on {
          border-color: rgba(200, 77, 107, 0.4);
          box-shadow: 0 0 0 2px var(--accent-soft) inset;
        }
        .td-thumbcount {
          margin-left: auto;
          color: var(--muted);
          font-size: 11px;
        }
        .td-info {
          padding: 22px 22px 24px;
          display: flex;
          flex-direction: column;
        }
        .td-name {
          margin: 8px 0 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.035em;
          color: var(--ink);
        }
        .td-merchant {
          margin-top: 5px;
          color: var(--muted);
          font-size: 12px;
        }
        .td-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 13px;
        }
        .td-tag {
          height: 25px;
          padding: 0 9px;
          border-radius: 8px;
          background: var(--accent-soft);
          display: inline-flex;
          align-items: center;
          color: var(--accent-ink);
          font-size: 11px;
          font-weight: 700;
        }
        .td-desc {
          margin: 16px 0 0;
          color: var(--ink-soft);
          font-size: 12px;
          line-height: 1.85;
        }
        .td-score {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 14px;
          background: var(--surface-subtle);
          display: flex;
          gap: 18px;
          align-items: stretch;
        }
        .td-score-num {
          flex: none;
          width: 84px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .td-score-num small {
          color: var(--muted);
          font-size: 10px;
        }
        .td-score-num strong {
          margin-top: 3px;
          color: var(--accent);
          font-size: 30px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .td-score-num em {
          margin-top: 5px;
          color: var(--muted-light);
          font-size: 10px;
          font-style: normal;
        }
        .td-bars {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }
        .td-bar {
          display: grid;
          grid-template-columns: 12px 1fr 22px;
          align-items: center;
          gap: 7px;
          color: var(--muted-light);
          font-size: 10px;
          font-variant-numeric: tabular-nums;
        }
        .td-track {
          height: 5px;
          border-radius: 99px;
          background: #e4e0de;
          overflow: hidden;
        }
        .td-fill {
          height: 100%;
          border-radius: 99px;
          background: var(--accent);
          transition: width 700ms var(--ease-out);
        }
        .td-acts {
          margin-top: auto;
          padding-top: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }
        .td-btn {
          height: 42px;
          border-radius: 12px;
          background: var(--surface-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: var(--ink-soft);
          font-size: 12px;
          font-weight: 700;
          transition: transform 140ms var(--ease-out), background-color 180ms var(--ease-out), color 180ms var(--ease-out);
        }
        .td-btn:active {
          transform: scale(0.97);
        }
        .td-btn.on {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .td-btn.primary {
          background: var(--accent);
          color: #fff;
        }
        .td-btn.primary:hover {
          background: var(--accent-strong);
        }
        .td-btn.primary.on {
          background: var(--accent-strong);
          color: #fff;
        }
        .td-strip {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .td-cell {
          padding: 13px 18px;
          border-right: 1px solid var(--line);
        }
        .td-cell:nth-child(2n) {
          border-right: 0;
        }
        .td-cell:last-child {
          border-right: 0;
        }
        .td-cell span {
          display: block;
          color: var(--muted);
          font-size: 10px;
        }
        .td-cell b {
          display: block;
          margin-top: 4px;
          font-size: 13px;
          color: var(--ink-soft);
          font-weight: 650;
        }
        .td-reviews {
          padding: 20px 22px 26px;
        }
        .td-reviewhead {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .td-reviewhead h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: var(--ink);
        }
        .td-reviewhead h2 span {
          font-size: 12px;
          color: var(--muted);
          font-weight: 500;
        }
        .td-purchase {
          color: var(--accent);
          font-size: 12px;
          font-weight: 700;
        }
        .td-purchase:hover {
          color: var(--accent-strong);
        }
        .td-empty {
          margin-top: 18px;
          padding: 30px 20px;
          border: 1px dashed var(--line-strong);
          border-radius: 14px;
          background: var(--surface-subtle);
          text-align: center;
        }
        .td-empty-icon {
          display: inline-flex;
          width: 56px;
          height: 56px;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: var(--surface);
          color: var(--muted-light);
        }
        .td-empty p {
          margin: 12px 0 0;
          color: var(--muted);
          font-size: 12px;
        }
        .td-reviewlist {
          margin-top: 8px;
        }
        .td-review {
          padding: 16px 0;
          border-bottom: 1px solid var(--line);
        }
        .td-review:last-child {
          border-bottom: 0;
        }
        .td-rhead {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .td-rava {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px var(--line) inset;
        }
        .td-rname {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .td-rname span {
          font-size: 12px;
          font-weight: 700;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .td-rtime {
          margin-left: auto;
          flex: none;
          color: var(--muted-light);
          font-size: 11px;
        }
        .td-rbody {
          margin: 9px 0 0;
          color: var(--ink-soft);
          font-size: 12px;
          line-height: 1.75;
        }
        .td-rimgs {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .td-rimg {
          width: 84px;
          height: 84px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 0 0 1px var(--line);
        }
        .td-like {
          margin-top: 9px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 5px 11px;
          color: var(--muted-light);
          font-size: 12px;
          transition: background-color 160ms var(--ease-out), color 160ms var(--ease-out), transform 130ms var(--ease-out);
        }
        .td-like:active {
          transform: scale(0.96);
        }
        .td-like.on {
          background: var(--accent-soft);
          color: var(--accent);
        }
        /* 右侧栏 */
        .td-side {
          display: none;
        }
        .td-sidetitle {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 12px;
        }
        .td-sidetitle small {
          font-size: 10px;
          color: var(--muted-light);
        }
        .td-quick {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .td-quick div {
          padding: 11px 12px;
          border-radius: 12px;
          background: var(--surface-subtle);
        }
        .td-quick span {
          display: block;
          color: var(--muted);
          font-size: 10px;
        }
        .td-quick b {
          display: block;
          margin-top: 4px;
          font-size: 16px;
          font-weight: 780;
          color: var(--ink);
          letter-spacing: -0.02em;
        }
        .td-spec {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 38px;
          border-bottom: 1px solid var(--line);
          font-size: 12px;
        }
        .td-spec:last-of-type {
          border-bottom: 0;
        }
        .td-spec span:first-child {
          color: var(--muted);
        }
        .td-spec span:last-child {
          color: var(--ink-soft);
          font-weight: 650;
        }
        .td-buy {
          display: flex;
          width: 100%;
          height: 38px;
          align-items: center;
          justify-content: center;
          margin-top: 13px;
          border-radius: 11px;
          background: var(--accent);
          color: #fff;
          font-size: 12px;
          font-weight: 750;
          transition: background-color 160ms var(--ease-out), transform 140ms var(--ease-out);
        }
        .td-buy:hover {
          background: var(--accent-strong);
        }
        .td-buy:active {
          transform: scale(0.98);
        }
        .td-minilist {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .td-mini {
          display: grid;
          grid-template-columns: 46px 1fr;
          gap: 10px;
          align-items: center;
          padding: 7px 8px;
          border-radius: 11px;
          text-align: left;
          transition: background-color 160ms var(--ease-out), transform 130ms var(--ease-out);
        }
        .td-mini:hover {
          background: var(--surface-subtle);
        }
        .td-mini:active {
          transform: scale(0.98);
        }
        .td-minicov {
          width: 46px;
          height: 56px;
          border-radius: 10px;
          background: var(--surface-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .td-minicov img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .td-minicopy {
          min-width: 0;
        }
        .td-minicopy b {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .td-minicopy span {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 11px;
        }

        /* 桌面端 */
        @media (min-width: 960px) {
          .td-main {
            width: min(1200px, calc(100% - 48px));
            padding: 0 0 80px;
          }
          .td-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 300px;
            gap: 24px;
            align-items: start;
            max-width: none;
            margin: 0 auto;
            padding-top: 24px;
          }
          .td-hero {
            display: grid;
            grid-template-columns: 360px 1fr;
            min-height: 470px;
          }
          .td-gallery {
            padding: 26px;
            border-right: 1px solid var(--line);
            border-bottom: 0;
          }
          .td-cover {
            min-height: 380px;
          }
          .td-cover-img {
            max-height: 430px;
          }
          .td-info {
            padding: 28px 30px;
          }
          .td-name {
            font-size: 24px;
          }
          .td-strip {
            grid-template-columns: repeat(4, 1fr);
          }
          .td-cell:nth-child(2n) {
            border-right: 1px solid var(--line);
          }
          .td-cell:nth-child(4n) {
            border-right: 0;
          }
          .td-side {
            display: flex;
            flex-direction: column;
            gap: 16px;
            position: sticky;
            top: 84px;
          }
        }
      `}</style>
    </div>
  );
}
