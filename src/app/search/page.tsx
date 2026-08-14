'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllKeywords, searchToyPost } from '@/lib/api';
import type { Keyword, Post, Toy } from '@/lib/types';
import PostCard from '@/components/post/PostCard';
import ToyImage from '@/components/toy/ToyImage';

/**
 * 搜索页：热词 + 实时搜索结果（玩具 + 帖子）
 */
export default function SearchPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [query, setQuery] = useState('');
  const [toys, setToys] = useState<Toy[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [keywordsError, setKeywordsError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const pageRef = useRef(1);
  // 请求序号：快速连续搜索时，过期响应直接丢弃（与榜单页 requestVersion 同一模式）
  const requestVersionRef = useRef(0);

  // 加载热词
  useEffect(() => {
    getAllKeywords()
      .then(setKeywords)
      .catch(() => setKeywordsError(true));
  }, []);

  const doSearch = async (keyword: string, page = 1) => {
    if (!keyword.trim()) return;
    requestVersionRef.current += 1;
    const version = requestVersionRef.current;
    if (page === 1) {
      setSearched(true);
      setLoading(true);
      setSearchError(false);
      setLoadMoreError(false);
      // 清空旧结果，避免上一次搜索的内容冒充新查询的结果
      setToys([]);
      setPosts([]);
    } else {
      setLoadMoreLoading(true);
      setLoadMoreError(false);
    }
    try {
      const res = await searchToyPost(keyword, page);
      if (version !== requestVersionRef.current) return;
      if (page === 1) {
        setToys(res.toys);
        setPosts(res.posts);
      } else {
        setPosts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...res.posts.filter((p) => !seen.has(p.id))];
        });
      }
      setHasMore(res.pagination.hasMore);
      pageRef.current = page;
    } catch {
      // 过期请求的报错同样丢弃；当前请求失败则展示错误态
      if (version === requestVersionRef.current) {
        if (page === 1) setSearchError(true);
        else setLoadMoreError(true);
      }
    } finally {
      if (version === requestVersionRef.current) {
        if (page === 1) setLoading(false);
        else setLoadMoreLoading(false);
      }
    }
  };

  const handleSearch = () => {
    doSearch(query, 1);
  };

  const handleLoadMore = () => {
    if (loading) return;
    doSearch(query, pageRef.current + 1);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 顶部 Focus Shell：返回 + 唯一搜索框 + 取消（不接社区 Header） */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur-md">
        <div className="search-shell flex items-center gap-2.5 py-3 lg:py-4">
          <Link href="/" className="hidden shrink-0 items-center text-[14px] font-bold tracking-[-0.02em] text-[var(--ink)] transition-opacity hover:opacity-80 lg:inline-flex">
            杯友酱
          </Link>
          <button
            onClick={() => router.back()}
            className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink-soft)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span className="hidden sm:inline">返回</span>
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--background)] px-4 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入玩具名或标签..."
              aria-label="搜索玩具或帖子"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <button onClick={() => router.back()} className="shrink-0 px-1 text-[14px] font-medium text-[var(--accent-ink)]">
            取消
          </button>
        </div>
      </header>

      {/* 热词 */}
      {!searched && (
        <section className="search-shell pt-4 lg:pt-8">
          <h3 className="mb-3 text-[13px] text-[var(--muted)]">大家都在搜</h3>
          {keywordsError ? (
            <p className="text-[13px] text-[var(--muted)]">热词加载失败</p>
          ) : keywords.length === 0 ? (
            <p className="text-[13px] text-[var(--muted)]">暂无热门搜索</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    setQuery(k.keyword);
                    doSearch(k.keyword, 1);
                  }}
                  className="rounded-full bg-[var(--background)] px-3 py-1.5 text-[13px] text-[var(--ink)] transition-colors hover:bg-[var(--surface-tint)]"
                >
                  {k.keyword}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 搜索结果 */}
      {searched && (
        <div className="pb-12 pt-3 lg:pt-6">
          {loading && <p className="py-10 text-center text-[13px] text-[var(--muted)]">搜索中...</p>}

          {!loading && searchError && (
            <div className="py-10 text-center">
              <p className="mb-4 text-[13px] text-[var(--muted)]">搜索失败，请检查网络后重试</p>
              <button
                onClick={() => doSearch(query, 1)}
                className="interactive-press rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-strong)]"
              >
                重新搜索
              </button>
            </div>
          )}

          {!loading && !searchError && toys.length === 0 && posts.length === 0 && (
            <p className="py-10 text-center text-[13px] text-[var(--muted)]">
              没有找到与「{query}」相关的内容
            </p>
          )}

          {/* 玩具结果：横向媒体卡，桌面加宽到 Shell 全宽 */}
          {toys.length > 0 && (
            <section className="search-shell mb-6">
              <h3 className="mb-2.5 text-[13px] text-[var(--muted)]">玩具（{toys.length}）</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {toys.map((t) => (
                  <Link key={t.id} href={`/bang/${t.id}`} className="search-toy-card active:opacity-90">
                    <div className="search-toy-media">
                      <ToyImage src={t.coverUrl?.[0]} alt={t.name} loading="lazy" />
                    </div>
                    <div className="search-toy-body">
                      <p className="search-toy-name">{t.name}</p>
                      <p className="search-toy-score">
                        <b>{t.rating ?? '-'}</b>
                        <span>分 · {t.reviewCount ?? 0} 篇测评</span>
                      </p>
                      <p className="search-toy-tags">{t.tags ?? ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 帖子结果：收窄容器，图片放大 */}
          {posts.length > 0 && (
            <section className="search-shell--narrow">
              <h3 className="mb-1 text-[13px] text-[var(--muted)]">帖子（{posts.length}）</h3>
              {posts.map((p) => (
                <PostCard key={p.id} post={p} variant="search" />
              ))}
            </section>
          )}

          {hasMore && (
            <div className="search-shell--narrow">
              {loadMoreError ? (
                <div className="py-3 text-center">
                  <p className="mb-2 text-[13px] text-[var(--muted)]">加载更多失败</p>
                  <button
                    onClick={handleLoadMore}
                    className="text-[13px] text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
                  >
                    重新加载
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLoadMore}
                  disabled={loadMoreLoading}
                  className="w-full py-3 text-center text-[13px] text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)] disabled:opacity-50"
                >
                  {loadMoreLoading ? '加载中…' : '加载更多'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
