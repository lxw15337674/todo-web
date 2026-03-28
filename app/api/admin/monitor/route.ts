import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_MONITOR_BASE_URL = 'http://127.0.0.1:8787';
const STATS_VIEWS = new Set(['overview', 'daily', 'failures']);
const STATS_QUERY_KEYS = [
    'view',
    'platform',
    'sourceDomain',
    'startDate',
    'endDate',
    'topN',
    'page',
    'pageSize',
    'errorCode',
    'includeUrl',
] as const;
const MONITOR_API_ENV = 'MONITOR_API';
const MONITOR_API_KEY_ENV = 'MONITOR_API_KEY';

const isAdminRequest = (request: NextRequest) => {
    const hasAuthConfig = Boolean(process.env.EDIT_CODE || process.env.GALLERY_EDIT_CODE);
    if (!hasAuthConfig) {
        return true;
    }

    const role = request.cookies.get('auth_role')?.value;
    if (role === 'admin') {
        return true;
    }

    return !role && Boolean(process.env.EDIT_CODE) && request.cookies.has('auth_token');
};

const getBaseUrl = () => {
    const value = process.env[MONITOR_API_ENV] || DEFAULT_MONITOR_BASE_URL;

    return value.endsWith('/') ? value : `${value}/`;
};

const buildUpstreamUrl = (request: NextRequest, target: 'health' | 'stats') => {
    const upstreamPath = target === 'health' ? '/api/health' : '/api/admin/stats';
    const url = new URL(upstreamPath, getBaseUrl());

    if (target === 'stats') {
        STATS_QUERY_KEYS.forEach((key) => {
            const value = request.nextUrl.searchParams.get(key);
            if (!value || value.trim() === '') {
                return;
            }
            url.searchParams.set(key, value);
        });

        if (!url.searchParams.has('view')) {
            url.searchParams.set('view', 'overview');
        }
    }

    return url;
};

export async function GET(request: NextRequest) {
    const targetValue = request.nextUrl.searchParams.get('target');
    const target = targetValue === 'stats' ? 'stats' : targetValue === 'health' ? 'health' : null;

    if (!target) {
        return NextResponse.json(
            {
                success: false,
                code: 'BAD_REQUEST',
                status: 400,
                requestId: 'monitor_proxy_invalid_target',
                details: {
                    message: 'target 必须是 health 或 stats',
                },
            },
            { status: 400 },
        );
    }

    if (!isAdminRequest(request)) {
        return NextResponse.json(
            {
                success: false,
                code: 'UNAUTHORIZED',
                status: 401,
                requestId: 'monitor_proxy_forbidden',
                details: {
                    message: '需要管理员登录态',
                },
            },
            { status: 401 },
        );
    }

    if (target === 'stats') {
        const view = request.nextUrl.searchParams.get('view') || 'overview';
        if (!STATS_VIEWS.has(view)) {
            return NextResponse.json(
                {
                    success: false,
                    code: 'BAD_REQUEST',
                    status: 400,
                    requestId: 'monitor_proxy_invalid_view',
                    details: {
                        view,
                    },
                },
                { status: 400 },
            );
        }

        const apiKey = process.env[MONITOR_API_KEY_ENV]?.trim();
        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    code: 'SERVER_MISCONFIGURED',
                    status: 503,
                    requestId: 'monitor_proxy_missing_api_key',
                    details: {
                        message: `缺少 ${MONITOR_API_KEY_ENV} 环境变量`,
                    },
                },
                { status: 503 },
            );
        }
    }

    try {
        const upstreamUrl = buildUpstreamUrl(request, target);
        const headers = new Headers({
            Accept: 'application/json',
        });

        if (target === 'stats') {
            headers.set('x-api-key', process.env[MONITOR_API_KEY_ENV]!.trim());
        }

        const upstream = await fetch(upstreamUrl.toString(), {
            method: 'GET',
            headers,
            cache: 'no-store',
        });

        const body = await upstream.text();
        const responseHeaders = new Headers({
            'Cache-Control': 'no-store',
        });

        const contentType = upstream.headers.get('content-type');
        if (contentType) {
            responseHeaders.set('Content-Type', contentType);
        } else {
            responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
        }

        const requestId = upstream.headers.get('x-request-id');
        if (requestId) {
            responseHeaders.set('x-request-id', requestId);
        }

        return new NextResponse(body, {
            status: upstream.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('monitor proxy request failed', error);
        return NextResponse.json(
            {
                success: false,
                code: 'SERVICE_UNAVAILABLE',
                status: 503,
                requestId: 'monitor_proxy_upstream_error',
                details: {
                    message: '监控服务暂时不可用',
                },
            },
            { status: 503 },
        );
    }
}
