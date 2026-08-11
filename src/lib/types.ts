/**
 * beiyoujiang.com 论坛前端 - 类型定义层
 * 所有类型和枚举常量（与官方 API 实测结构一致）
 */

/**
 * 板块枚举
 * plate 字段取值
 */
export enum Plate {
  /** 大型倒模 */
  LargeMold = 1,
  /** 杯酱论坛 */
  CupForum = 2,
  /** 杂鱼茶话 */
  CasualChat = 3,
}

/**
 * 板块信息
 */
export interface PlateInfo {
  id: Plate;
  name: string;
}

/**
 * 排序枚举
 * most 字段取值
 */
export enum SortOrder {
  /** 按发布时间 */
  ByTime = 1,
  /** 按回复数 */
  ByReply = 2,
}

/**
 * 所有板块列表（name 与官方站保持一致）
 */
export const PLATES: PlateInfo[] = [
  { id: Plate.LargeMold, name: '大型倒模' },
  { id: Plate.CupForum, name: '杯酱论坛' },
  { id: Plate.CasualChat, name: '杂鱼茶话' },
];

/**
 * 作者/用户基础信息
 * 出现在 Post.author 字段（列表接口精简版）
 */
export interface Author {
  id: number;
  username: string;
  /** 相对路径如 "byj.webp"，需用 resolveAvatar() 拼接完整 URL */
  photo: string;
  level: number;
  introduction: string;
  /** 是否为游客 */
  isGuest: boolean;
}

/**
 * 完整作者信息（详情/评论接口返回，字段更全）
 * 注意：password/token 为服务端透出字段，前端绝不展示
 */
export interface AuthorFull extends Author {
  email: string | null;
  isAdmin: boolean;
  USauceBean: number;
  likeNumber: number;
  followersNumber: number;
  fans: number;
  invitationNumber: number;
  collectNumber: number;
  experience: number;
  isBanned: boolean;
  banReason: string | null;
}

/**
 * 帖子类型（列表接口）
 * POST /api/post/getAllPost 返回的 data 数组项
 */
export interface Post {
  id: number;
  title: string;
  /** HTML 内容，含 <img> 表情 */
  content: string;
  plate: Plate;
  published: boolean;
  isHidden: boolean;
  readingQuantity: number;
  commentCount: number;
  /** 图片 URL 数组（相对路径，需用 resolvePostImage() 拼接完整 URL） */
  imageUrls: string[];
  authorId: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
  /** 中文相对时间字符串，如 "3分钟前"（服务端提供） */
  timeAgo: string;
  author: Author;
  /** 点赞数 */
  likeCount: number;
}

/**
 * 帖子详情响应
 * POST /api/post/getPost 返回 { message, data: {...}, isFollow }
 */
export interface PostDetailPost extends Post {
  author: AuthorFull;
  PostLike: unknown[];
  PostCollection: unknown[];
  /** 图片完整数组（相对路径） */
  imageUrlsArray: string[];
  isLiked: boolean;
  isCollection: boolean;
}

export interface PostDetailData {
  /** API 原始字段在 post 内，客户端适配后同时保留页面需要的顶层字段。 */
  post: PostDetailPost;
  PostLike: unknown[];
  PostCollection: unknown[];
  imageUrlsArray: string[];
  isLiked: boolean;
  isCollection: boolean;
  isFollow: boolean;
}

/**
 * 评论类型
 * POST /api/comment/getPostComment 返回的 data 数组项
 */
export interface Comment {
  id: number;
  content: string;
  imageUrls: string[] | null;
  likeNumber: number;
  /** 楼层号（1楼、2楼...） */
  floor: number;
  authorId: number;
  postId: number;
  parentId: number | null;
  rootId: number | null;
  createdAt: string;
  author: AuthorFull;
  CommentDotLike: unknown[];
  isPostAuthor: boolean;
  imageUrlsArray: string[];
  /** 嵌套回复 */
  replies: Comment[];
  isLiked: boolean;
  isDotLiked: boolean;
  likeCount: number;
  /** 服务端提供的中文相对时间，如 "1 小时前" */
  timeString: string;
}

/**
 * 玩具/名器信息（搜索页）
 * POST /api/toy/searchToyPost 返回 data.toys 数组项
 */
export interface Toy {
  id: number;
  name: string;
  merchant: string;
  coverUrl: string[];
  weeklyTopImg: string | null;
  shopLink: string | null;
  description: string;
  tags: string;
  releaseYear: number;
  stimulation: string;
  category: string;
  rating: number;
  hotScore: number;
  reviewCount: number;
  wantCount: number;
  viewCount: number;
}

/**
 * 玩具详情（详情页）
 * 实测 getToy 返回：coverUrl 是 JSON 字符串，coverUrlsArray 才是真正数组；
 * 评分分布字段名是 starCounts（不是 scoreDistribution）。
 */
export interface ToyDetail extends Toy {
  images: string[];
  detail: string;
  score: number;
  scoreCount: number;
  scoreDistribution: Record<string, number>;
  /** 实测 getToy 返回的真正图片数组 */
  coverUrlsArray?: string[];
  /** 实测 getToy 返回的评分分布 { "1":0, "2":1, ... } */
  starCounts?: Record<string, number>;
  isWant: boolean;
  isBuy: boolean;
}

/**
 * 玩具评价
 */
export interface ToyReview {
  id: number;
  content: string;
  score: number;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  timeString: string;
  author: AuthorFull;
  images: string[];
  /** 回复数（实测 getToyAllReview 返回 replyCount/commentCount） */
  replyCount?: number;
  commentCount?: number;
}

/**
 * getToyAllReview 原始返回项（API 边界适配前）
 * 注意：作者字段是 user 而非 author；images/imageUrls 可能是 JSON 字符串。
 */
export interface RawToyReview {
  id: number;
  content: string;
  score: number;
  likeCount: number;
  isLiked?: boolean | number;
  createdAt: string;
  timeString: string;
  user?: AuthorFull;
  images?: unknown;
  imageUrls?: unknown;
  commentCount?: number;
  replyCount?: number;
  [key: string]: unknown;
}

/**
 * 玩具详情响应
 */
export interface ToyDetailData {
  toy: ToyDetail;
  reviews: ToyReview[];
}

/**
 * 热词（搜索页）
 * POST /api/toy/getAllKeyword 返回 data 数组项
 */
export interface Keyword {
  id: number;
  keyword: string;
  count: number;
  updatedAt: string;
}

/**
 * 搜索响应
 * POST /api/toy/searchToyPost 返回 { data: { toys, posts }, pagination }
 */
export interface SearchResult {
  toys: Toy[];
  posts: Post[];
  pagination: { hasMore: boolean };
}

/**
 * 用户数据（个人中心）
 * POST /api/auth/getUserData 返回 { message, UserData }
 */
export interface UserData {
  photo: string;
  username: string;
  token: string;
  isAdmin: boolean;
  id: number;
  USauceBean: number;
  level: number;
  createdAt: string;
  introduction: string;
  likeNumber: number;
  followersNumber: number;
  fans: number;
  invitationNumber: number;
  collectNumber: number;
  /** type=0 时返回我的帖子 */
  post: Post[];
  postLength: number;
  CollectedPostLength: number;
  CollectedToyLength: number;
  experience: number;
}

/**
 * 消息通知（消息页）
 * POST /api/message/getAllMessages 返回 data 数组项
 */
export interface MessageItem {
  id: number;
  type: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  postId?: number;
  commentId?: number;
  [key: string]: unknown;
}

/**
 * 正式用户类型
 * POST /api/auth/addTourist 返回的 emailData 即为此结构（isGuest=true）
 */
export interface User {
  id: number;
  /** 官方正式用户 localStorage 使用的兼容字段 */
  userId?: number;
  /** 官方游客 localStorage 使用的兼容字段 */
  touristId?: number;
  username: string;
  photo: string;
  /** 用户等级 */
  level: number;
  /** 简介（实测 addTourist 返回中无此字段，可能仅正式用户有） */
  introduction?: string;
  isGuest: boolean;
  /** JWT token，调用需要认证的 API 时需携带 */
  token: string;
  /** 经验值 */
  experience?: number;
  /** 邮箱（若有） */
  email?: string;
}

/**
 * 游客类型
 * POST /api/auth/addTourist 实测返回结构：
 * { "游客登录成功", "emailData": { id, username, photo, token, isGuest, level, experience } }
 */
export interface Tourist extends User {
  isGuest: true;
}

/**
 * API 统一响应包装
 * 所有 POST API 返回格式均为 { message: string, data: T }
 */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * addTourist/login/register 特殊响应包装
 * 实测返回：{ message, emailData: T }（键名是 emailData 而非 data）
 */
export interface EmailDataResponse<T> {
  message: string;
  emailData: T;
}

/**
 * getAllPost 请求参数
 */
export interface GetAllPostParams {
  plate: Plate;
  most: SortOrder;
  userId: number | null;
  page: number;
  pageSize: number;
}

/**
 * getAllPost 响应数据
 * 实测返回 { message, data: Post[] } —— data 是纯数组，无分页元数据！
 * 判断是否加载完：data 数组为空即表示没有更多帖子
 */
export interface GetAllPostResponse {
  /** 帖子列表 */
  list: Post[];
}
