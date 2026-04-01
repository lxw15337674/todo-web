import { NextRequest, NextResponse } from 'next/server';

import { aggregateAdminRequests } from '@/api/admin/aggregation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_MONITOR_BASE_URL = 'http://127.0.0.1:8787';
const MONITOR_API_ENV = 'MONITOR_API';
const MONITOR_API_KEY_ENV = 'MONITOR_API_KEY';
const REQUEST_PAGE_SIZE = 100;
const DEFAULT_TOP_N = 10;
const REQUEST_QUERY_KEYS = [
    'platform',
    'url',
    'requestSource',
    'success',
    'errorCode',
    'startDate',
    'endDate',
    'page',
    'pageSize',
];
const UPSTREAM_REQUEST_QUERY_KEYS = REQUEST_QUERY_KEYS.filter((key) => key !== 'url');

type MonitorTarget = 'health' | 'aggregate' | 'requests';

type UpstreamErrorEnvelope = {
    success?: boolean;
    code?: string;
    status?: number;
    requestId?: string;
    details?: Record<string, unknown>;
    message?: string;
};

type UpstreamRequestItem = {
    id?: unknown;
    createdAt?: unknown;
    timestamp?: unknown;
    platform?: unknown;
    requestSource?: unknown;
    sourceDomain?: unknown;
    success?: unknown;
    errorCode?: unknown;
    errorMessage?: unknown;
    message?: unknown;
    requestId?: unknown;
    url?: unknown;
};

type UpstreamRequestPage = {
    items?: UpstreamRequestItem[];
    pagination?: {
        page?: unknown;
        pageSize?: unknown;
        total?: unknown;
        totalPages?: unknown;
    };
    filters?: Record<string, unknown>;
};

class UpstreamMonitorError extends Error {
    status: number;
    payload: unknown;
    requestId?: string;

    constructor(status: number, payload: unknown, requestId?: string) {
        super('upstream monitor request failed');
        this.name = 'UpstreamMonitorError';
        this.status = status;
        this.payload = payload;
        this.requestId = requestId;
    }
}

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

const toRecord = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as Record<string, unknown>;
};

const toString = (value: unknown, fallback = ''): string => {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        return `${value}`;
    }
    return fallback;
};

const toNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return fallback;
};

const toBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
            return true;
        }
        if (value.toLowerCase() === 'false') {
            return false;
        }
    }
    return undefined;
};

const appendQuery = (
    params: URLSearchParams,
    key: string,
    value: string | number | boolean | undefined,
) => {
    if (value === undefined) {
        return;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return;
    }
    params.set(key, `${value}`);
};

const getBaseUrl = () => {
    const value = process.env[MONITOR_API_ENV] || DEFAULT_MONITOR_BASE_URL;
    return value.endsWith('/') ? value : `${value}/`;
};

const buildUpstreamUrl = (
    target: 'health' | 'stats',
    query?: Record<string, string | number | boolean | undefined>,
) => {
    const upstreamPath = target === 'health' ? '/api/health' : '/api/admin/stats';
    const url = new URL(upstreamPath, getBaseUrl());

    if (query) {
        Object.entries(query).forEach(([key, value]) => appendQuery(url.searchParams, key, value));
    }

    return url;
};

const createJsonResponse = (
    payload: unknown,
    status: number,
    requestId?: string,
) => {
    const headers = new Headers({
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
    });

    if (requestId) {
        headers.set('x-request-id', requestId);
    }

    return NextResponse.json(payload, { status, headers });
};

const proxyHealth = async () => {
    const upstream = await fetch(buildUpstreamUrl('health').toString(), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
        cache: 'no-store',
    });

    const body = await upstream.text();
    const responseHeaders = new Headers({
        'Cache-Control': 'no-store',
        'Content-Type':
            upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    });

    const requestId = upstream.headers.get('x-request-id');
    if (requestId) {
        responseHeaders.set('x-request-id', requestId);
    }

    return new NextResponse(body, {
        status: upstream.status,
        headers: responseHeaders,
    });
};

const requestUpstreamJson = async <TPayload>(
    query: Record<string, string | number | boolean | undefined>,
) => {
    const headers = new Headers({
        Accept: 'application/json',
    });
    headers.set('x-api-key', process.env[MONITOR_API_KEY_ENV]!.trim());

    const response = await fetch(buildUpstreamUrl('stats', query).toString(), {
        method: 'GET',
        headers,
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));
    const requestId = response.headers.get('x-request-id') || undefined;

    if (!response.ok) {
        throw new UpstreamMonitorError(response.status, payload, requestId);
    }

    return {
        payload: payload as TPayload,
        requestId,
    };
};

const normalizeRequestPage = (
    data: unknown,
    fallback: { page: number; pageSize: number },
) => {
    const record = toRecord(data);
    const source = Array.isArray(record.items) ? record.items : [];

    const items = source.map((entry, index) => {
        const row = toRecord(entry);
        const requestId =
            toString(row.requestId) ||
            toString(row.traceId) ||
            toString(row.id) ||
            '-';

        return {
            id: toString(row.id, `${fallback.page}-${index}`),
            timestamp:
                toString(row.createdAt) ||
                toString(row.timestamp) ||
                '-',
            platform: toString(row.platform, 'unknown'),
            requestSource:
                toString(row.requestSource) ||
                toString(row.sourceDomain) ||
                'unknown',
            success: toBoolean(row.success) ?? false,
            errorCode: toString(row.errorCode),
            message:
                toString(row.errorMessage) ||
                toString(row.message) ||
                '',
            requestId,
            url: toString(row.url) || undefined,
            raw: row,
        };
    });

    const paginationRecord = toRecord(record.pagination);
    const page = toNumber(paginationRecord.page, fallback.page);
    const pageSize = toNumber(paginationRecord.pageSize, fallback.pageSize);
    const total = toNumber(
        paginationRecord.total,
        toNumber(paginationRecord.totalCount, items.length),
    );
    const totalPages = Math.max(
        1,
        toNumber(
            paginationRecord.totalPages,
            pageSize > 0 ? Math.ceil(total / pageSize) : 1,
        ),
    );
    const filters = toRecord(record.filters);

    return {
        items,
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
        },
        filters: {
            platform: toString(filters.platform) || undefined,
            url:
                toString(filters.url) ||
                toString(filters.sourceUrl) ||
                undefined,
            requestSource:
                toString(filters.requestSource) ||
                toString(filters.sourceDomain) ||
                undefined,
            success: toBoolean(filters.success),
            errorCode: toString(filters.errorCode) || undefined,
            startDate: toString(filters.startDate) || undefined,
            endDate: toString(filters.endDate) || undefined,
        },
    };
};

const getAggregateTopN = (request: NextRequest) => {
    const raw = request.nextUrl.searchParams.get('topN');
    if (!raw) {
        return DEFAULT_TOP_N;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return DEFAULT_TOP_N;
    }
    return Math.floor(parsed);
};

const getRequestQuery = (request: NextRequest) => {
    const query: Record<string, string | number | boolean | undefined> = {};

    REQUEST_QUERY_KEYS.forEach((key) => {
        const value = request.nextUrl.searchParams.get(key);
        if (!value || value.trim() === '') {
            return;
        }
        if (key === 'success') {
            query[key] = value.toLowerCase() === 'true';
            return;
        }
        if (key === 'page' || key === 'pageSize') {
            query[key] = value;
            return;
        }
        query[key] = value;
    });

    return query;
};

const getUpstreamRequestQuery = (
    query: Record<string, string | number | boolean | undefined>,
) => {
    const upstreamQuery: Record<string, string | number | boolean | undefined> = {};

    UPSTREAM_REQUEST_QUERY_KEYS.forEach((key) => {
        if (query[key] === undefined) {
            return;
        }
        upstreamQuery[key] = query[key];
    });

    return upstreamQuery;
};

const filterItemsByUrl = <TItem extends { url?: string }>(
    items: TItem[],
    url?: string,
) => {
    const normalizedUrl = url?.trim();
    if (!normalizedUrl) {
        return items;
    }

    return items.filter((item) => item.url === normalizedUrl);
};

const paginateItems = <TItem,>(
    items: TItem[],
    page: number,
    pageSize: number,
) => {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 20;
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const currentPage = Math.min(safePage, totalPages);
    const startIndex = (currentPage - 1) * safePageSize;

    return {
        items: items.slice(startIndex, startIndex + safePageSize),
        pagination: {
            page: currentPage,
            pageSize: safePageSize,
            total,
            totalPages,
        },
    };
};

const fetchAllRequestItems = async (query: Record<string, string | number | boolean | undefined>) => {
    const baseQuery = getUpstreamRequestQuery(query);
    delete baseQuery.page;
    delete baseQuery.pageSize;

    const firstPage = await requestUpstreamJson<{ data?: UpstreamRequestPage }>({
        ...baseQuery,
        page: 1,
        pageSize: REQUEST_PAGE_SIZE,
    });

    const firstPageData = normalizeRequestPage(firstPage.payload.data, {
        page: 1,
        pageSize: REQUEST_PAGE_SIZE,
    });
    const allItems = [...firstPageData.items];
    const totalPages = firstPageData.pagination.totalPages;

    for (let pageStart = 2; pageStart <= totalPages; pageStart += 5) {
        const pages = Array.from(
            { length: Math.min(5, totalPages - pageStart + 1) },
            (_, index) => pageStart + index,
        );

        const batch = await Promise.all(
            pages.map(async (page) => {
                const result = await requestUpstreamJson<{ data?: UpstreamRequestPage }>({
                    ...baseQuery,
                    page,
                    pageSize: REQUEST_PAGE_SIZE,
                });

                return normalizeRequestPage(result.payload.data, {
                    page,
                    pageSize: REQUEST_PAGE_SIZE,
                }).items;
            }),
        );

        batch.forEach((items) => allItems.push(...items));
    }

    return {
        items: allItems,
        requestId: firstPage.requestId,
    };
};

const handleAggregateRequest = async (request: NextRequest) => {
    const requestQuery = getRequestQuery(request);
    const { items, requestId } = await fetchAllRequestItems(requestQuery);
    const filteredItems = filterItemsByUrl(items, request.nextUrl.searchParams.get('url') || undefined);
    const data = aggregateAdminRequests(filteredItems, {
        startDate: request.nextUrl.searchParams.get('startDate') || undefined,
        endDate: request.nextUrl.searchParams.get('endDate') || undefined,
        topN: getAggregateTopN(request),
    });

    return createJsonResponse({ success: true, data }, 200, requestId);
};

const handleRequestsRequest = async (request: NextRequest) => {
    const requestQuery = getRequestQuery(request);
    const page = Number(request.nextUrl.searchParams.get('page') || '1');
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '20');
    const url = request.nextUrl.searchParams.get('url')?.trim() || undefined;

    if (url) {
        const { items, requestId } = await fetchAllRequestItems(requestQuery);
        const filteredItems = filterItemsByUrl(items, url);
        const data = paginateItems(filteredItems, page, pageSize);

        return createJsonResponse(
            {
                success: true,
                data: {
                    items: data.items,
                    pagination: data.pagination,
                    filters: {
                        platform: requestQuery.platform,
                        url,
                        requestSource: requestQuery.requestSource,
                        success: requestQuery.success,
                        errorCode: requestQuery.errorCode,
                        startDate: requestQuery.startDate,
                        endDate: requestQuery.endDate,
                    },
                },
            },
            200,
            requestId,
        );
    }

    const result = await requestUpstreamJson<{ data?: UpstreamRequestPage }>(
        getUpstreamRequestQuery(requestQuery),
    );
    const data = normalizeRequestPage(result.payload.data, {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
    });

    return createJsonResponse({ success: true, data }, 200, result.requestId);
};

export async function GET(request: NextRequest) {
    const targetValue = request.nextUrl.searchParams.get('target');
    const target: MonitorTarget | null =
        targetValue === 'aggregate'
            ? 'aggregate'
            : targetValue === 'requests'
                ? 'requests'
                : targetValue === 'health'
                    ? 'health'
                    : null;

    if (!target) {
        return NextResponse.json(
            {
                success: false,
                code: 'BAD_REQUEST',
                status: 400,
                requestId: 'monitor_proxy_invalid_target',
                details: {
                    message: 'target 必须是 health、aggregate 或 requests',
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

    if (target !== 'health') {
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
        if (target === 'health') {
            return await proxyHealth();
        }

        if (target === 'aggregate') {
            return await handleAggregateRequest(request);
        }

        return await handleRequestsRequest(request);
    } catch (error) {
        if (error instanceof UpstreamMonitorError) {
            const payload = toRecord(error.payload) as UpstreamErrorEnvelope;
            const normalizedPayload = {
                success: false,
                code: toString(payload.code, 'INTERNAL_ERROR'),
                status: payload.status ?? error.status,
                requestId: toString(payload.requestId) || error.requestId,
                details: payload.details,
                message: toString(payload.message),
            };

            return createJsonResponse(
                normalizedPayload,
                error.status,
                normalizedPayload.requestId,
            );
        }

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
