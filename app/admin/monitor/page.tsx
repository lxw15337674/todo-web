'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChartColumnIncreasing,
  CheckCircle2,
  Clock3,
  ListFilter,
  MessageSquare,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import { usePermission } from '@/hooks/usePermission';
import {
  type DailyStatPoint,
  fetchAdminAggregate,
  fetchAdminFeedback,
  fetchAdminRequestDomains,
  fetchAdminRequests,
  fetchHealth,
  type AggregateQuery,
  type FeedbackData,
  type FeedbackQuery,
  type FeedbackStatus,
  type FeedbackType,
  type HealthResponse,
  type MonitorPlatform,
  MonitorApiError,
  normalizeHealthData,
  type OverviewStatsData,
  type RequestDomainQuery,
  type RequestDomainStatsData,
  type RequestQuery,
  type RequestStatsData,
} from '@/api/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const AUTO_REFRESH_INTERVAL_MS = 30_000;
const SLOW_REQUEST_MS = 1_500;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const REQUEST_DOMAIN_PAGE_SIZE = 12;
const FEEDBACK_PAGE_SIZE = 10;
const REQUEST_STATUS_OPTIONS = [
  { label: '全部状态', value: 'all' },
  { label: '仅成功', value: 'success' },
  { label: '仅失败', value: 'failure' },
] as const;
const FEEDBACK_TYPE_OPTIONS = [
  { label: '全部类型', value: 'all' },
  { label: 'Bug', value: 'bug' },
  { label: '功能建议', value: 'feature' },
  { label: '其他', value: 'other' },
] as const;
const FEEDBACK_STATUS_OPTIONS = [
  { label: '全部状态', value: 'all' },
  { label: '新反馈', value: 'new' },
  { label: '已查看', value: 'reviewed' },
  { label: '已解决', value: 'resolved' },
  { label: '垃圾反馈', value: 'spam' },
] as const;
const DAILY_STATS_CHART_CONFIG = {
  successCount: {
    label: '成功',
    color: '#16a34a',
  },
  failureCount: {
    label: '失败',
    color: '#dc2626',
  },
} satisfies ChartConfig;
const PLATFORM_LABELS: Record<string, string> = {
  bilibili: 'Bilibili',
  bilibili_tv: 'Bilibili TV',
  douyin: '抖音',
  instagram: 'Instagram',
  xiaohongshu: '小红书',
  tiktok: 'TikTok',
  x: 'X / Twitter',
  unknown: '未知平台',
};

type RequestStatusFilter = (typeof REQUEST_STATUS_OPTIONS)[number]['value'];
type FeedbackTypeFilter = (typeof FEEDBACK_TYPE_OPTIONS)[number]['value'];
type FeedbackStatusFilter = (typeof FEEDBACK_STATUS_OPTIONS)[number]['value'];

const numberFormatter = new Intl.NumberFormat('zh-CN');

const emptyRequests: RequestStatsData = {
  items: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  },
  filters: {},
};

const emptyRequestDomains: RequestDomainStatsData = {
  items: [],
  pagination: {
    page: 1,
    pageSize: REQUEST_DOMAIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  },
  filters: {},
};

const emptyFeedback: FeedbackData = {
  items: [],
  pagination: {
    page: 1,
    pageSize: FEEDBACK_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  },
  filters: {},
};

const formatErrorMessage = (error: unknown) => {
  if (error instanceof MonitorApiError) {
    const parts = [error.message];
    if (error.code) {
      parts.push(`错误码: ${error.code}`);
    }
    if (error.requestId) {
      parts.push(`请求ID: ${error.requestId}`);
    }
    return parts.join(' | ');
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '请求失败，请稍后重试。';
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN');
};

const formatMetric = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return numberFormatter.format(value);
};

const formatRequestDomain = (value?: string) => {
  if (!value || value.trim() === '') {
    return 'unknown';
  }
  return value;
};

const formatPlatformLabel = (platform: string) => {
  return PLATFORM_LABELS[platform] || platform;
};

const formatFeedbackTypeLabel = (type: FeedbackType) => {
  if (type === 'bug') {
    return 'Bug';
  }
  if (type === 'feature') {
    return '功能建议';
  }
  return '其他';
};

const formatFeedbackStatusLabel = (status: FeedbackStatus) => {
  if (status === 'reviewed') {
    return '已查看';
  }
  if (status === 'resolved') {
    return '已解决';
  }
  if (status === 'spam') {
    return '垃圾反馈';
  }
  return '新反馈';
};

const getFeedbackStatusVariant = (status: FeedbackStatus) => {
  if (status === 'resolved') {
    return 'default' as const;
  }
  if (status === 'spam') {
    return 'destructive' as const;
  }
  if (status === 'reviewed') {
    return 'outline' as const;
  }
  return 'secondary' as const;
};

const toMetadataRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const formatNameVersion = (value: unknown) => {
  const record = toMetadataRecord(value);
  const name = typeof record.name === 'string' ? record.name : '';
  const version = typeof record.version === 'string' ? record.version : '';

  return [name, version].filter(Boolean).join(' ') || '-';
};

const formatFeedbackDeviceSummary = (
  metadata: Record<string, unknown> | undefined,
  userAgent: string | undefined,
) => {
  if (!metadata) {
    return userAgent || '-';
  }

  const browser = formatNameVersion(metadata.browser);
  const os = formatNameVersion(metadata.os);
  const deviceType =
    typeof metadata.deviceType === 'string' ? metadata.deviceType : '';
  const viewport = toMetadataRecord(metadata.viewport);
  const viewportText =
    typeof viewport.width === 'number' && typeof viewport.height === 'number'
      ? `${viewport.width}x${viewport.height}`
      : '';

  return [browser, os, deviceType, viewportText]
    .filter((item) => item && item !== '-')
    .join(' / ') || userAgent || '-';
};

const getTodayDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAggregateStatusLabel = (status?: 'ok' | 'degraded' | 'down') => {
  if (status === 'ok') {
    return '正常';
  }
  if (status === 'down') {
    return '异常';
  }
  return '波动';
};

const getAggregateStatusVariant = (status?: 'ok' | 'degraded' | 'down') => {
  if (status === 'ok') {
    return 'default' as const;
  }
  if (status === 'down') {
    return 'destructive' as const;
  }
  return 'secondary' as const;
};

const resolveRequestDomainStatus = (
  successCount: number,
  failureCount: number,
) => {
  if (failureCount === 0) {
    return 'ok' as const;
  }

  if (successCount === 0 && failureCount >= 3) {
    return 'down' as const;
  }

  return 'degraded' as const;
};

const getRequestStartTime = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

const getRequestDuration = (startTime: number) => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return Math.max(0, performance.now() - startTime);
  }
  return Math.max(0, Date.now() - startTime);
};

function RequestMetaBadges({
  statusCode,
  durationMs,
  loading,
}: {
  statusCode: number | null;
  durationMs: number | null;
  loading: boolean;
}) {
  const isSlow = typeof durationMs === 'number' && durationMs >= SLOW_REQUEST_MS;
  const statusVariant =
    loading ? 'secondary' : statusCode && statusCode >= 400 ? 'destructive' : 'outline';
  const durationVariant = loading ? 'secondary' : isSlow ? 'destructive' : 'outline';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={statusVariant}>{loading ? '请求中' : `HTTP ${statusCode ?? '-'}`}</Badge>
      <Badge variant={durationVariant}>
        {loading ? '耗时计算中' : `${Math.round(durationMs ?? 0)}ms`}
      </Badge>
      {isSlow && !loading && <Badge variant="secondary">慢请求</Badge>}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{formatMetric(value)}</div>
        <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminMonitorPage() {
  usePermission();

  const requestDomainMetricsLoadIdRef = useRef(0);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [overview, setOverview] = useState<OverviewStatsData | null>(null);
  const [trendData, setTrendData] = useState<DailyStatPoint[]>([]);
  const [requests, setRequests] = useState<RequestStatsData>(emptyRequests);
  const [requestDomains, setRequestDomains] =
    useState<RequestDomainStatsData>(emptyRequestDomains);
  const [feedback, setFeedback] = useState<FeedbackData>(emptyFeedback);
  const [requestDomainMetrics, setRequestDomainMetrics] = useState<
    Record<string, RequestDomainStatsData['items'][number]>
  >({});

  const [healthLoading, setHealthLoading] = useState(false);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestDomainsLoading, setRequestDomainsLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [requestDomainMetricsLoading, setRequestDomainMetricsLoading] =
    useState(false);

  const [healthError, setHealthError] = useState<string | null>(null);
  const [aggregateError, setAggregateError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestDomainsError, setRequestDomainsError] = useState<string | null>(
    null,
  );
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [requestDomainMetricsError, setRequestDomainMetricsError] = useState<
    string | null
  >(null);
  const [healthStatusCode, setHealthStatusCode] = useState<number | null>(null);
  const [aggregateStatusCode, setAggregateStatusCode] = useState<number | null>(null);
  const [trendStatusCode, setTrendStatusCode] = useState<number | null>(null);
  const [requestsStatusCode, setRequestsStatusCode] = useState<number | null>(null);
  const [requestDomainsStatusCode, setRequestDomainsStatusCode] = useState<
    number | null
  >(null);
  const [feedbackStatusCode, setFeedbackStatusCode] = useState<number | null>(null);
  const [healthDurationMs, setHealthDurationMs] = useState<number | null>(null);
  const [aggregateDurationMs, setAggregateDurationMs] = useState<number | null>(null);
  const [trendDurationMs, setTrendDurationMs] = useState<number | null>(null);
  const [requestsDurationMs, setRequestsDurationMs] = useState<number | null>(null);
  const [requestDomainsDurationMs, setRequestDomainsDurationMs] = useState<
    number | null
  >(null);
  const [feedbackDurationMs, setFeedbackDurationMs] = useState<number | null>(null);

  const [platform, setPlatform] = useState<'all' | MonitorPlatform>('all');
  const [urlFilter, setUrlFilter] = useState('');
  const [requestDomainFilter, setRequestDomainFilter] = useState('');
  const [requestDomainSearch, setRequestDomainSearch] = useState('');
  const [startDate, setStartDate] = useState(() => getTodayDateValue());
  const [endDate, setEndDate] = useState('');
  const [requestStatus, setRequestStatus] = useState<RequestStatusFilter>('failure');
  const [errorCode, setErrorCode] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [requestDomainPage, setRequestDomainPage] = useState(1);
  const [feedbackType, setFeedbackType] = useState<FeedbackTypeFilter>('all');
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatusFilter>('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackStartDate, setFeedbackStartDate] = useState('');
  const [feedbackEndDate, setFeedbackEndDate] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(1);

  const normalizedSharedFilter = useMemo(() => {
    return {
      platform: platform === 'all' ? undefined : platform,
      url: urlFilter.trim() || undefined,
      requestDomain: requestDomainFilter.trim().toLowerCase() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }, [platform, urlFilter, requestDomainFilter, startDate, endDate]);

  const aggregateQuery = useMemo<AggregateQuery>(() => {
    return {
      ...normalizedSharedFilter,
    };
  }, [normalizedSharedFilter]);

  const requestDomainMetricQuery = useMemo<RequestDomainQuery>(() => {
    return {
      platform: normalizedSharedFilter.platform,
      url: normalizedSharedFilter.url,
      startDate: normalizedSharedFilter.startDate,
      endDate: normalizedSharedFilter.endDate,
      page: 1,
      pageSize: 1,
      sortBy: 'count',
      sortOrder: 'desc',
    };
  }, [
    normalizedSharedFilter.endDate,
    normalizedSharedFilter.platform,
    normalizedSharedFilter.startDate,
    normalizedSharedFilter.url,
  ]);

  const requestDomainsQuery = useMemo<RequestDomainQuery>(() => {
    const success =
      requestStatus === 'success'
        ? true
        : requestStatus === 'failure'
          ? false
          : undefined;

    return {
      platform: normalizedSharedFilter.platform,
      url: normalizedSharedFilter.url,
      startDate: normalizedSharedFilter.startDate,
      endDate: normalizedSharedFilter.endDate,
      success,
      page: requestDomainPage,
      pageSize: REQUEST_DOMAIN_PAGE_SIZE,
      sortBy: 'count',
      sortOrder: 'desc',
      errorCode: requestStatus === 'success' ? undefined : errorCode.trim() || undefined,
      q: requestDomainSearch.trim().toLowerCase() || undefined,
    };
  }, [
    normalizedSharedFilter.endDate,
    normalizedSharedFilter.platform,
    normalizedSharedFilter.startDate,
    normalizedSharedFilter.url,
    requestStatus,
    requestDomainPage,
    requestDomainSearch,
    errorCode,
  ]);

  const requestsQuery = useMemo<RequestQuery>(() => {
    const success =
      requestStatus === 'success'
        ? true
        : requestStatus === 'failure'
          ? false
          : undefined;

    return {
      ...normalizedSharedFilter,
      success,
      page,
      pageSize,
      errorCode: requestStatus === 'success' ? undefined : errorCode.trim() || undefined,
    };
  }, [normalizedSharedFilter, requestStatus, page, pageSize, errorCode]);

  const feedbackQuery = useMemo<FeedbackQuery>(() => {
    return {
      type: feedbackType === 'all' ? undefined : feedbackType,
      status: feedbackStatus === 'all' ? undefined : feedbackStatus,
      q: feedbackSearch.trim() || undefined,
      startDate: feedbackStartDate || undefined,
      endDate: feedbackEndDate || undefined,
      page: feedbackPage,
      pageSize: FEEDBACK_PAGE_SIZE,
    };
  }, [
    feedbackEndDate,
    feedbackPage,
    feedbackSearch,
    feedbackStartDate,
    feedbackStatus,
    feedbackType,
  ]);

  const shouldLoadRequestDomainMetrics =
    requestStatus !== 'all' || errorCode.trim() !== '';

  const platformOptions = useMemo<
    Array<{ label: string; value: 'all' | MonitorPlatform }>
  >(() => {
    const seen = new Set<string>();
    const options: Array<{ label: string; value: 'all' | MonitorPlatform }> = [
      { label: '全部平台', value: 'all' },
    ];

    (health?.supportedPlatforms || []).forEach((item) => {
      const value = item.trim();
      if (!value || seen.has(value)) {
        return;
      }
      seen.add(value);
      options.push({
        label: formatPlatformLabel(value),
        value,
      });
    });

    if (platform !== 'all' && !seen.has(platform)) {
      options.push({
        label: formatPlatformLabel(platform),
        value: platform,
      });
    }

    return options;
  }, [health?.supportedPlatforms, platform]);

  const loadHealth = useCallback(async () => {
    const startTime = getRequestStartTime();
    setHealthLoading(true);
    setHealthError(null);

    try {
      const result = await fetchHealth();
      setHealth(normalizeHealthData(result));
      setHealthStatusCode(200);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setHealth(null);
      setHealthStatusCode(error instanceof MonitorApiError ? error.status : null);
      setHealthError(formatErrorMessage(error));
    } finally {
      setHealthLoading(false);
      setHealthDurationMs(getRequestDuration(startTime));
    }
  }, []);

  const loadAggregate = useCallback(async (query: AggregateQuery) => {
    const startTime = getRequestStartTime();
    setAggregateLoading(true);
    setAggregateError(null);

    try {
      const result = await fetchAdminAggregate(query);
      setOverview(result);
      setAggregateStatusCode(200);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setOverview(null);
      setAggregateStatusCode(error instanceof MonitorApiError ? error.status : null);
      setAggregateError(formatErrorMessage(error));
    } finally {
      setAggregateLoading(false);
      setAggregateDurationMs(getRequestDuration(startTime));
    }
  }, []);

  const loadTrend = useCallback(async () => {
    const startTime = getRequestStartTime();
    setTrendLoading(true);
    setTrendError(null);

    try {
      const result = await fetchAdminAggregate();
      setTrendData(result.recentDailyStats || []);
      setTrendStatusCode(200);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setTrendData([]);
      setTrendStatusCode(error instanceof MonitorApiError ? error.status : null);
      setTrendError(formatErrorMessage(error));
    } finally {
      setTrendLoading(false);
      setTrendDurationMs(getRequestDuration(startTime));
    }
  }, []);

  const loadRequests = useCallback(async (query: RequestQuery) => {
    const startTime = getRequestStartTime();
    setRequestsLoading(true);
    setRequestsError(null);

    try {
      const result = await fetchAdminRequests(query);
      setRequests(result);
      setRequestsStatusCode(200);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setRequests(emptyRequests);
      setRequestsStatusCode(error instanceof MonitorApiError ? error.status : null);
      setRequestsError(formatErrorMessage(error));
    } finally {
      setRequestsLoading(false);
      setRequestsDurationMs(getRequestDuration(startTime));
    }
  }, []);

  const loadRequestDomains = useCallback(async (query: RequestDomainQuery) => {
    const startTime = getRequestStartTime();
    setRequestDomainsLoading(true);
    setRequestDomainsError(null);
    requestDomainMetricsLoadIdRef.current += 1;
    setRequestDomainMetrics({});
    setRequestDomainMetricsError(null);
    setRequestDomainMetricsLoading(false);

    try {
      const result = await fetchAdminRequestDomains(query);
      setRequestDomains(result);
      setRequestDomainsStatusCode(200);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setRequestDomains(emptyRequestDomains);
      setRequestDomainsStatusCode(
        error instanceof MonitorApiError ? error.status : null,
      );
      setRequestDomainsError(formatErrorMessage(error));
    } finally {
      setRequestDomainsLoading(false);
      setRequestDomainsDurationMs(getRequestDuration(startTime));
    }
  }, []);

  const loadFeedback = useCallback(async (query: FeedbackQuery) => {
    const startTime = getRequestStartTime();
    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const result = await fetchAdminFeedback(query);
      setFeedback(result);
      setFeedbackStatusCode(200);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setFeedback(emptyFeedback);
      setFeedbackStatusCode(error instanceof MonitorApiError ? error.status : null);
      setFeedbackError(formatErrorMessage(error));
    } finally {
      setFeedbackLoading(false);
      setFeedbackDurationMs(getRequestDuration(startTime));
    }
  }, []);

  const loadRequestDomainMetrics = useCallback(
    async (domains: string[], baseQuery: RequestDomainQuery) => {
      const currentLoadId = requestDomainMetricsLoadIdRef.current + 1;
      requestDomainMetricsLoadIdRef.current = currentLoadId;
      const uniqueDomains = Array.from(
        new Set(
          domains
            .map((item) => item.trim().toLowerCase())
            .filter((item) => item.length > 0),
        ),
      );

      if (uniqueDomains.length === 0) {
        if (requestDomainMetricsLoadIdRef.current === currentLoadId) {
          setRequestDomainMetrics({});
          setRequestDomainMetricsError(null);
          setRequestDomainMetricsLoading(false);
        }
        return;
      }

      setRequestDomainMetricsLoading(true);
      setRequestDomainMetricsError(null);

      const settled = await Promise.allSettled(
        uniqueDomains.map(async (requestDomain) => {
          const result = await fetchAdminRequestDomains({
            ...baseQuery,
            requestDomain,
          });

          return {
            requestDomain,
            item: result.items[0],
          };
        }),
      );

      const nextMetrics: Record<
        string,
        RequestDomainStatsData['items'][number]
      > = {};
      const failures: string[] = [];

      settled.forEach((entry, index) => {
        if (entry.status === 'fulfilled') {
          if (entry.value.item) {
            nextMetrics[entry.value.requestDomain] = entry.value.item;
          }
          return;
        }

        failures.push(
          `${uniqueDomains[index]}: ${formatErrorMessage(entry.reason)}`,
        );
      });

      if (requestDomainMetricsLoadIdRef.current === currentLoadId) {
        setRequestDomainMetrics(nextMetrics);
        setRequestDomainMetricsError(
          failures.length > 0 ? failures[0] : null,
        );
        setRequestDomainMetricsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadHealth();
  }, [loadHealth, refreshTick]);

  useEffect(() => {
    void loadAggregate(aggregateQuery);
  }, [loadAggregate, aggregateQuery, refreshTick]);

  useEffect(() => {
    void loadTrend();
  }, [loadTrend, refreshTick]);

  useEffect(() => {
    void loadRequests(requestsQuery);
  }, [loadRequests, refreshTick, requestsQuery]);

  useEffect(() => {
    void loadRequestDomains(requestDomainsQuery);
  }, [loadRequestDomains, refreshTick, requestDomainsQuery]);

  useEffect(() => {
    void loadFeedback(feedbackQuery);
  }, [feedbackQuery, loadFeedback, refreshTick]);

  useEffect(() => {
    if (!shouldLoadRequestDomainMetrics || requestDomainsLoading) {
      if (!shouldLoadRequestDomainMetrics) {
        requestDomainMetricsLoadIdRef.current += 1;
        setRequestDomainMetrics({});
        setRequestDomainMetricsError(null);
        setRequestDomainMetricsLoading(false);
      }
      return;
    }

    void loadRequestDomainMetrics(
      requestDomains.items.map((item) => item.requestDomain),
      requestDomainMetricQuery,
    );
  }, [
    loadRequestDomainMetrics,
    requestDomainMetricQuery,
    requestDomains.items,
    requestDomainsLoading,
    shouldLoadRequestDomainMetrics,
  ]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }
    const timer = window.setInterval(() => {
      setRefreshTick((prev) => prev + 1);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRefresh]);

  const totalPages = Math.max(1, requests.pagination.totalPages || 1);
  const requestDomainTotalPages = Math.max(
    1,
    requestDomains.pagination.totalPages || 1,
  );
  const feedbackTotalPages = Math.max(1, feedback.pagination.totalPages || 1);

  const handleRefreshAll = () => {
    setRefreshTick((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setPlatform('all');
    setUrlFilter('');
    setRequestDomainFilter('');
    setRequestDomainSearch('');
    setStartDate(getTodayDateValue());
    setEndDate('');
    setRequestStatus('failure');
    setErrorCode('');
    setPage(1);
    setPageSize(20);
    setRequestDomainPage(1);
    setFeedbackType('all');
    setFeedbackStatus('all');
    setFeedbackSearch('');
    setFeedbackStartDate('');
    setFeedbackEndDate('');
    setFeedbackPage(1);
  };

  const healthStatusText = health?.status || 'unknown';
  const isHealthy = healthStatusText.toLowerCase().includes('healthy');

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5" />
              系统状态监控
            </CardTitle>
            <CardDescription>
              同时接入 `/api/health` 与新版 `/api/admin/stats`，管理统计由请求明细接口在代理层聚合后展示。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Button
                variant="outline"
                onClick={handleRefreshAll}
                disabled={
                  healthLoading ||
                  aggregateLoading ||
                  trendLoading ||
                  requestsLoading ||
                  requestDomainsLoading ||
                  feedbackLoading ||
                  requestDomainMetricsLoading
                }
              >
                <RefreshCw className="h-4 w-4" />
                手动刷新
              </Button>
              <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
                <Checkbox
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={(checked) => setAutoRefresh(checked === true)}
                />
                <Label htmlFor="auto-refresh" className="cursor-pointer text-sm font-normal">
                  自动刷新（30 秒）
                </Label>
              </div>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-4 w-4" />
                最近刷新: {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                健康检查
              </CardTitle>
              <RequestMetaBadges
                statusCode={healthStatusCode}
                durationMs={healthDurationMs}
                loading={healthLoading}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {healthError}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={isHealthy ? 'default' : 'destructive'}>
                {healthLoading ? '检查中...' : healthStatusText}
              </Badge>
              <span className="text-sm text-muted-foreground">
                版本: {health?.version || '-'}
              </span>
              <span className="text-sm text-muted-foreground">
                时间: {formatDateTime(health?.timestamp)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(health?.supportedPlatforms || []).map((item) => (
                <Badge variant="outline" key={item}>
                  {formatPlatformLabel(item)}
                </Badge>
              ))}
              {(health?.supportedPlatforms || []).length === 0 && (
                <span className="text-sm text-muted-foreground">暂无平台信息</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <ChartColumnIncreasing className="h-5 w-5" />
                管理统计总览
              </CardTitle>
              <RequestMetaBadges
                statusCode={aggregateStatusCode}
                durationMs={aggregateDurationMs}
                loading={aggregateLoading}
              />
            </div>
            <CardDescription>
              概览卡片和平台分布随筛选刷新，按日趋势固定展示全局近 7 天请求走势。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aggregateError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {aggregateError}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="累计成功"
                value={overview?.summary.totalSuccessCount || 0}
                subtitle="当前筛选下的成功请求数"
              />
              <MetricCard
                title="今日成功"
                value={overview?.summary.todaySuccessCount || 0}
                subtitle="当前筛选下当日成功请求数"
              />
              <MetricCard
                title="累计失败"
                value={overview?.summary.totalFailureCount || 0}
                subtitle="当前筛选下的失败请求数"
              />
              <MetricCard
                title="近期失败"
                value={overview?.summary.recentFailureCount || 0}
                subtitle="最近 7 天失败请求数"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <Card className="shadow-none">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base">按日趋势</CardTitle>
                    <RequestMetaBadges
                      statusCode={trendStatusCode}
                      durationMs={trendDurationMs}
                      loading={trendLoading}
                    />
                  </div>
                  <CardDescription>
                    展示全局近 7 天请求走势，不跟随下方筛选条件。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trendError && (
                    <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {trendError}
                    </div>
                  )}
                  <div className="h-[280px] w-full">
                    {trendLoading ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        趋势数据加载中...
                      </div>
                    ) : trendData.length > 0 ? (
                      <ChartContainer
                        config={DAILY_STATS_CHART_CONFIG}
                        className="h-full w-full aspect-auto"
                      >
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <ChartTooltip
                              content={
                                <ChartTooltipContent indicator="line" />
                              }
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="successCount"
                            name="成功"
                            stroke="#16a34a"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="failureCount"
                            name="失败"
                            stroke="#dc2626"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        暂无趋势数据
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">平台分布</CardTitle>
                  <CardDescription>
                    按请求总量统计，不区分成功或失败。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(overview?.platformTotals || []).map((item) => (
                    <div
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      key={item.platform}
                    >
                      <span className="font-medium">
                        {formatPlatformLabel(item.platform)}
                      </span>
                      <span className="text-muted-foreground">{formatMetric(item.count)}</span>
                    </div>
                  ))}
                  {(overview?.platformTotals || []).length === 0 && (
                    <div className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                      暂无平台统计数据
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <ListFilter className="h-5 w-5" />
                请求明细
              </CardTitle>
              <RequestMetaBadges
                statusCode={requestsStatusCode}
                durationMs={requestsDurationMs}
                loading={requestsLoading}
              />
            </div>
            <CardDescription>
              支持平台、规范 URL 模糊搜索、解析域名候选筛选、状态、错误码、日期范围筛选；明细优先显示规范 URL，并保留原始输入便于排查短链和分享文案。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requestsError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {requestsError}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="platform-filter">平台</Label>
                <Select
                  value={platform}
                  onValueChange={(value: 'all' | MonitorPlatform) => {
                    setPlatform(value);
                    setPage(1);
                    setRequestDomainPage(1);
                  }}
                >
                  <SelectTrigger id="platform-filter">
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-source-filter">规范 URL</Label>
                <Input
                  id="request-source-filter"
                  placeholder="模糊搜索规范 URL，如: bilibili.com/video"
                  value={urlFilter}
                  onChange={(event) => {
                    setUrlFilter(event.target.value);
                    setPage(1);
                    setRequestDomainPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-domain-filter">搜索解析域名</Label>
                <Input
                  id="request-domain-filter"
                  placeholder="模糊搜索解析域名，如: bili、douyin"
                  value={requestDomainSearch}
                  onChange={(event) => {
                    setRequestDomainSearch(event.target.value);
                    setRequestDomainPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-status-filter">状态</Label>
                <Select
                  value={requestStatus}
                  onValueChange={(value: RequestStatusFilter) => {
                    setRequestStatus(value);
                    if (value === 'success') {
                      setErrorCode('');
                    }
                    setPage(1);
                    setRequestDomainPage(1);
                  }}
                >
                  <SelectTrigger id="request-status-filter">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">开始日期</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setPage(1);
                    setRequestDomainPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">结束日期</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setPage(1);
                    setRequestDomainPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="error-code">错误码</Label>
                <Input
                  id="error-code"
                  placeholder="如: RATE_LIMITED"
                  value={errorCode}
                  disabled={requestStatus === 'success'}
                  onChange={(event) => {
                    setErrorCode(event.target.value);
                    setPage(1);
                    setRequestDomainPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-size">每页数量</Label>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2 md:col-span-2 xl:col-span-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  重置筛选
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm">解析域名候选</Label>
                <RequestMetaBadges
                  statusCode={requestDomainsStatusCode}
                  durationMs={requestDomainsDurationMs}
                  loading={requestDomainsLoading || requestDomainMetricsLoading}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  候选列表按当前平台、规范 URL、日期范围、状态和错误码分页查询；卡片指标展示域名全量数据。
                </span>
                {requestDomainFilter && (
                  <Badge variant="outline">
                    已选: {formatRequestDomain(requestDomainFilter)}
                  </Badge>
                )}
                {requestDomainFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setRequestDomainFilter('');
                      setPage(1);
                    }}
                  >
                    清除解析域名筛选
                  </Button>
                )}
              </div>
              {requestDomainsError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {requestDomainsError}
                </div>
              )}
              {requestDomainMetricsError && (
                <div className="rounded-md border border-amber-300/60 bg-amber-100/40 px-3 py-2 text-sm text-amber-900 dark:border-amber-600/30 dark:bg-amber-900/20 dark:text-amber-200">
                  域名全量指标存在部分加载失败: {requestDomainMetricsError}
                </div>
              )}
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {requestDomains.items.map((item) => {
                  const active =
                    normalizedSharedFilter.requestDomain === item.requestDomain;
                  const metricItem = shouldLoadRequestDomainMetrics
                    ? requestDomainMetrics[item.requestDomain]
                    : item;
                  const domainStatus = resolveRequestDomainStatus(
                    metricItem?.successCount ?? item.successCount,
                    metricItem?.failureCount ?? item.failureCount,
                  );
                  return (
                    <button
                      type="button"
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/40'
                      }`}
                      key={item.requestDomain}
                      onClick={() => {
                        setRequestDomainFilter(
                          active ? '' : item.requestDomain,
                        );
                        setPage(1);
                      }}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="truncate font-medium">
                          {formatRequestDomain(item.requestDomain)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>成功 {formatMetric(metricItem?.successCount)}</span>
                          <span>
                            失败 {formatMetric(metricItem?.failureCount ?? item.failureCount)}
                          </span>
                          <span>总计 {formatMetric(metricItem?.total)}</span>
                        </div>
                      </div>
                      <span className="ml-3 shrink-0">
                        <Badge variant={getAggregateStatusVariant(domainStatus)}>
                          {getAggregateStatusLabel(domainStatus)}
                        </Badge>
                      </span>
                    </button>
                  );
                })}
                {requestDomains.items.length === 0 && (
                  <div className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                    {requestDomainsLoading ? '解析域名候选加载中...' : '暂无匹配的解析域名'}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <div>
                  当前第 {requestDomains.pagination.page} 页，共{' '}
                  {requestDomainTotalPages} 页，合计{' '}
                  {formatMetric(requestDomains.pagination.total)} 个解析域名
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={requestDomainsLoading || requestDomainPage <= 1}
                    onClick={() =>
                      setRequestDomainPage((prev) => Math.max(1, prev - 1))
                    }
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      requestDomainsLoading ||
                      requestDomainPage >= requestDomainTotalPages
                    }
                    onClick={() =>
                      setRequestDomainPage((prev) =>
                        Math.min(requestDomainTotalPages, prev + 1),
                      )
                    }
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>规范 URL</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>平台</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>错误码</TableHead>
                    <TableHead>请求ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center">
                        请求明细加载中...
                      </TableCell>
                    </TableRow>
                  ) : requests.items.length > 0 ? (
                    requests.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-[320px] text-xs">
                          <div className="space-y-1">
                            <div className="truncate font-medium">
                              {item.url || '-'}
                            </div>
                            {item.rawUrl && item.rawUrl !== item.url && (
                              <div className="truncate text-[11px] text-muted-foreground">
                                原始输入: {item.rawUrl}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(item.timestamp)}
                        </TableCell>
                        <TableCell>{item.platform}</TableCell>
                        <TableCell>
                          <Badge variant={item.success ? 'default' : 'destructive'}>
                            {item.success ? '成功' : '失败'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.errorCode ? (
                            <Badge variant="outline">{item.errorCode}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.requestId}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center">
                        暂无请求明细
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                当前第 {requests.pagination.page} 页，共 {totalPages} 页，合计{' '}
                {formatMetric(requests.pagination.total)} 条
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={requestsLoading || page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={requestsLoading || page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                反馈展示
              </CardTitle>
              <RequestMetaBadges
                statusCode={feedbackStatusCode}
                durationMs={feedbackDurationMs}
                loading={feedbackLoading}
              />
            </div>
            <CardDescription>
              展示下载器反馈内容、联系方式和前端采集的浏览器/系统诊断信息。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedbackError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {feedbackError}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="feedback-type-filter">类型</Label>
                <Select
                  value={feedbackType}
                  onValueChange={(value: FeedbackTypeFilter) => {
                    setFeedbackType(value);
                    setFeedbackPage(1);
                  }}
                >
                  <SelectTrigger id="feedback-type-filter">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_TYPE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-status-filter">状态</Label>
                <Select
                  value={feedbackStatus}
                  onValueChange={(value: FeedbackStatusFilter) => {
                    setFeedbackStatus(value);
                    setFeedbackPage(1);
                  }}
                >
                  <SelectTrigger id="feedback-status-filter">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-search">关键词</Label>
                <Input
                  id="feedback-search"
                  placeholder="搜索内容或邮箱"
                  value={feedbackSearch}
                  onChange={(event) => {
                    setFeedbackSearch(event.target.value);
                    setFeedbackPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-start-date">开始日期</Label>
                <Input
                  id="feedback-start-date"
                  type="date"
                  value={feedbackStartDate}
                  onChange={(event) => {
                    setFeedbackStartDate(event.target.value);
                    setFeedbackPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-end-date">结束日期</Label>
                <Input
                  id="feedback-end-date"
                  type="date"
                  value={feedbackEndDate}
                  onChange={(event) => {
                    setFeedbackEndDate(event.target.value);
                    setFeedbackPage(1);
                  }}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>反馈内容</TableHead>
                    <TableHead>联系邮箱</TableHead>
                    <TableHead>浏览器 / 系统</TableHead>
                    <TableHead>请求ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center">
                        反馈加载中...
                      </TableCell>
                    </TableRow>
                  ) : feedback.items.length > 0 ? (
                    feedback.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatFeedbackTypeLabel(item.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getFeedbackStatusVariant(item.status)}>
                            {formatFeedbackStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[260px] max-w-[420px] text-sm">
                          <div className="space-y-2">
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {item.content || '-'}
                            </p>
                            {(item.referer || item.sourceOrigin) && (
                              <p className="truncate text-xs text-muted-foreground">
                                来源: {item.referer || item.sourceOrigin}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.contactEmail || '-'}
                        </TableCell>
                        <TableCell className="min-w-[220px] max-w-[320px] text-xs">
                          <div className="space-y-1">
                            <div className="break-words">
                              {formatFeedbackDeviceSummary(
                                item.metadata,
                                item.userAgent,
                              )}
                            </div>
                            {item.metadata && (
                              <details className="text-muted-foreground">
                                <summary className="cursor-pointer">
                                  诊断详情
                                </summary>
                                <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-[11px]">
                                  {JSON.stringify(item.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.requestId}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center">
                        暂无反馈
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                当前第 {feedback.pagination.page} 页，共 {feedbackTotalPages} 页，合计{' '}
                {formatMetric(feedback.pagination.total)} 条
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={feedbackLoading || feedbackPage <= 1}
                  onClick={() => setFeedbackPage((prev) => Math.max(1, prev - 1))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={feedbackLoading || feedbackPage >= feedbackTotalPages}
                  onClick={() =>
                    setFeedbackPage((prev) =>
                      Math.min(feedbackTotalPages, prev + 1),
                    )
                  }
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {(healthError || aggregateError || requestsError || feedbackError) && (
          <div className="rounded-md border border-amber-300/60 bg-amber-100/40 px-4 py-3 text-sm text-amber-900 dark:border-amber-600/30 dark:bg-amber-900/20 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">存在部分请求失败</p>
                <p className="mt-1 text-xs">
                  可先检查服务端环境变量、筛选条件与上游服务可用性；错误详情已在各区块显示。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
