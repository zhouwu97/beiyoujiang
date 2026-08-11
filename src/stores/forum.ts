/**
 * beiyoujiang.com 论坛前端 - 帖子列表状态管理
 * 缓存 key = `${plate}-${most}`，缓存帖子数组、总页数、加载状态
 */
import { create } from 'zustand';
import type { Post, GetAllPostParams } from '@/lib/types';
import { Plate, SortOrder } from '@/lib/types';
import { getAllPost } from '@/lib/api';

interface ForumState {
  /** 当前选择的板块 */
  plate: Plate;
  /** 当前选择的排序 */
  sort: SortOrder;
  /** 当前页码 */
  page: number;
  /** 帖子列表缓存（按 plate-sort 分组） */
  postsCache: Record<string, Post[]>;
  /** 总页数缓存 */
  totalPagesCache: Record<string, number>;
  /** 加载中标志 */
  loading: boolean;
  /** 已全部加载完标志 */
  exhausted: boolean;
}

/** 缓存 key 生成 */
function cacheKey(plate: Plate, sort: SortOrder): string {
  return `${plate}-${sort}`;
}

/**
 * 合并分页结果并按帖子 ID 去重。
 * 官方接口偶尔会在相邻页返回重叠数据，直接拼接会触发 React 重复 key 警告。
 */
function mergeUniquePosts(existing: Post[], incoming: Post[]): Post[] {
  const postsById = new Map<number, Post>();
  for (const post of existing) postsById.set(post.id, post);
  for (const post of incoming) {
    if (!postsById.has(post.id)) postsById.set(post.id, post);
  }
  return Array.from(postsById.values());
}

/** 设置板块 */
function setPlate(plate: Plate): void {
  useForumStore.setState({ plate });
}

/** 设置排序 */
function setSort(sort: SortOrder): void {
  useForumStore.setState({ sort });
}

/** 翻页加载更多 */
async function fetchNextPage(): Promise<void> {
  const state = useForumStore.getState();
  const { plate, sort, page, loading, exhausted } = state;

  if (loading || exhausted) return;

  useForumStore.setState({ loading: true });

  try {
    const params: GetAllPostParams = {
      plate,
      most: sort,
      userId: null,
      page: page + 1,
      pageSize: 20,
    };

    const result = await getAllPost(params);
    const key = cacheKey(plate, sort);
    // 官方 API 无分页元数据：返回空数组即表示没有更多帖子
    const hasMore = result.list.length > 0;

    useForumStore.setState((s) => ({
      page: s.page + 1,
      postsCache: {
        ...s.postsCache,
        [key]: mergeUniquePosts(s.postsCache[key] ?? [], result.list),
      },
      totalPagesCache: {
        ...s.totalPagesCache,
        [key]: hasMore ? page + 2 : page + 1,
      },
      exhausted: !hasMore,
      loading: false,
    }));
  } catch {
    useForumStore.setState({ loading: false });
  }
}

/**
 * 重置缓存（切换板块/排序时调用）
 * 会清空当前缓存、页码、加载状态
 */
function reset(): void {
  useForumStore.setState((s) => {
    const key = cacheKey(s.plate, s.sort);
    const newPostsCache = { ...s.postsCache };
    const newTotalPagesCache = { ...s.totalPagesCache };
    delete newPostsCache[key];
    delete newTotalPagesCache[key];
    return {
      postsCache: newPostsCache,
      totalPagesCache: newTotalPagesCache,
      page: 0,
      loading: false,
      exhausted: false,
    };
  });
}

/** 获取当前缓存的帖子 */
function getCachedPosts(): Post[] {
  const state = useForumStore.getState();
  const key = cacheKey(state.plate, state.sort);
  return state.postsCache[key] ?? [];
}

/** 获取当前缓存的总页数 */
function getCachedTotalPages(): number {
  const state = useForumStore.getState();
  const key = cacheKey(state.plate, state.sort);
  return state.totalPagesCache[key] ?? 1;
}

const useForumStore = create<ForumState>()(() => ({
  plate: Plate.CupForum,
  sort: SortOrder.ByTime,
  page: 0,
  postsCache: {},
  totalPagesCache: {},
  loading: false,
  exhausted: false,
}));

export {
  useForumStore,
  setPlate,
  setSort,
  fetchNextPage,
  reset,
  getCachedPosts,
  getCachedTotalPages,
  cacheKey,
};
export type { ForumState };
