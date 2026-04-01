'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChartColumnIncreasing,
  CheckCircle2,
  Clock3,
  ListFilter,
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
  fetchAdminAggregate,
  fetchAdminRequests,
  fetchHealth,
  type AggregateQuery,
  type HealthResponse,
  type MonitorPlatform,
  MonitorApiError,
  normalizeHealthData,
  type OverviewStatsData,
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
const REQUEST_STATUS_OPTIONS = [
  { label: '全部状态', value: 'all' },
  { label: '仅成功', value: 'success' },
  { label: '仅失败', value: 'failure' },
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
const PLATFORM_OPTIONS: Array<{ label: string; value: 'all' | MonitorPlatform }> = [
  { label: '全部平台', value: 'all' },
  { label: 'Bilibili', value: 'bilibili' },
  { label: 'Bilibili TV', value: 'bilibili_tv' },
  { label: '抖音', value: 'douyin' },
  { label: 'Instagram', value: 'instagram' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'X / Twitter', value: 'x' },
  { label: '未知平台', value: 'unknown' },
];

type RequestStatusFilter = (typeof REQUEST_STATUS_OPTIONS)[number]['value'];

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

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [overview, setOverview] = useState<OverviewStatsData | null>(null);
  const [requests, setRequests] = useState<RequestStatsData>(emptyRequests);

  const [healthLoading, setHealthLoading] = useState(false);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [healthError, setHealthError] = useState<string | null>(null);
  const [aggregateError, setAggregateError] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [healthStatusCode, setHealthStatusCode] = useState<number | null>(null);
  const [aggregateStatusCode, setAggregateStatusCode] = useState<number | null>(null);
  const [requestsStatusCode, setRequestsStatusCode] = useState<number | null>(null);
  const [healthDurationMs, setHealthDurationMs] = useState<number | null>(null);
  const [aggregateDurationMs, setAggregateDurationMs] = useState<number | null>(null);
  const [requestsDurationMs, setRequestsDurationMs] = useState<number | null>(null);

  const [platform, setPlatform] = useState<'all' | MonitorPlatform>('all');
  const [urlFilter, setUrlFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requestStatus, setRequestStatus] = useState<RequestStatusFilter>('failure');
  const [errorCode, setErrorCode] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const normalizedSharedFilter = useMemo(() => {
    return {
      platform: platform === 'all' ? undefined : platform,
      url: urlFilter.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }, [platform, urlFilter, startDate, endDate]);

  const aggregateQuery = useMemo<AggregateQuery>(() => {
    return {
      ...normalizedSharedFilter,
    };
  }, [normalizedSharedFilter]);

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

  useEffect(() => {
    void loadHealth();
  }, [loadHealth, refreshTick]);

  useEffect(() => {
    void loadAggregate(aggregateQuery);
  }, [loadAggregate, aggregateQuery, refreshTick]);

  useEffect(() => {
    void loadRequests(requestsQuery);
  }, [loadRequests, refreshTick, requestsQuery]);

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

  const handleRefreshAll = () => {
    setRefreshTick((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setPlatform('all');
    setUrlFilter('');
    setStartDate('');
    setEndDate('');
    setRequestStatus('failure');
    setErrorCode('');
    setPage(1);
    setPageSize(20);
  };

  const healthStatusText = health?.status || 'unknown';
  const isHealthy = healthStatusText.toLowerCase().includes('healthy');
  const trendData = overview?.recentDailyStats || [];

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
                disabled={healthLoading || aggregateLoading || requestsLoading}
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
                  {item}
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
              保留当前概览卡片和按日趋势，底层改为基于请求明细接口聚合，并随共享筛选条件刷新。
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
                  <CardTitle className="text-base">按日趋势</CardTitle>
                  <CardDescription>
                    支持按解析 URL 筛选后查看该地址近 7 天请求走势。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full">
                    {aggregateLoading ? (
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
                      <span className="font-medium">{item.platform}</span>
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
              支持平台、解析 URL、状态、错误码、日期范围筛选，用于定位哪条解析目标最容易触发失败。
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
                  }}
                >
                  <SelectTrigger id="platform-filter">
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-source-filter">解析 URL</Label>
                <Input
                  id="request-source-filter"
                  placeholder="如: https://www.bilibili.tv/en/video/4798982132210688"
                  value={urlFilter}
                  onChange={(event) => {
                    setUrlFilter(event.target.value);
                    setPage(1);
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
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
                        <TableCell className="max-w-[300px] truncate text-xs">
                          {item.url || '-'}
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

        {(healthError || aggregateError || requestsError) && (
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
