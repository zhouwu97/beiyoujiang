/**
 * 通用代理路由
 * 转发 /api/proxy/<...path> 到 https://beiyoujiang.com/api/<...path>
 * 支持 GET/POST/PUT/DELETE，JSON 与 multipart FormData 均透传
 */
import { NextRequest, NextResponse } from 'next/server';

const TARGET_BASE = 'https://beiyoujiang.com/api';

type RouteParams = { params: Promise<{ path: string[] }> };

/** 只透传必要请求头，避免 host/connection 等 hop-by-hop 头干扰目标服务器 */
const FORWARD_HEADERS = ['content-type', 'authorization', 'accept', 'user-agent'];
const UPSTREAM_TIMEOUT_MS = 12_000;

async function forward(
  request: NextRequest,
  routeParams: RouteParams,
  method: string
): Promise<NextResponse> {
  const { path } = await routeParams.params;
  const targetPath = path.join('/');
  const targetUrl = `${TARGET_BASE}/${targetPath}`;

  const headers: Record<string, string> = {};
  for (const key of FORWARD_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers[key] = value;
  }

  // 二进制安全：arrayBuffer 支持 JSON 和 multipart 两种 body
  const body = await request.arrayBuffer();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method,
        headers,
        body: body.byteLength > 0 ? Buffer.from(body) : undefined,
        signal: controller.signal,
        // 官方服务器是 Express，需要保持连接
        cache: 'no-store',
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return NextResponse.json(
          { message: '上游服务响应超时', code: 'UPSTREAM_TIMEOUT' },
          { status: 504 }
        );
      }
      console.error('[api/proxy] upstream network error', error);
      return NextResponse.json(
        { message: '上游服务连接失败', code: 'UPSTREAM_NETWORK_ERROR' },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('Content-Type') || 'application/json';
    return new NextResponse(response.body, {
      // 保留官方 401/403/404 及其它真实状态码，页面才能正确区分。
      status: response.status,
      headers: { 'Content-Type': contentType },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest, params: RouteParams): Promise<NextResponse> {
  return forward(request, params, 'GET');
}

export async function POST(request: NextRequest, params: RouteParams): Promise<NextResponse> {
  return forward(request, params, 'POST');
}

export async function PUT(request: NextRequest, params: RouteParams): Promise<NextResponse> {
  return forward(request, params, 'PUT');
}

export async function DELETE(request: NextRequest, params: RouteParams): Promise<NextResponse> {
  return forward(request, params, 'DELETE');
}
