import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set(['beiyoujiang.com', 'www.beiyoujiang.com']);
const ASSET_TIMEOUT_MS = 10_000;

/**
 * 官方静态图片代理：只允许官方域名，统一从当前站点返回图片。
 * 这样通过内网穿透访问时，浏览器无需直接请求官方静态域名。
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ message: '缺少图片地址' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ message: '图片地址无效' }, { status: 400 });
  }

  if (targetUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return NextResponse.json({ message: '不支持的图片来源' }, { status: 403 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASSET_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, { cache: 'force-cache', signal: controller.signal });
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !response.body || !contentType.startsWith('image/')) {
      const status = response.status === 404 ? 404 : response.status >= 500 ? 502 : 404;
      return NextResponse.json({ message: '图片加载失败', code: 'ASSET_UPSTREAM_ERROR' }, { status });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    if (controller.signal.aborted) {
      return NextResponse.json({ message: '图片服务响应超时', code: 'ASSET_TIMEOUT' }, { status: 504 });
    }
    console.error('[api/asset] upstream network error', error);
    return NextResponse.json({ message: '图片服务暂时不可用', code: 'ASSET_NETWORK_ERROR' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
