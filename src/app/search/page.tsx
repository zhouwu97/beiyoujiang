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
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  // 请求序号：快速连续搜索时，过期响应直接丢弃（与榜单页 requestVersion 同一模式）
  const requestVersionRef = useRef(0);

  // 加载热词
  useEffect(() => {
    getAllKeywords()
      .then(setKeywords)
      .catch(() => {});
  }, []);

  const doSearch = async (keyword: string, page = 1) => {
    if (!keyword.trim()) return;
    requestVersionRef.current += 1;
    const version = requestVersionRef.current;
    if (page === 1) {
      setSearched(true);
      setLoading(true);
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
      // ignore（过期请求的报错同样丢弃）
    } finally {
      if (version === requestVersionRef.current && page === 1) setLoading(false);
    }
  };

  const handleSearch = () => {
    doSearch(query, 1);
  };

  const handleLoadMore = () => {
    doSearch(query, pageRef.current + 1);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 搜索栏 */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex w-full max-w-[1040px] items-center gap-2 px-4 py-3 sm:px-6 lg:py-4">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-[var(--background)] px-4 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入玩具名或标签..."
              className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <button onClick={() => router.back()} className="text-[14px] text-[var(--muted)] px-1">
            取消
          </button>
        </div>
      </header>

      {/* 热词 */}
      {!searched && (
        <section className="mx-auto w-full max-w-[1040px] px-4 pt-4 lg:px-0 lg:pt-8">
          <h3 className="text-[13px] text-[var(--muted)] mb-3">大家都在搜</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <button
                key={k.id}
                onClick={() => {
                  setQuery(k.keyword);
                  doSearch(k.keyword, 1);
                }}
                className="px-3 py-1.5 rounded-full bg-[var(--background)] text-[var(--ink)] text-[13px]"
              >
                {k.keyword}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 搜索结果 */}
      {searched && (
        <div className="mx-auto w-full max-w-[1040px] px-3 pb-12 pt-2 lg:px-0 lg:pt-6">
          {loading && <p className="text-center text-[13px] text-[var(--muted)] py-10">搜索中...</p>}

          {!loading && toys.length === 0 && posts.length === 0 && (
            <p className="text-center text-[13px] text-[var(--muted)] py-10">
              没有找到与「{query}」相关的内容
            </p>
          )}

          {/* 玩具结果 */}
          {toys.length > 0 && (
            <section className="mb-4">
              <h3 className="text-[13px] text-[var(--muted)] px-1 mb-2">玩具（{toys.length}）</h3>
              <div className="grid grid-cols-2 gap-3">
                {toys.map((t) => (
                  <Link
                    key={t.id}
                    href={`/bang/${t.id}`}
                    className="group block rounded-[16px] bg-white card-shadow overflow-hidden cursor-pointer active:opacity-80"
                  >
                    <div className="flex aspect-[16/7] w-full items-center justify-center bg-[var(--background)] p-3 sm:p-4">
                      <ToyImage
                        src={t.coverUrl?.[0]}
                        alt={t.name}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-[13px] font-semibold text-[var(--ink)] truncate group-hover:text-[#DF5D91] transition-colors">{t.name}</p>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        评分 {t.rating ?? '-'} · {t.reviewCount ?? 0} 篇测评
                      </p>
                      <p className="text-[11px] text-[var(--accent)] mt-0.5 truncate">{t.tags ?? ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 帖子结果 */}
          {posts.length > 0 && (
            <section>
              <h3 className="text-[13px] text-[var(--muted)] px-1 mb-2">帖子（{posts.length}）</h3>
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </section>
          )}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 text-center text-[13px] text-[var(--accent)]"
            >
              加载更多
            </button>
          )}
        </div>
      )}
    </div>
  );
}
