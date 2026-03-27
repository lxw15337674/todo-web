export type MonitorStatsView = 'overview' | 'daily' | 'failures';

export type MonitorPlatform =
    | 'bilibili'
    | 'bilibili_tv'
    | 'douyin'
    | 'instagram'
    | 'xiaohongshu'
    | 'tiktok'
    | 'x'
    | 'unknown';

interface MonitorErrorEnvelope {
    success?: boolean;
    code?: string;
    status?: number;
    requestId?: string;
    details?: Record<string, unknown>;
    message?: string;
}

export interface HealthResponse {
    success: boolean;
    status: string;
    timestamp: string;
    version: string;
    supportedPlatforms: string[];
    [key: string]: unknown;
}

export interface DailyStatPoint {
    date: string;
    successCount: number;
    failureCount: number;
}

export interface PlatformTotal {
    platform: string;
    count: number;
}

export interface OverviewSummary {
    totalSuccessCount: number;
    todaySuccessCount: number;
    totalFailureCount: number;
    recentFailureCount: number;
}

export interface OverviewStatsData {
    summary: OverviewSummary;
    platformTotals: PlatformTotal[];
    recentDailyStats: DailyStatPoint[];
}

export interface FailureLogItem {
    id: string;
    timestamp: string;
    platform: string;
    errorCode: string;
    message: string;
    requestId: string;
    url?: string;
    raw: Record<string, unknown>;
}

export interface FailurePagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface FailureStatsData {
    items: FailureLogItem[];
    pagination: FailurePagination;
}

export interface FailureQuery {
    platform?: MonitorPlatform;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    errorCode?: string;
    includeUrl?: boolean;
}

interface StatsEnvelope<TData = Record<string, unknown>> {
    success: boolean;
    data: TData;
    code?: string;
    status?: number;
    requestId?: string;
    details?: Record<string, unknown>;
}

export class MonitorApiError extends Error {
    status: number;
    code?: string;
    requestId?: string;
    details?: Record<string, unknown>;

    constructor(
        message: string,
        status: number,
        code?: string,
        requestId?: string,
        details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'MonitorApiError';
        this.status = status;
        this.code = code;
        this.requestId = requestId;
        this.details = details;
    }
}

const toRecord = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as Record<string, unknown>;
};

const toOptionalRecord = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
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

const toBoolean = (value: unknown, fallback = false): boolean => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return fallback;
};

const toStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => toString(item))
        .filter((item): item is string => item.length > 0);
};

const createMonitorError = (status: number, payload: unknown): MonitorApiError => {
    const envelope = toRecord(payload) as MonitorErrorEnvelope;
    const code = toString(envelope.code);
    const requestId = toString(envelope.requestId);
    const message =
        toString(envelope.message) ||
        (code ? `请求失败：${code}` : `请求失败，状态码 ${status}`);

    return new MonitorApiError(
        message,
        status,
        code || undefined,
        requestId || undefined,
        toOptionalRecord(envelope.details),
    );
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

const requestMonitorApi = async <T>(
    target: 'health' | 'stats',
    options?: {
        query?: Record<string, string | number | boolean | undefined>;
    },
): Promise<T> => {
    const params = new URLSearchParams({ target });
    if (options?.query) {
        Object.entries(options.query).forEach(([key, value]) => {
            appendQuery(params, key, value);
        });
    }

    const headers = new Headers({
        Accept: 'application/json',
    });

    const response = await fetch(`/api/admin/monitor?${params.toString()}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw createMonitorError(response.status, payload);
    }

    return payload as T;
};

export const fetchHealth = async (): Promise<HealthResponse> => {
    return requestMonitorApi<HealthResponse>('health');
};

export const fetchAdminStats = async <TData = Record<string, unknown>>(
    query: {
        view: MonitorStatsView;
        platform?: MonitorPlatform;
        startDate?: string;
        endDate?: string;
        page?: number;
        pageSize?: number;
        errorCode?: string;
        includeUrl?: boolean;
    },
): Promise<StatsEnvelope<TData>> => {
    return requestMonitorApi<StatsEnvelope<TData>>('stats', {
        query,
    });
};

export const normalizeOverviewData = (data: unknown): OverviewStatsData => {
    const record = toRecord(data);
    const summary = toRecord(record.summary);

    const platformTotals = Array.isArray(record.platformTotals)
        ? record.platformTotals.map((item) => {
            const row = toRecord(item);
            return {
                platform: toString(row.platform, 'unknown'),
                count: toNumber(row.count, 0),
            };
        })
        : [];

    const recentDailySource = Array.isArray(record.recentDailyStats)
        ? record.recentDailyStats
        : [];

    const recentDailyStats: DailyStatPoint[] = recentDailySource.map((item) => {
        const row = toRecord(item);
        return {
            date: toString(row.date, '-'),
            successCount: toNumber(row.successCount, 0),
            failureCount: toNumber(row.failureCount, 0),
        };
    });

    return {
        summary: {
            totalSuccessCount: toNumber(summary.totalSuccessCount, 0),
            todaySuccessCount: toNumber(summary.todaySuccessCount, 0),
            totalFailureCount: toNumber(summary.totalFailureCount, 0),
            recentFailureCount: toNumber(summary.recentFailureCount, 0),
        },
        platformTotals,
        recentDailyStats,
    };
};

export const normalizeDailyStats = (data: unknown): DailyStatPoint[] => {
    const record = toRecord(data);
    const source = Array.isArray(record.dailyStats)
        ? record.dailyStats
        : Array.isArray(record.recentDailyStats)
            ? record.recentDailyStats
            : Array.isArray(record.items)
                ? record.items
                : [];

    return source.map((item) => {
        const row = toRecord(item);
        return {
            date: toString(row.date, '-'),
            successCount: toNumber(row.successCount, 0),
            failureCount: toNumber(row.failureCount, 0),
        };
    });
};

export const normalizeFailureStats = (
    data: unknown,
    fallback: { page: number; pageSize: number },
): FailureStatsData => {
    const record = toRecord(data);

    const source = Array.isArray(record.failures)
        ? record.failures
        : Array.isArray(record.items)
            ? record.items
            : Array.isArray(record.logs)
                ? record.logs
                : [];

    const items: FailureLogItem[] = source.map((entry, index) => {
        const row = toRecord(entry);
        const requestId =
            toString(row.requestId) ||
            toString(row.traceId) ||
            toString(row.id) ||
            '-';

        const timestamp =
            toString(row.timestamp) ||
            toString(row.createdAt) ||
            toString(row.date) ||
            '-';

        return {
            id: toString(row.id, `${fallback.page}-${index}`),
            timestamp,
            platform: toString(row.platform, 'unknown'),
            errorCode:
                toString(row.errorCode) ||
                toString(row.code) ||
                toString(row.error) ||
                '-',
            message:
                toString(row.message) ||
                toString(row.errorMessage) ||
                toString(row.reason) ||
                '-',
            requestId,
            url:
                toString(row.url) ||
                toString(row.rawUrl) ||
                toString(row.sourceUrl) ||
                undefined,
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

    return {
        items,
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
        },
    };
};

export const fetchAdminOverview = async (
    query?: Pick<FailureQuery, 'platform' | 'startDate' | 'endDate'>,
): Promise<OverviewStatsData> => {
    const result = await fetchAdminStats({
        view: 'overview',
        platform: query?.platform,
        startDate: query?.startDate,
        endDate: query?.endDate,
    });
    return normalizeOverviewData(result.data);
};

export const fetchAdminDaily = async (
    query?: Pick<FailureQuery, 'platform' | 'startDate' | 'endDate'>,
): Promise<DailyStatPoint[]> => {
    const result = await fetchAdminStats({
        view: 'daily',
        platform: query?.platform,
        startDate: query?.startDate,
        endDate: query?.endDate,
    });
    return normalizeDailyStats(result.data);
};

export const fetchAdminFailures = async (
    query: FailureQuery,
): Promise<FailureStatsData> => {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result = await fetchAdminStats({
        view: 'failures',
        platform: query.platform,
        startDate: query.startDate,
        endDate: query.endDate,
        page,
        pageSize,
        errorCode: query.errorCode,
        includeUrl: toBoolean(query.includeUrl, false),
    });

    return normalizeFailureStats(result.data, {
        page,
        pageSize,
    });
};

export const normalizeHealthData = (data: unknown): HealthResponse => {
    const record = toRecord(data);
    return {
        success: toBoolean(record.success, false),
        status: toString(record.status, 'unknown'),
        timestamp: toString(record.timestamp, ''),
        version: toString(record.version, '-'),
        supportedPlatforms: toStringArray(record.supportedPlatforms),
        ...record,
    };
};
