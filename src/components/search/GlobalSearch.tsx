'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllKeywords, searchToyPost } from '@/lib/api';
import { PLATES } from '@/lib/types';
import type { Keyword, Post, Toy } from '@/lib/types';
import ToyImage from '@/components/toy/ToyImage';

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function getPlateName(plateId: number): string {
  const plate = PLATES.find((p) => p.id === plateId);
  return plate ? plate.name : '杯酱论坛';
}

interface GlobalSearchProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onMobileOpen?: () => void;
}

type SuggestionItem =
  | { type: 'toy'; data: Toy }
  | { type: 'post'; data: Post };

export default function GlobalSearch({
  mobileOpen = false,
  onMobileClose,
  onMobileOpen,
}: GlobalSearchProps) {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsLoaded, setKeywordsLoaded] = useState(false);
  const [keywordsError, setKeywordsError] = useState(false);

  const [toys, setToys] = useState<Toy[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const requestVersionRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载热词
  const loadKeywords = useCallback(() => {
    if (keywordsLoaded) return;
    getAllKeywords()
      .then((res) => {
        setKeywords(res);
        setKeywordsLoaded(true);
      })
      .catch(() => {
        setKeywordsError(true);
        setKeywordsLoaded(true);
      });
  }, [keywordsLoaded]);

  // 执行搜索
  const doSearch = useCallback(async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setSearched(false);
      setToys([]);
      setPosts([]);
      setLoading(false);
      setSearchError(false);
      setSelectedIndex(-1);
      return;
    }

    requestVersionRef.current += 1;
    const version = requestVersionRef.current;

    setLoading(true);
    setSearched(true);
    setSearchError(false);
    setSelectedIndex(-1);

    try {
      const res = await searchToyPost(trimmed, 1);
      if (version !== requestVersionRef.current) return;
      setToys(res.toys.slice(0, 3));
      setPosts(res.posts.slice(0, 5));
    } catch {
      if (version === requestVersionRef.current) {
        setSearchError(true);
      }
    } finally {
      if (version === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // 输入变化 + 防抖
  const handleInputChange = (val: string) => {
    setQuery(val);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      requestVersionRef.current += 1;
      setSearched(false);
      setToys([]);
      setPosts([]);
      setLoading(false);
      setSearchError(false);
      setSelectedIndex(-1);
      loadKeywords();
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      doSearch(val);
    }, 250);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!keywordsLoaded) {
      loadKeywords();
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearched(false);
    setToys([]);
    setPosts([]);
    setLoading(false);
    setSearchError(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  };

  const handleSelectToy = (toy: Toy) => {
    setIsOpen(false);
    onMobileClose?.();
    setQuery('');
    setSearched(false);
    setToys([]);
    setPosts([]);
    inputRef.current?.blur();
    mobileInputRef.current?.blur();
    router.push(`/bang/${toy.id}`);
  };

  const handleSelectPost = (post: Post) => {
    setIsOpen(false);
    onMobileClose?.();
    setQuery('');
    setSearched(false);
    setToys([]);
    setPosts([]);
    inputRef.current?.blur();
    mobileInputRef.current?.blur();
    router.push(`/messageDetail/${post.id}`);
  };

  const handleKeywordClick = (kw: string) => {
    setQuery(kw);
    setIsOpen(true);
    doSearch(kw);
  };

  // 整理可选 Suggestion 列表（用于键盘上下箭头切换）
  const suggestionItems: SuggestionItem[] = React.useMemo(() => {
    if (!searched || loading || searchError) return [];
    return [
      ...toys.map((t) => ({ type: 'toy' as const, data: t })),
      ...posts.map((p) => ({ type: 'post' as const, data: p })),
    ];
  }, [searched, loading, searchError, toys, posts]);

  // 键盘操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestionItems.length === 0) return;
      setSelectedIndex((prev) => (prev + 1) % suggestionItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestionItems.length === 0) return;
      setSelectedIndex((prev) => (prev <= 0 ? suggestionItems.length - 1 : prev - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionItems.length > 0) {
        const item = selectedIndex >= 0 && selectedIndex < suggestionItems.length
          ? suggestionItems[selectedIndex]
          : suggestionItems[0];

        if (item.type === 'toy') {
          handleSelectToy(item.data);
        } else {
          handleSelectPost(item.data);
        }
      }
    }
  };

  // 全局快捷键 Ctrl/Cmd + K
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // 移动端宽度（<1024）唤起 mobile overlay，否则聚焦 desktop input
        if (window.innerWidth < 1024) {
          onMobileOpen?.();
        } else {
          inputRef.current?.focus();
          setIsOpen(true);
          loadKeywords();
        }
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [onMobileOpen, loadKeywords]);

  // 点击外部关闭 Popover
  useEffect(() => {
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, []);

  // 移动端 Overlay 打开时自动聚焦
  useEffect(() => {
    if (mobileOpen) {
      loadKeywords();
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 50);
    }
  }, [mobileOpen, loadKeywords]);

  // 渲染 Popover 内容
  const renderPopoverContent = () => {
    // 1. 空 Query 状态：展示“大家都在搜”
    if (!query.trim()) {
      return (
        <div className="global-search-hot">
          <div className="global-search-section-title">大家都在搜</div>
          {keywordsError ? (
            <p className="global-search-hint">输入关键词开始搜索</p>
          ) : keywords.length === 0 ? (
            <p className="global-search-hint">暂无热门搜索</p>
          ) : (
            <div className="global-search-hot-list">
              {keywords.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className="global-search-hot-chip"
                  onClick={() => handleKeywordClick(k.keyword)}
                >
                  {k.keyword}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 2. 加载中 Skeleton
    if (loading && toys.length === 0 && posts.length === 0) {
      return (
        <div className="global-search-loading">
          <div className="global-search-skeleton-row" />
          <div className="global-search-skeleton-row" />
          <div className="global-search-skeleton-row" />
        </div>
      );
    }

    // 3. 搜索错误状态
    if (searchError) {
      return (
        <div className="global-search-status-box">
          <p className="global-search-status-text">搜索失败，请检查网络后重试</p>
          <button
            type="button"
            onClick={() => doSearch(query)}
            className="global-search-retry-btn"
          >
            重新搜索
          </button>
        </div>
      );
    }

    // 4. 无结果状态
    if (searched && !loading && toys.length === 0 && posts.length === 0) {
      return (
        <div className="global-search-status-box">
          <p className="global-search-status-text">没有找到“{query}”的相关内容</p>
          <p className="global-search-status-sub">换个关键词试试</p>
        </div>
      );
    }

    // 5. 搜索结果（玩具最多 3 个在上，帖子最多 5 个在下）
    let itemOffset = 0;

    return (
      <div className="global-search-results">
        {/* 玩具 Section */}
        {toys.length > 0 && (
          <div className="global-search-section">
            <div className="global-search-section-title">玩具</div>
            <div className="global-search-list">
              {toys.map((toy, idx) => {
                const currentIdx = itemOffset + idx;
                const isSelected = selectedIndex === currentIdx;
                return (
                  <button
                    key={toy.id}
                    type="button"
                    className={`global-search-toy-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectToy(toy)}
                  >
                    <div className="global-search-toy-thumb">
                      <ToyImage
                        src={toy.coverUrl?.[0]}
                        alt={toy.name}
                        loading="lazy"
                        className="global-search-toy-img"
                      />
                    </div>
                    <div className="global-search-toy-info">
                      <div className="global-search-toy-top">
                        <span className="global-search-toy-name">{toy.name}</span>
                        {toy.rating ? (
                          <span className="global-search-toy-score">{toy.rating}</span>
                        ) : null}
                      </div>
                      <div className="global-search-toy-meta">
                        <span>{toy.reviewCount ?? 0} 篇测评</span>
                        {toy.tags && (
                          <>
                            <span className="global-search-dot">·</span>
                            <span className="global-search-toy-tag">{toy.tags}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 帖子 Section */}
        {posts.length > 0 && (
          <div className="global-search-section">
            <div className="global-search-section-title">相关帖子</div>
            <div className="global-search-list">
              {posts.map((post, idx) => {
                const currentIdx = toys.length + idx;
                const isSelected = selectedIndex === currentIdx;
                return (
                  <button
                    key={post.id}
                    type="button"
                    className={`global-search-post-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectPost(post)}
                  >
                    <div className="global-search-post-title">{post.title}</div>
                    <div className="global-search-post-meta">
                      <span className="global-search-post-plate">{getPlateName(post.plate)}</span>
                      <span className="global-search-dot">·</span>
                      <span>{post.commentCount ?? 0} 回复</span>
                      <span className="global-search-dot">·</span>
                      <span>{post.timeAgo || '刚刚'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 桌面端：Header 内嵌搜索框 + 下拉浮层 */}
      <div ref={containerRef} className="global-search desktop-header-search-wrap">
        <div className={`global-search-input-box ${isOpen ? 'is-focused' : ''}`}>
          <SearchIcon className="global-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="搜索玩具、帖子..."
            aria-label="全局搜索"
            className="global-search-input"
          />
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="global-search-clear-btn"
              aria-label="清空搜索词"
            >
              <ClearIcon />
            </button>
          ) : (
            <kbd className="global-search-kbd">Ctrl K</kbd>
          )}
        </div>

        {isOpen && (
          <div className="global-search-popover">
            {renderPopoverContent()}
          </div>
        )}
      </div>

      {/* 移动端：全屏搜索 Overlay (<1024px) */}
      {mobileOpen && (
        <div className="mobile-search-overlay" role="dialog" aria-modal="true" aria-label="移动端搜索">
          <div className="mobile-search-header">
            <button
              type="button"
              onClick={onMobileClose}
              className="mobile-search-back-btn"
              aria-label="返回"
            >
              <BackArrowIcon />
            </button>
            <div className="mobile-search-input-box">
              <SearchIcon className="mobile-search-icon" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索玩具、帖子..."
                aria-label="搜索输入"
                className="mobile-search-input"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="mobile-search-clear-btn"
                  aria-label="清空"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onMobileClose}
              className="mobile-search-cancel-btn"
            >
              取消
            </button>
          </div>

          <div className="mobile-search-body">
            {renderPopoverContent()}
          </div>
        </div>
      )}
    </>
  );
}
