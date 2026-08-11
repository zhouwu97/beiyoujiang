/**
 * beiyoujiang.com 论坛前端 - 类型安全的 API 客户端
 * 内部 fetch 本项目的 /api/proxy/... 路由，由服务端代理转发到官方 API
 * 所有接口参数/返回结构均经过实测验证（见各函数注释）
 */
import type {
  ApiResponse,
  EmailDataResponse,
  Post,
  User,
  Tourist,
  Comment,
  PostDetailData,
  UserData,
  Keyword,
  SearchResult,
  GetAllPostParams,
  GetAllPostResponse,
  MessageItem,
  Toy,
  ToyDetail,
  ToyReview,
  RawToyReview,
  AuthorFull,
} from './types';
import { normalizeImageList } from './utils';
import { getToken, getUserId } from '@/stores/auth';

const PROXY_BASE = '/api/proxy';

/** 详情接口的历史返回结构：图片字段在 post 内且可能是 JSON 字符串。 */
type RawPostDetailPost = Omit<Post, 'imageUrls'> & {
  imageUrls?: unknown;
  imageUrlsArray?: unknown;
  PostLike?: unknown;
  PostCollection?: unknown;
  isLiked?: boolean | number;
  isCollection?: boolean | number;
};

type RawPostDetailData = {
  post?: RawPostDetailPost;
  isFollow?: boolean | number;
};

/** 在 API 边界统一帖子图片字段，避免页面把 JSON 字符串当数组使用。 */
function normalizePostImages<T extends { imageUrls?: unknown }>(
  post: T
): Omit<T, 'imageUrls'> & { imageUrls: string[] } {
  return {
    ...post,
    imageUrls: normalizeImageList(post.imageUrls),
  };
}

/**
 * 通用请求函数
 * @param path - 代理路径（不含 /api/proxy 前缀），如 "auth/addTourist"
 * @param method - HTTP 方法
 * @param body - JSON 对象或 FormData（FormData 时自动处理 Content-Type）
 */
async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  body?: unknown
): Promise<T> {
  const url = `${PROXY_BASE}/${path}`;
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // 浏览器自动设置 multipart Content-Type + boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: payload,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const err = await response.json();
      detail = err.message ?? '';
    } catch {
      /* ignore */
    }
    throw new Error(`API Error: ${response.status} ${detail}`.trim());
  }

  return response.json();
}

/* ==================== 帖子 ==================== */

/**
 * 获取帖子列表
 * 实测：data 是纯数组 Post[]，无分页元数据；空数组表示没有更多
 */
async function getAllPost(params: GetAllPostParams): Promise<GetAllPostResponse> {
  const res = await request<ApiResponse<Post[]>>('post/getAllPost', 'POST', params);
  return { list: (res.data ?? []).map((post) => normalizePostImages(post)) };
}

/**
 * 获取帖子详情
 * POST /api/post/getPost { postId, userId }
 */
async function getPost(postId: number): Promise<PostDetailData> {
  const res = await request<ApiResponse<RawPostDetailData>>('post/getPost', 'POST', {
    postId,
    userId: getUserId(),
  });
  const rawPost = res.data?.post;
  if (!rawPost) throw new Error('帖子详情数据格式错误');

  const imageUrlsArray = normalizeImageList(rawPost.imageUrlsArray ?? rawPost.imageUrls);
  const post = {
    ...rawPost,
    imageUrls: normalizeImageList(rawPost.imageUrls),
    imageUrlsArray,
    PostLike: Array.isArray(rawPost.PostLike) ? rawPost.PostLike : [],
    PostCollection: Array.isArray(rawPost.PostCollection) ? rawPost.PostCollection : [],
    isLiked: Boolean(rawPost.isLiked),
    isCollection: Boolean(rawPost.isCollection),
  } as PostDetailData['post'];

  return {
    post,
    PostLike: post.PostLike,
    PostCollection: post.PostCollection,
    imageUrlsArray,
    isLiked: post.isLiked,
    isCollection: post.isCollection,
    isFollow: Boolean(res.data?.isFollow),
  };
}

/**
 * 阅读量+1
 * POST /api/post/readingQuantity { postId }
 */
async function readingQuantity(postId: number): Promise<void> {
  await request('post/readingQuantity', 'POST', { postId });
}

/**
 * 点赞帖子
 * POST /api/post/likePost { postId }，需登录态（游客 token 可用）
 */
async function likePost(postId: number): Promise<void> {
  await request('post/likePost', 'POST', { postId });
}

/**
 * 取消点赞
 * DELETE /api/post/DeleteLikePost { postId }
 */
async function unlikePost(postId: number): Promise<void> {
  await request('post/DeleteLikePost', 'DELETE', { postId });
}

/**
 * 收藏帖子
 * POST /api/post/collectPost { postId }
 */
async function collectPost(postId: number): Promise<void> {
  await request('post/collectPost', 'POST', { postId });
}

/**
 * 取消收藏
 * DELETE /api/post/DeleteCollectPost { postId }
 */
async function uncollectPost(postId: number): Promise<void> {
  await request('post/DeleteCollectPost', 'DELETE', { postId });
}

/**
 * 删除帖子（仅自己）
 * DELETE /api/post/deletePost { postId }
 */
async function deletePost(postId: number): Promise<void> {
  await request('post/deletePost', 'DELETE', { postId });
}

/**
 * 发布帖子（multipart）
 * POST /api/post/addPost
 * FormData 字段：title, content, plate, authorId, images[], captchaX?, captchaToken?
 * 返回含 reward 字段（U酱币奖励）
 */
async function addPost(formData: FormData): Promise<{ reward?: number; needCaptcha?: boolean }> {
  const res = await request<{ message: string; reward?: number } & Record<string, unknown>>(
    'post/addPost',
    'POST',
    formData
  );
  return res;
}

/* ==================== 评论 ==================== */

/**
 * 获取帖子评论
 * POST /api/comment/getPostComment { postId, userId, reply, order, orderType }
 */
async function getPostComments(
  postId: number,
  reply: number | null = null,
  order = 1
): Promise<Comment[]> {
  const res = await request<ApiResponse<Comment[]>>('comment/getPostComment', 'POST', {
    postId,
    userId: getUserId(),
    reply,
    order,
    orderType: 'time',
  });
  return res.data ?? [];
}

/**
 * 获取楼中楼回复
 * POST /api/comment/getMoreComment { parentId, postId, userId }
 */
async function getMoreComments(parentId: number, postId: number): Promise<Comment[]> {
  const res = await request<ApiResponse<Comment[]>>('comment/getMoreComment', 'POST', {
    parentId: Number(parentId),
    postId: Number(postId),
    userId: Number(getUserId() ?? 0),
  });
  return res.data ?? [];
}

/**
 * 发表评论（multipart）
 * FormData 字段：content, postId, parentId, rootId, images[]
 */
async function addComment(formData: FormData): Promise<void> {
  await request('comment/addComment', 'POST', formData);
}

/**
 * 删除评论（仅自己的）
 * POST /api/comment/deleteComment { commentId }
 */
async function deleteComment(commentId: number): Promise<void> {
  await request('comment/deleteComment', 'POST', { commentId });
}

/**
 * 点赞评论
 * POST /api/comment/likeComment { commentId }
 */
async function likeComment(commentId: number): Promise<void> {
  await request('comment/likeComment', 'POST', { commentId: Number(commentId) });
}

/**
 * 取消点赞评论
 * DELETE /api/comment/DeleteLikeComment { commentId }
 */
async function unlikeComment(commentId: number): Promise<void> {
  await request('comment/DeleteLikeComment', 'DELETE', { commentId: Number(commentId) });
}

/* ==================== 搜索 ==================== */

/**
 * 获取热搜词
 * POST /api/toy/getAllKeyword {}
 */
async function getAllKeywords(): Promise<Keyword[]> {
  const res = await request<ApiResponse<Keyword[]>>('toy/getAllKeyword', 'POST', {});
  return res.data ?? [];
}

/**
 * 搜索玩具/帖子
 * POST /api/toy/searchToyPost { content, page, pageSize }
 */
async function searchToyPost(
  content: string,
  page: number,
  pageSize = 20
): Promise<SearchResult> {
  const res = await request<
    ApiResponse<SearchResult> & { pagination?: { hasMore: boolean } }
  >('toy/searchToyPost', 'POST', { content, page, pageSize });
  return {
    toys: res.data?.toys ?? [],
    posts: (res.data?.posts ?? []).map((post) => normalizePostImages(post)),
    pagination: res.pagination ?? { hasMore: false },
  };
}

/**
 * 玩具榜单
 * POST /api/toy/getAllToy { type, classify, sort, page, pageSize }
 * type: ""|ENTRY|ADVANCED|HIGH|EXTREME（刺激等级）；classify: ""|CUP|LARGE_MOLD|HALF_BODY
 */
async function getAllToy(
  type: string,
  classify: string,
  sort: number,
  page: number,
  pageSize: number
): Promise<{ weeklyTop: Toy | null; list: Toy[]; pagination: { hasMore: boolean } }> {
  const res = await request<
    {
      code: number;
      message: string;
      data: { weeklyTop: Toy | null; list: Toy[] };
      pagination: { hasMore: boolean };
    }
  >('toy/getAllToy', 'POST', { type, classify, sort, page, pageSize });
  return {
    weeklyTop: res.data?.weeklyTop ?? null,
    list: res.data?.list ?? [],
    pagination: res.pagination ?? { hasMore: false },
  };
}

/**
 * 获取玩具详情
 * POST /api/toy/getToy { toyId }
 */
async function getToy(toyId: number): Promise<ToyDetail> {
  const res = await request<ApiResponse<ToyDetail>>('toy/getToy', 'POST', { toyId });
  return res.data;
}

/**
 * 获取玩具全部评价
 * POST /api/toyComment/getToyAllReview { toyId, userId }
 * 注意：路径是 toyComment 而非 toy（实测 toy/getToyAllReview 会 404）；
 * 返回项的作者字段是 user 而非 author，图片字段可能为 JSON 字符串。
 */
async function getToyAllReview(toyId: number): Promise<ToyReview[]> {
  const res = await request<ApiResponse<RawToyReview[]>>('toyComment/getToyAllReview', 'POST', {
    toyId,
    userId: Number(getUserId() ?? 0),
  });
  return (res.data ?? []).map((review) => ({
    id: review.id,
    content: review.content,
    score: review.score,
    likeCount: review.likeCount,
    isLiked: Boolean(review.isLiked),
    createdAt: review.createdAt,
    timeString: review.timeString,
    author: review.user ?? ({} as AuthorFull),
    images: normalizeImageList(review.images ?? review.imageUrls),
    commentCount: review.commentCount ?? 0,
    replyCount: review.replyCount ?? 0,
  }));
}

/**
 * 想冲/取消想冲玩具
 * POST /api/toy/likeToy { toyId }
 */
async function wantToy(toyId: number): Promise<void> {
  await request('toy/likeToy', 'POST', { toyId });
}

/**
 * 买过/取消买过玩具
 * POST /api/toy/buyToy { toyId }
 */
async function buyToy(toyId: number): Promise<void> {
  await request('toy/buyToy', 'POST', { toyId });
}

/**
 * 给玩具评价点赞
 * POST /api/toy/likeToyReview { reviewId }
 */
async function likeToyReview(reviewId: number): Promise<void> {
  await request('toy/likeToyReview', 'POST', { reviewId });
}

/* ==================== 认证 ==================== */

/**
 * 注册游客
 * POST /api/auth/addTourist {}
 * 实测返回：{ message: "游客登录成功", emailData: Tourist }（键名是 emailData）
 */
async function addTourist(): Promise<Tourist> {
  const res = await request<EmailDataResponse<Tourist>>('auth/addTourist', 'POST', {});
  return res.emailData;
}

/**
 * 登录
 * POST /api/auth/login { email, password }
 * 实测返回：{ message, emailData }（邮箱不存在时报 "邮箱不存在"）
 */
async function login(email: string, password: string): Promise<User> {
  const res = await request<EmailDataResponse<User>>('auth/login', 'POST', { email, password });
  return res.emailData;
}

/**
 * 注册正式账号
 * POST /api/auth/register { email, password, username }
 * 实测返回：{ message: "注册成功", emailData }
 */
async function register(email: string, password: string, username: string): Promise<User> {
  const res = await request<EmailDataResponse<User>>('auth/register', 'POST', {
    email,
    password,
    username,
  });
  return res.emailData;
}

/**
 * 发送验证码（找回密码用）
 * POST /api/auth/sendCode { email }
 */
async function sendCode(email: string): Promise<void> {
  await request('auth/sendCode', 'POST', { email });
}

/**
 * 重置密码
 * POST /api/auth/resetPassword { email, code, password }
 */
async function resetPassword(email: string, code: string, password: string): Promise<void> {
  await request('auth/resetPassword', 'POST', { email, code, password });
}

/**
 * 获取用户数据（个人中心）
 * POST /api/auth/getUserData { userId, type }，需 Bearer token
 * type: 0=我的帖子
 */
async function getUserData(userId: number, type = 0): Promise<UserData> {
  const res = await request<{ message: string; UserData: UserData }>('auth/getUserData', 'POST', {
    userId: Number(userId),
    type: Number(type),
  });
  return {
    ...res.UserData,
    post: (res.UserData?.post ?? []).map((post) => normalizePostImages(post)),
  };
}

/* ==================== 消息 ==================== */

/**
 * 获取消息列表
 * POST /api/message/getAllMessages { type }
 */
async function getAllMessages(type = 0): Promise<MessageItem[]> {
  const res = await request<ApiResponse<MessageItem[]>>('message/getAllMessages', 'POST', {
    type: Number(type),
  });
  return res.data ?? [];
}

/**
 * 全部标记已读
 * POST /api/message/markAllAsRead { type }
 */
async function markAllAsRead(type = 0): Promise<void> {
  await request('message/markAllAsRead', 'POST', { type: Number(type) });
}

export {
  request,
  getAllPost,
  getPost,
  readingQuantity,
  likePost,
  unlikePost,
  collectPost,
  uncollectPost,
  deletePost,
  addPost,
  getPostComments,
  getMoreComments,
  addComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getAllKeywords,
  searchToyPost,
  getAllToy,
  getToy,
  getToyAllReview,
  wantToy,
  buyToy,
  likeToyReview,
  addTourist,
  login,
  register,
  sendCode,
  resetPassword,
  getUserData,
  getAllMessages,
  markAllAsRead,
};
