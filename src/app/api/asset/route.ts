import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set(['beiyoujiang.com', 'www.beiyoujiang.com']);

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

  try {
    const response = await fetch(targetUrl, { cache: 'force-cache' });
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !response.body || !contentType.startsWith('image/')) {
      return NextResponse.json({ message: '图片加载失败' }, { status: 404 });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return NextResponse.json({ message: '图片服务暂时不可用' }, { status: 502 });
  }
}
