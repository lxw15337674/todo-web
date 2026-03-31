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

export interface RequestDomainTotal {
  requestDomain: string;
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
  requestDomainTopN: RequestDomainTotal[];
}

export interface RequestLogItem {
  id: string;
  timestamp: string;
  platform: string;
  requestSource: string;
  requestHost?: string;
  requestDomain?: string;
  success: boolean;
  errorCode?: string;
  message?: string;
  requestId: string;
  url?: string;
  raw: Record<string, unknown>;
}

export interface RequestPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface RequestFilters {
  platform?: MonitorPlatform;
  requestSource?: string;
  requestDomain?: string;
  success?: boolean;
  errorCode?: string;
  startDate?: string;
  endDate?: string;
}

export interface RequestStatsData {
  items: RequestLogItem[];
  pagination: RequestPagination;
  filters: RequestFilters;
}

export interface AggregateQuery {
  platform?: MonitorPlatform;
  requestSource?: string;
  requestDomain?: string;
  startDate?: string;
  endDate?: string;
  topN?: number;
}

export interface RequestQuery extends AggregateQuery {
  success?: boolean;
  page?: number;
  pageSize?: number;
  errorCode?: string;
}

export interface RequestDomainAggregateItem {
  key: string;
  requestDomain: string;
  requestHost?: string;
  total: number;
  successCount: number;
  failureCount: number;
  latestCreatedAt: string;
  raw: Record<string, unknown>;
}

export interface RequestDomainAggregateFilters extends RequestFilters {
  groupBy?: 'domain' | 'host';
  sortBy?: 'count' | 'latestCreatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RequestDomainStatsData {
  items: RequestDomainAggregateItem[];
  pagination: RequestPagination;
  filters: RequestDomainAggregateFilters;
}

export interface RequestDomainQuery extends AggregateQuery {
  success?: boolean;
  page?: number;
  pageSize?: number;
  errorCode?: string;
  groupBy?: 'domain' | 'host';
  sortBy?: 'count' | 'latestCreatedAt';
  sortOrder?: 'asc' | 'desc';
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

const toOptionalRecord = (
  value: unknown,
): Record<string, unknown> | undefined => {
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

const toBoolean = (value: unknown, fallback?: boolean): boolean | undefined => {
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

const createMonitorError = (
  status: number,
  payload: unknown,
): MonitorApiError => {
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
  target: 'health' | 'aggregate' | 'requests' | 'requestDomains',
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

export const normalizeAggregateData = (data: unknown): OverviewStatsData => {
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

  const recentDailyStats = Array.isArray(record.recentDailyStats)
    ? record.recentDailyStats.map((item) => {
        const row = toRecord(item);
        return {
          date: toString(row.date, '-'),
          successCount: toNumber(row.successCount, 0),
          failureCount: toNumber(row.failureCount, 0),
        };
      })
    : [];

  const requestDomainTopN = Array.isArray(record.requestDomainTopN)
    ? record.requestDomainTopN.map((item) => {
        const row = toRecord(item);
        return {
          requestDomain:
            toString(row.requestDomain) ||
            toString(row.requestSource) ||
            toString(row.sourceDomain) ||
            'unknown',
          count: toNumber(row.count, 0),
        };
      })
    : Array.isArray(record.requestSourceTopN)
      ? record.requestSourceTopN.map((item) => {
          const row = toRecord(item);
          return {
            requestDomain:
              toString(row.requestDomain) ||
              toString(row.requestSource) ||
              toString(row.sourceDomain) ||
              'unknown',
            count: toNumber(row.count, 0),
          };
        })
      : Array.isArray(record.sourceDomainTopN)
        ? record.sourceDomainTopN.map((item) => {
            const row = toRecord(item);
            return {
              requestDomain:
                toString(row.requestDomain) ||
                toString(row.requestSource) ||
                toString(row.sourceDomain) ||
                'unknown',
              count: toNumber(row.count, 0),
            };
          })
        : [];

  return {
    summary: {
      totalSuccessCount: toNumber(summary.totalSuccessCount, 0),
      todaySuccessCount: toNumber(summary.todaySuccessCount, 0),
      totalFailureCount: toNumber(summary.totalFailureCount, 0),
      recentFailureCount: toNumber(summary.recentFailureCount, 0),
    },
    platformTotals,
    recentDailyStats,
    requestDomainTopN,
  };
};

export const normalizeRequestStats = (
  data: unknown,
  fallback: { page: number; pageSize: number },
): RequestStatsData => {
  const record = toRecord(data);
  const source = Array.isArray(record.items) ? record.items : [];

  const items: RequestLogItem[] = source.map((entry, index) => {
    const row = toRecord(entry);
    const requestId =
      toString(row.requestId) ||
      toString(row.traceId) ||
      toString(row.id) ||
      '-';

    return {
      id: toString(row.id, `${fallback.page}-${index}`),
      timestamp: toString(row.timestamp) || toString(row.createdAt) || '-',
      platform: toString(row.platform, 'unknown'),
      requestSource:
        toString(row.requestSource) ||
        toString(row.requestHost) ||
        toString(row.requestDomain) ||
        toString(row.sourceDomain) ||
        'unknown',
      requestHost: toString(row.requestHost) || undefined,
      requestDomain:
        toString(row.requestDomain) ||
        toString(row.requestSource) ||
        toString(row.sourceDomain) ||
        undefined,
      success: toBoolean(row.success, false) ?? false,
      errorCode: toString(row.errorCode) || undefined,
      message: toString(row.errorMessage) || toString(row.message) || undefined,
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
  const filtersRecord = toRecord(record.filters);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      platform: (toString(filtersRecord.platform) || undefined) as
        | MonitorPlatform
        | undefined,
      requestSource:
        toString(filtersRecord.requestSource) ||
        toString(filtersRecord.requestHost) ||
        toString(filtersRecord.sourceDomain) ||
        undefined,
      requestDomain:
        toString(filtersRecord.requestDomain) ||
        toString(filtersRecord.sourceDomain) ||
        undefined,
      success: toBoolean(filtersRecord.success),
      errorCode: toString(filtersRecord.errorCode) || undefined,
      startDate: toString(filtersRecord.startDate) || undefined,
      endDate: toString(filtersRecord.endDate) || undefined,
    },
  };
};

export const normalizeRequestDomainStats = (
  data: unknown,
  fallback: { page: number; pageSize: number },
): RequestDomainStatsData => {
  const record = toRecord(data);
  const source = Array.isArray(record.items) ? record.items : [];

  const items: RequestDomainAggregateItem[] = source.map((entry, index) => {
    const row = toRecord(entry);
    return {
      key: toString(row.key, `${fallback.page}-${index}`),
      requestDomain:
        toString(row.requestDomain) || toString(row.key) || 'unknown',
      requestHost: toString(row.requestHost) || undefined,
      total: toNumber(row.total, 0),
      successCount: toNumber(row.successCount, 0),
      failureCount: toNumber(row.failureCount, 0),
      latestCreatedAt: toString(row.latestCreatedAt) || '-',
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
  const filtersRecord = toRecord(record.filters);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      groupBy: (toString(filtersRecord.groupBy) || undefined) as
        | 'domain'
        | 'host'
        | undefined,
      sortBy: (toString(filtersRecord.sortBy) || undefined) as
        | 'count'
        | 'latestCreatedAt'
        | undefined,
      sortOrder: (toString(filtersRecord.sortOrder) || undefined) as
        | 'asc'
        | 'desc'
        | undefined,
      platform: (toString(filtersRecord.platform) || undefined) as
        | MonitorPlatform
        | undefined,
      requestSource:
        toString(filtersRecord.requestSource) ||
        toString(filtersRecord.requestHost) ||
        undefined,
      requestDomain: toString(filtersRecord.requestDomain) || undefined,
      success: toBoolean(filtersRecord.success),
      errorCode: toString(filtersRecord.errorCode) || undefined,
      startDate: toString(filtersRecord.startDate) || undefined,
      endDate: toString(filtersRecord.endDate) || undefined,
    },
  };
};

export const fetchAdminAggregate = async (
  query?: AggregateQuery,
): Promise<OverviewStatsData> => {
  const result = await requestMonitorApi<
    StatsEnvelope<Record<string, unknown>>
  >('aggregate', {
    query: query
      ? {
          platform: query.platform,
          requestSource: query.requestSource,
          requestDomain: query.requestDomain,
          startDate: query.startDate,
          endDate: query.endDate,
          topN: query.topN,
        }
      : undefined,
  });
  return normalizeAggregateData(result.data);
};

export const fetchAdminRequests = async (
  query: RequestQuery,
): Promise<RequestStatsData> => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const result = await requestMonitorApi<
    StatsEnvelope<Record<string, unknown>>
  >('requests', {
    query: {
      platform: query.platform,
      requestSource: query.requestSource,
      requestDomain: query.requestDomain,
      startDate: query.startDate,
      endDate: query.endDate,
      success: query.success,
      page,
      pageSize,
      errorCode: query.errorCode,
    },
  });

  return normalizeRequestStats(result.data, {
    page,
    pageSize,
  });
};

export const fetchAdminRequestDomains = async (
  query: RequestDomainQuery,
): Promise<RequestDomainStatsData> => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const result = await requestMonitorApi<
    StatsEnvelope<Record<string, unknown>>
  >('requestDomains', {
    query: {
      platform: query.platform,
      requestSource: query.requestSource,
      requestDomain: query.requestDomain,
      startDate: query.startDate,
      endDate: query.endDate,
      success: query.success,
      page,
      pageSize,
      errorCode: query.errorCode,
      groupBy: query.groupBy,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });

  return normalizeRequestDomainStats(result.data, {
    page,
    pageSize,
  });
};

export const normalizeHealthData = (data: unknown): HealthResponse => {
  const record = toRecord(data);
  return {
    success: toBoolean(record.success, false) ?? false,
    status: toString(record.status, 'unknown'),
    timestamp: toString(record.timestamp, ''),
    version: toString(record.version, '-'),
    supportedPlatforms: toStringArray(record.supportedPlatforms),
    ...record,
  };
};
