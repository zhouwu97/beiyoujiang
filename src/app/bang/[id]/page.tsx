'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { ToyDetail, ToyReview, Toy } from '@/lib/types';
import { getToy, getToyAllReview, getAllToy, wantToy, buyToy, likeToyReview } from '@/lib/api';
import { normalizeImageList } from '@/lib/utils';
import { categoryLabel, stimulationLabel } from '@/lib/toyLabels';
import { getUserId } from '@/stores/auth';
import { useCustomAlert } from '@/components/common/CustomAlert';
import LoginTipModal from '@/components/common/LoginTipModal';
import Header from '@/components/layout/Header';
import ToyGallery from '@/components/toy-detail/ToyGallery';
import ToySummary from '@/components/toy-detail/ToySummary';
import ToyMetrics from '@/components/toy-detail/ToyMetrics';
import ScoreDistribution from '@/components/toy-detail/ScoreDistribution';
import ToyActions from '@/components/toy-detail/ToyActions';
import ToyReviews from '@/components/toy-detail/ToyReviews';
import SimilarToys from '@/components/toy-detail/SimilarToys';
import ToyFacts from '@/components/toy-detail/ToyFacts';
import ToyDetailSkeleton from '@/components/toy-detail/ToyDetailSkeleton';
import styles from '@/components/toy-detail/toy-detail.module.css';

/**
 * 收集画廊图片（封面 + 周榜图 + 详情图，去重）。数据语义保留，不做改动。
 */
function collectGalleryImages(toy: ToyDetail | null): string[] {
  if (!toy) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (value: unknown) => {
    for (const url of normalizeImageList(value)) {
      if (url && !seen.has(url)) {
        seen.add(url);
        out.push(url);
      }
    }
  };
  push(toy.coverUrlsArray?.length ? toy.coverUrlsArray : toy.coverUrl);
  push(toy.weeklyTopImg);
  push(toy.images);
  return out;
}

/**
 * 玩具详情页：统一 Header + 榜单 breadcrumb，大图优先 64/36 Hero，
 * 底部 Reviews + Side 合并为一个整体容器。
 * 页面只负责数据、状态、mutations 与组件拼装。
 */
export default function ToyDetailPage() {
  const params = useParams<{ id: string }>();
  const toyId = Number(params.id);
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const me = getUserId();

  const [toy, setToy] = useState<ToyDetail | null>(null);
  const [reviews, setReviews] = useState<ToyReview[]>([]);
  const [similar, setSimilar] = useState<Toy[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'useful'>('latest');
  const [loading, setLoading] = useState(true);
  const [toyError, setToyError] = useState(false);
  const [reviewError, setReviewError] = useState(false);
  const [showLoginTip, setShowLoginTip] = useState(false);
  /** 测评大图查看器 */
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, r] = await Promise.all([
          getToy(toyId),
          getToyAllReview(toyId),
        ]);
        if (cancelled) return;
        setToy(t);
        setReviews(r);
        setToyError(false);
        setReviewError(false);
        if (t) {
          getAllToy('', t.category || '', 0, 1, 8)
            .then((res) => {
              if (!cancelled) setSimilar(res.list.filter((x) => x.id !== toyId).slice(0, 3));
            })
            .catch(() => {
              if (!cancelled) setSimilar([]);
            });
        }
      } catch {
        if (!cancelled) {
          setToyError(true);
          setReviewError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toyId, showAlert]);

  // Ctrl+K 搜索快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const galleryImages = useMemo(() => collectGalleryImages(toy), [toy]);
  const sortedReviews = useMemo(() => {
    if (sortBy === 'useful') {
      return [...reviews].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    }
    return reviews;
  }, [reviews, sortBy]);

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

  /** 测评点赞 mutation lock：同一测评在请求进行中时忽略重复点击 */
  const pendingReviewLikeRef = useRef<Set<number>>(new Set());

  const handleReviewLike = async (review: ToyReview) => {
    if (!me) {
      setShowLoginTip(true);
      return;
    }
    // mutation lock：防止连点发多个请求
    if (pendingReviewLikeRef.current.has(review.id)) return;
    pendingReviewLikeRef.current.add(review.id);
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
    } finally {
      pendingReviewLikeRef.current.delete(review.id);
    }
  };

  // 首屏骨架（Header 与面包屑保留）
  if (loading) {
    return (
      <div className="page-shell min-h-screen">
        <Header variant="detail" />
        <div className={styles.page}>
          <nav className={styles.breadcrumb} aria-label="面包屑">
            <Link href="/rankingList">玩具榜单</Link>
            <span className={styles.crumbSep}>›</span>
            <b className={styles.crumbName}>加载中</b>
          </nav>
          <ToyDetailSkeleton />
        </div>
      </div>
    );
  }

  // 加载失败（API 挂了 / 网络异常）
  if (toyError) {
    return (
      <div className="page-shell min-h-screen">
        <Header variant="detail" />
        <div className={styles.page}>
          <nav className={styles.breadcrumb} aria-label="面包屑">
            <Link href="/rankingList">玩具榜单</Link>
          </nav>
          <div className={styles.notFound}>
            <p>加载失败，请检查网络后重试</p>
            <button
              onClick={() => window.location.reload()}
              className="interactive-press btn-gradient inline-flex px-5 py-2.5 text-[12px]"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 不存在 / 下架（API 成功但无数据）
  if (!toy) {
    return (
      <div className="page-shell min-h-screen">
        <Header variant="detail" />
        <div className={styles.page}>
          <nav className={styles.breadcrumb} aria-label="面包屑">
            <Link href="/rankingList">玩具榜单</Link>
          </nav>
          <div className={styles.notFound}>
            <p>玩具不存在或已下架</p>
            <Link href="/rankingList" className="interactive-press btn-gradient inline-flex px-5 py-2.5 text-[12px]">
              返回榜单
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen">
      <Header variant="detail" />

      <div className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/rankingList">玩具榜单</Link>
          <span className={styles.crumbSep}>›</span>
          <b className={styles.crumbName}>{toy.name}</b>
        </nav>

        {/* 主 Hero：大图 64 / 信息 36 */}
        <div className={styles.shell}>
          <ToyGallery images={galleryImages} name={toy.name} />
          <div className={styles.info}>
            <ToySummary toy={toy} />
            <ToyMetrics toy={toy} />
            <div className={styles.specLine}>
              <div className={styles.spec}>
                <span>分类</span>
                <b>{categoryLabel(toy.category)}</b>
              </div>
              <div className={styles.spec}>
                <span>刺激度</span>
                <b>{stimulationLabel(toy.stimulation)}</b>
              </div>
              <div className={styles.spec}>
                <span>发行年份</span>
                <b>{toy.releaseYear || '—'}</b>
              </div>
            </div>
            <ScoreDistribution toy={toy} />
            <ToyActions toy={toy} onWant={handleWant} onBuy={handleBuy} />
          </div>
        </div>

        {/* 底部社区：Reviews + Side 一个整体容器 */}
        <div className={styles.lower}>
          <ToyReviews
            reviews={sortedReviews}
            total={reviews.length}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onLike={handleReviewLike}
            error={reviewError}
            onPreview={setPreview}
          />
          <aside className={styles.side}>
            <SimilarToys toys={similar} />
            <ToyFacts toy={toy} />
          </aside>
        </div>
      </div>

      {/* 测评大图查看器 */}
      {preview && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="" className="max-h-[90vh] max-w-[90vw] rounded-[12px] object-contain shadow-2xl" />
          <button className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[22px] text-white backdrop-blur transition-colors hover:bg-white/20" aria-label="关闭">
            ×
          </button>
        </div>
      )}

      <LoginTipModal open={showLoginTip} onClose={() => setShowLoginTip(false)} />
    </div>
  );
}
