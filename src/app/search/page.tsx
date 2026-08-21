'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAllKeywords, searchToyPost } from '@/lib/api';
import type { Keyword, Post, Toy } from '@/lib/types';
import PostCard from '@/components/post/PostCard';
import ToyImage from '@/components/toy/ToyImage';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

type TabType = 'all' | 'posts' | 'toys';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q')?.trim() ?? '';

  const [query, setQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsError, setKeywordsError] = useState(false);

  const [toys, setToys] = useState<Toy[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  const pageRef = useRef(1);
  const requestVersionRef = useRef(0);
  const searchAbortRef = useRef<AbortController | null>(null);

  // 当 URL 中的 ?q= 变化时，在渲染阶段同步 query 状态
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  // 加载热词
  useEffect(() => {
    getAllKeywords()
      .then(setKeywords)
      .catch(() => setKeywordsError(true));
  }, []);

  // 执行搜索
  const doSearch = useCallback(async (keyword: string, page = 1) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      searchAbortRef.current?.abort();
      setSearched(false);
      setToys([]);
      setPosts([]);
      setLoading(false);
      setSearchError(false);
      return;
    }

    requestVersionRef.current += 1;
    const version = requestVersionRef.current;
    if (page === 1) {
      searchAbortRef.current?.abort();
      searchAbortRef.current = new AbortController();
      setActiveTab('all');
    }
    const signal = searchAbortRef.current?.signal;

    if (page === 1) {
      setSearched(true);
      setLoading(true);
      setSearchError(false);
      setLoadMoreError(false);
      setToys([]);
      setPosts([]);
    } else {
      setLoadMoreLoading(true);
      setLoadMoreError(false);
    }

    try {
      const res = await searchToyPost(trimmed, page, 20, { signal });
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
  }, []);

  // 当 URL 中的 ?q= 变化时自动触发搜索
  useEffect(() => {
    if (urlQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      doSearch(urlQuery, 1);
    } else {
      setSearched(false);
      setToys([]);
      setPosts([]);
      setLoading(false);
      setSearchError(false);
    }
    return () => searchAbortRef.current?.abort();
  }, [urlQuery, doSearch]);

  // 提交新搜索（同步更新 URL）
  const handleSubmit = (targetQuery?: string) => {
    const kw = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!kw) {
      router.push('/search');
      return;
    }
    router.push(`/search?q=${encodeURIComponent(kw)}`);
  };

  const handleClear = () => {
    setQuery('');
  };

  const handleLoadMore = () => {
    if (loading || loadMoreLoading || !urlQuery) return;
    doSearch(urlQuery, pageRef.current + 1);
  };

  const hasToys = toys.length > 0;
  const hasPosts = posts.length > 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 顶部 Focus Search Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur-md">
        <div className="search-header-shell flex items-center gap-3 py-3 lg:py-3.5">
          <Link
            href="/"
            className="hidden shrink-0 items-center text-[15px] font-bold tracking-[-0.02em] text-[var(--ink)] transition-opacity hover:opacity-80 lg:inline-flex"
          >
            杯友酱
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            <BackArrowIcon />
            <span className="hidden sm:inline">返回</span>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-subtle)] px-3.5 py-1.5 focus-within:border-[#d8cdd0] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(var(--accent-rgb),0.08)]">
            <span className="text-[var(--muted)]">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="输入玩具名或标签..."
              aria-label="搜索玩具或帖子"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="grid h-5 w-5 place-items-center rounded-full bg-[#ded9d6] text-[var(--ink)] hover:bg-[#cec7c3]"
                aria-label="清空"
              >
                <ClearIcon />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-bold text-white transition-colors hover:bg-[var(--accent-strong)]"
            >
              搜索
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 text-[14px] font-semibold text-[var(--accent-ink)]"
          >
            取消
          </button>
        </div>
      </header>

      <main className="search-page-shell pb-16 pt-5">
        {/* 空搜索状态：展示热词 */}
        {!searched && !loading && (
          <section className="pt-2">
            <h2 className="mb-3 text-[13px] font-semibold text-[var(--muted)]">大家都在搜</h2>
            {keywordsError ? (
              <p className="text-[13px] text-[var(--muted-light)]">热词加载失败</p>
            ) : keywords.length === 0 ? (
              <p className="text-[13px] text-[var(--muted-light)]">暂无热门搜索</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {keywords.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleSubmit(k.keyword)}
                    className="rounded-full bg-white border border-[var(--line)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--ink)] shadow-xs transition-colors hover:bg-[var(--surface-tint)] hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                  >
                    {k.keyword}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 正在搜索中 */}
        {loading && (
          <div className="py-16 text-center">
            <div className="loading-mark mx-auto mb-3" />
            <p className="text-[13px] text-[var(--muted)]">正在搜索「{urlQuery}」...</p>
          </div>
        )}

        {/* 搜索报错状态 */}
        {!loading && searchError && (
          <div className="py-16 text-center">
            <p className="mb-4 text-[14px] text-[var(--muted)]">搜索失败，请检查网络后重试</p>
            <button
              type="button"
              onClick={() => doSearch(urlQuery, 1)}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--accent-strong)]"
            >
              重新搜索
            </button>
          </div>
        )}

        {/* 搜索无结果 */}
        {!loading && !searchError && searched && !hasToys && !hasPosts && (
          <div className="py-16 text-center">
            <p className="text-[15px] font-bold text-[var(--ink)]">没有找到与「{urlQuery}」相关的内容</p>
            <p className="mt-1 text-[13px] text-[var(--muted)]">换个关键词试试</p>
            {keywords.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {keywords.slice(0, 6).map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleSubmit(k.keyword)}
                    className="rounded-full bg-white border border-[var(--line)] px-3.5 py-1.5 text-[13px] text-[var(--ink)] shadow-xs transition-colors hover:bg-[var(--surface-tint)]"
                  >
                    {k.keyword}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 搜索结果展示区 */}
        {!loading && !searchError && searched && (hasToys || hasPosts) && (
          <div>
            {/* 顶栏 Tab 筛选 */}
            <div className="mb-5 flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-full px-3.5 py-1 text-[13px] font-semibold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                }`}
              >
                全部
              </button>
              {hasPosts && (
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className={`rounded-full px-3.5 py-1 text-[13px] font-semibold transition-colors ${
                    activeTab === 'posts'
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                  }`}
                >
                  帖子 {posts.length > 0 ? `(${posts.length})` : ''}
                </button>
              )}
              {hasToys && (
                <button
                  type="button"
                  onClick={() => setActiveTab('toys')}
                  className={`rounded-full px-3.5 py-1 text-[13px] font-semibold transition-colors ${
                    activeTab === 'toys'
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                  }`}
                >
                  玩具 {toys.length > 0 ? `(${toys.length})` : ''}
                </button>
              )}
            </div>

            {/* 布局：全部 Tab 下桌面采用 Left Posts + Right Sticky Toys */}
            {activeTab === 'all' && (
              <div
                className={`search-results-grid ${
                  hasToys && hasPosts ? 'search-results-grid--with-rail' : ''
                }`}
              >
                {/* 帖子主列表 */}
                {hasPosts && (
                  <section className="min-w-0 flex-1">
                    <h3 className="mb-3 text-[13px] font-bold text-[var(--muted)]">
                      相关帖子（{posts.length}）
                    </h3>
                    <div className="flex flex-col gap-4">
                      {posts.map((p) => (
                        <PostCard key={p.id} post={p} variant="search" />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="mt-6 text-center">
                        {loadMoreError ? (
                          <div>
                            <p className="mb-2 text-[13px] text-[var(--muted)]">加载更多失败</p>
                            <button
                              type="button"
                              onClick={handleLoadMore}
                              className="text-[13px] font-semibold text-[var(--accent)]"
                            >
                              重新加载
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loadMoreLoading}
                            className="rounded-full border border-[var(--line)] bg-white px-6 py-2 text-[13px] font-semibold text-[var(--accent-ink)] shadow-xs transition-colors hover:bg-[var(--surface-subtle)] disabled:opacity-50"
                          >
                            {loadMoreLoading ? '加载中…' : '加载更多帖子'}
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {/* 匹配玩具（右侧 Sticky Rail） */}
                {hasToys && (
                  <aside className={hasPosts ? 'search-rail-sticky' : 'search-toys-grid'}>
                    <h3 className="text-[13px] font-bold text-[var(--muted)]">
                      匹配玩具（{toys.length}）
                    </h3>
                    {toys.map((t) => (
                      <Link
                        key={t.id}
                        href={`/bang/${t.id}`}
                        className="search-rail-toy-card"
                      >
                        <div className="search-rail-toy-thumb">
                          <ToyImage
                            src={t.coverUrl?.[0]}
                            alt={t.name}
                            loading="lazy"
                          />
                        </div>
                        <div className="search-rail-toy-info">
                          <p className="search-rail-toy-name">{t.name}</p>
                          <p className="search-rail-toy-score">
                            <b>{t.rating ?? '-'}</b>
                            <span>分 · {t.reviewCount ?? 0} 篇测评</span>
                          </p>
                          {t.tags && <p className="search-rail-toy-tags">{t.tags}</p>}
                        </div>
                      </Link>
                    ))}
                  </aside>
                )}
              </div>
            )}

            {/* 纯帖子 Tab */}
            {activeTab === 'posts' && (
              <section className="max-w-[760px]">
                <div className="flex flex-col gap-4">
                  {posts.map((p) => (
                    <PostCard key={p.id} post={p} variant="search" />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadMoreLoading}
                      className="rounded-full border border-[var(--line)] bg-white px-6 py-2 text-[13px] font-semibold text-[var(--accent-ink)] shadow-xs transition-colors hover:bg-[var(--surface-subtle)] disabled:opacity-50"
                    >
                      {loadMoreLoading ? '加载中…' : '加载更多帖子'}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* 纯玩具 Tab */}
            {activeTab === 'toys' && (
              <section className="search-toys-grid">
                {toys.map((t) => (
                  <Link
                    key={t.id}
                    href={`/bang/${t.id}`}
                    className="search-rail-toy-card"
                  >
                    <div className="search-rail-toy-thumb">
                      <ToyImage
                        src={t.coverUrl?.[0]}
                        alt={t.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="search-rail-toy-info">
                      <p className="search-rail-toy-name">{t.name}</p>
                      <p className="search-rail-toy-score">
                        <b>{t.rating ?? '-'}</b>
                        <span>分 · {t.reviewCount ?? 0} 篇测评</span>
                      </p>
                      {t.tags && <p className="search-rail-toy-tags">{t.tags}</p>}
                    </div>
                  </Link>
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <SearchContent />
    </Suspense>
  );
}
