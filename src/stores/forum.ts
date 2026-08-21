/**
 * beiyoujiang.com 论坛前端 - 帖子流状态管理
 *
 * 每个 `${plate}-${sort}` 都是独立的查询状态。这样切换板块、排序或刷新时，
 * 分页、加载态、错误态和过期标记不会再互相串写。
 */
import { create } from 'zustand';
import type { Post, GetAllPostParams } from '@/lib/types';
import { Plate, SortOrder } from '@/lib/types';
import { getAllPost, getApiErrorMessage } from '@/lib/api';

interface FeedQueryState {
  posts: Post[];
  page: number;
  loading: boolean;
  exhausted: boolean;
  error: string | null;
  requestVersion: number;
}

interface ForumState {
  plate: Plate;
  sort: SortOrder;
  queries: Record<string, FeedQueryState>;
}

const EMPTY_QUERY: FeedQueryState = {
  posts: [],
  page: 0,
  loading: false,
  exhausted: false,
  error: null,
  requestVersion: 0,
};

const inFlight = new Map<string, AbortController>();

function cacheKey(plate: Plate, sort: SortOrder): string {
  return `${plate}-${sort}`;
}

function mergeUniquePosts(existing: Post[], incoming: Post[]): Post[] {
  const postsById = new Map<number, Post>();
  for (const post of existing) postsById.set(post.id, post);
  for (const post of incoming) {
    // 上游偶尔重复返回相邻页数据，新数据不覆盖已渲染的稳定顺序。
    if (!postsById.has(post.id)) postsById.set(post.id, post);
  }
  return Array.from(postsById.values());
}

function getQuery(state: ForumState, key: string): FeedQueryState {
  return state.queries[key] ?? EMPTY_QUERY;
}

function setQuery(key: string, updater: (query: FeedQueryState) => FeedQueryState): void {
  useForumStore.setState((state) => ({
    queries: {
      ...state.queries,
      [key]: updater(getQuery(state, key)),
    },
  }));
}

function setPlate(plate: Plate): void {
  useForumStore.setState({ plate });
}

function setSort(sort: SortOrder): void {
  useForumStore.setState({ sort });
}

async function fetchPage(plate: Plate, sort: SortOrder, page: number, force = false): Promise<void> {
  const key = cacheKey(plate, sort);
  const existing = getQuery(useForumStore.getState(), key);
  if (!force && (existing.loading || existing.exhausted)) return;

  if (force) inFlight.get(key)?.abort();
  const controller = new AbortController();
  inFlight.set(key, controller);
  const version = existing.requestVersion + 1;

  setQuery(key, (query) => ({
    ...query,
    loading: true,
    error: null,
    requestVersion: version,
  }));

  const params: GetAllPostParams = {
    plate,
    most: sort,
    userId: null,
    page,
    pageSize: 20,
  };

  try {
    const result = await getAllPost(params, { signal: controller.signal, timeoutMs: 10_000 });
    const current = getQuery(useForumStore.getState(), key);
    // 旧请求即使最后返回，也不能覆盖同一查询的新版本。
    if (current.requestVersion !== version) return;

    const hasMore = result.list.length > 0;
    setQuery(key, (query) => ({
      ...query,
      posts: mergeUniquePosts(page === 1 ? [] : query.posts, result.list),
      page: Math.max(query.page, page),
      loading: false,
      exhausted: !hasMore,
      error: null,
    }));
  } catch (error) {
    const current = getQuery(useForumStore.getState(), key);
    if (current.requestVersion !== version) return;
    setQuery(key, (query) => ({
      ...query,
      loading: false,
      error: getApiErrorMessage(error),
    }));
  } finally {
    if (inFlight.get(key) === controller) inFlight.delete(key);
  }
}

/** 首次进入查询时加载第一页；已加载过的查询直接复用缓存。 */
async function ensureFeedLoaded(): Promise<void> {
  const { plate, sort, queries } = useForumStore.getState();
  const query = getQuery({ plate, sort, queries }, cacheKey(plate, sort));
  if (query.page === 0 && !query.loading && !query.exhausted) {
    await fetchPage(plate, sort, 1);
  }
}

/** 统一的分页入口，页面不再直接拼页码或读全局 loading。 */
async function loadMoreFeed(): Promise<void> {
  const { plate, sort, queries } = useForumStore.getState();
  const query = getQuery({ plate, sort, queries }, cacheKey(plate, sort));
  if (query.loading || query.exhausted) return;
  await fetchPage(plate, sort, Math.max(1, query.page + 1));
}

/** 刷新当前查询：清空当前结果并立即请求第一页。 */
async function refreshCurrentFeed(): Promise<void> {
  const { plate, sort } = useForumStore.getState();
  const key = cacheKey(plate, sort);
  inFlight.get(key)?.abort();
  setQuery(key, (query) => ({
    ...EMPTY_QUERY,
    requestVersion: query.requestVersion + 1,
  }));
  await fetchPage(plate, sort, 1);
}

/** 兼容旧调用：只重置当前查询，不负责偷偷发请求。 */
function reset(): void {
  const { plate, sort } = useForumStore.getState();
  const key = cacheKey(plate, sort);
  inFlight.get(key)?.abort();
  setQuery(key, (query) => ({
    ...EMPTY_QUERY,
    requestVersion: query.requestVersion + 1,
  }));
}

/** 兼容旧调用名，行为等价于加载更多。 */
const fetchNextPage = loadMoreFeed;

function getCachedPosts(): Post[] {
  const { plate, sort, queries } = useForumStore.getState();
  return getQuery({ plate, sort, queries }, cacheKey(plate, sort)).posts;
}

function getCachedTotalPages(): number {
  const { plate, sort, queries } = useForumStore.getState();
  return getQuery({ plate, sort, queries }, cacheKey(plate, sort)).page;
}

const useForumStore = create<ForumState>()(() => ({
  plate: Plate.CupForum,
  sort: SortOrder.ByTime,
  queries: {},
}));

export {
  useForumStore,
  setPlate,
  setSort,
  ensureFeedLoaded,
  refreshCurrentFeed,
  loadMoreFeed,
  fetchNextPage,
  reset,
  getCachedPosts,
  getCachedTotalPages,
  cacheKey,
  EMPTY_QUERY,
};
export type { ForumState, FeedQueryState };
