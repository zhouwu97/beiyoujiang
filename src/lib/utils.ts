/**
 * beiyoujiang.com 论坛前端 - 工具函数
 */

/**
 * 将中文 ISO 日期转为中文相对时间字符串
 * @param dateISO - ISO 8601 格式日期字符串，如 "2024-01-15T10:30:00.000Z"
 * @returns 中文相对时间：刚刚 / x分钟前 / x小时前 / x天前 / YYYY-MM-DD
 */
export function timeAgo(dateISO: string): string {
  const date = new Date(dateISO);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return '刚刚';
  }
  if (diffMin < 60) {
    return `${diffMin}分钟前`;
  }
  if (diffHour < 24) {
    return `${diffHour}小时前`;
  }
  if (diffDay < 30) {
    return `${diffDay}天前`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 基础域名，用于拼接相对路径
 */
const BASE_URL = 'https://beiyoujiang.com';
const ASSET_PROXY_PATH = '/api/asset?url=';
const OFFICIAL_ASSET_HOSTS = new Set(['beiyoujiang.com', 'www.beiyoujiang.com']);

/**
 * 通过当前站点代理官方静态资源，避免公网访问时被跨站策略或网络线路拦截。
 * 非官方资源保持原地址，避免把未知域名变成 SSRF 入口。
 */
export function assetUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith(ASSET_PROXY_PATH)) {
    return pathOrUrl;
  }

  try {
    const absoluteUrl = new URL(pathOrUrl, BASE_URL);
    if (absoluteUrl.protocol === 'https:' && OFFICIAL_ASSET_HOSTS.has(absoluteUrl.hostname)) {
      return `${ASSET_PROXY_PATH}${encodeURIComponent(absoluteUrl.toString())}`;
    }
  } catch {
    return pathOrUrl;
  }

  return pathOrUrl;
}

/** 将官方资源路径解析为完整 URL。 */
function resolveAsset(
  pathOrUrl: string | null | undefined,
  directory: string,
  fallback: string
): string {
  if (!pathOrUrl) return assetUrl(fallback);
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return assetUrl(pathOrUrl);
  }

  const normalizedPath = pathOrUrl.replace(/^\/+/, '');
  const assetPath = normalizedPath.startsWith(`${directory}/`)
    ? `/${normalizedPath}`
    : `/${directory}/${normalizedPath}`;
  return assetUrl(`${BASE_URL}${assetPath}`);
}

/**
 * 兼容旧调用的通用图片解析函数。
 * 新代码应根据资源类型使用 resolveAvatar/resolvePostImage/resolveToyImage。
 */
export function resolveImage(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return assetUrl(`${BASE_URL}/headPortrait/byj.webp`);
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return assetUrl(pathOrUrl);
  }
  if (pathOrUrl.startsWith('/')) return assetUrl(`${BASE_URL}${pathOrUrl}`);
  return assetUrl(`${BASE_URL}/${pathOrUrl}`);
}

/** 用户头像接口返回裸文件名，官方静态目录为 /headPortrait。 */
export function resolveAvatar(pathOrUrl: string | null | undefined): string {
  return resolveAsset(pathOrUrl, 'headPortrait', `${BASE_URL}/headPortrait/byj.webp`);
}

/** 帖子图片接口返回裸文件名，官方静态目录为 /PostImg。 */
export function resolvePostImage(pathOrUrl: string | null | undefined): string {
  return resolveAsset(pathOrUrl, 'PostImg', `${BASE_URL}/images/homepage.webp`);
}

/** 玩具封面接口返回裸文件名，官方静态目录为 /ToyImg。 */
export function resolveToyImage(pathOrUrl: string | null | undefined): string {
  return resolveAsset(pathOrUrl, 'ToyImg', `${BASE_URL}/images/homepage.webp`);
}

/**
 * 将接口中可能是数组、JSON 数组字符串或单个文件名的图片字段统一成数组。
 */
export function normalizeImageList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeImageList(item));
  }
  if (typeof value !== 'string') return [];

  const normalized = value.trim();
  if (!normalized) return [];

  try {
    const parsed = JSON.parse(normalized) as unknown;
    if (parsed !== normalized) return normalizeImageList(parsed);
  } catch {
    // 裸文件名或普通 URL 不是 JSON，按单张图片处理。
  }

  return [normalized];
}

/**
 * 数字格式化（万单位缩写）
 * @param n - 原始数字
 * @returns 格式化后的字符串，如 12345 -> "1.2万"，999 -> "999"
 */
export function formatCount(n: number): string {
  if (n >= 10000) {
    const w = n / 10000;
    // 保留一位小数，但去掉无意义的 .0
    const formatted = w.toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(w)}万` : `${formatted}万`;
  }
  return String(n);
}

/**
 * 消毒帖子 HTML（服务端渲染内容）
 * 移除 script/style/iframe、on* 事件属性、javascript: 链接
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="#"')
    .replace(/src\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'src=""')
    .replace(/src\s*=\s*(['"])(.*?)\1/gi, (_match, quote: string, source: string) => {
      const absoluteSource = source.startsWith('/') ? `${BASE_URL}${source}` : source;
      return `src=${quote}${assetUrl(absoluteSource)}${quote}`;
    });
}
