'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    ChartColumnIncreasing,
    CheckCircle2,
    Clock3,
    RefreshCw,
    Server,
    ShieldAlert,
} from 'lucide-react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { usePermission } from '@/hooks/usePermission';
import {
    fetchAdminDaily,
    fetchAdminFailures,
    fetchAdminOverview,
    fetchHealth,
    type DailyStatPoint,
    type FailureQuery,
    type FailureStatsData,
    type HealthResponse,
    type MonitorPlatform,
    type OverviewStatsData,
    MonitorApiError,
    normalizeHealthData,
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

const AUTO_REFRESH_INTERVAL_MS = 30_000;
const SLOW_REQUEST_MS = 1_500;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
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

const numberFormatter = new Intl.NumberFormat('zh-CN');

const emptyFailures: FailureStatsData = {
    items: [],
    pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
    },
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
    const [dailyStats, setDailyStats] = useState<DailyStatPoint[]>([]);
    const [failures, setFailures] = useState<FailureStatsData>(emptyFailures);

    const [healthLoading, setHealthLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [failuresLoading, setFailuresLoading] = useState(false);

    const [healthError, setHealthError] = useState<string | null>(null);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [failuresError, setFailuresError] = useState<string | null>(null);
    const [healthStatusCode, setHealthStatusCode] = useState<number | null>(null);
    const [statsStatusCode, setStatsStatusCode] = useState<number | null>(null);
    const [failuresStatusCode, setFailuresStatusCode] = useState<number | null>(null);
    const [healthDurationMs, setHealthDurationMs] = useState<number | null>(null);
    const [statsDurationMs, setStatsDurationMs] = useState<number | null>(null);
    const [failuresDurationMs, setFailuresDurationMs] = useState<number | null>(null);

    const [platform, setPlatform] = useState<'all' | MonitorPlatform>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(20);
    const [includeUrl, setIncludeUrl] = useState(false);

    const normalizedFilter = useMemo(() => {
        return {
            platform: platform === 'all' ? undefined : platform,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        };
    }, [platform, startDate, endDate]);

    const failureQuery = useMemo<FailureQuery>(() => {
        return {
            platform: normalizedFilter.platform,
            startDate: normalizedFilter.startDate,
            endDate: normalizedFilter.endDate,
            page,
            pageSize,
            errorCode: errorCode.trim() || undefined,
            includeUrl,
        };
    }, [normalizedFilter, page, pageSize, errorCode, includeUrl]);

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

    const loadOverviewAndDaily = useCallback(
        async (query: Pick<FailureQuery, 'platform' | 'startDate' | 'endDate'>) => {
            const startTime = getRequestStartTime();
            setStatsLoading(true);
            setStatsError(null);

            try {
                const [overviewResult, dailyResult] = await Promise.all([
                    fetchAdminOverview(query),
                    fetchAdminDaily(query),
                ]);
                setOverview(overviewResult);
                setDailyStats(dailyResult);
                setStatsStatusCode(200);
                setLastUpdatedAt(new Date().toISOString());
            } catch (error) {
                setOverview(null);
                setDailyStats([]);
                setStatsStatusCode(error instanceof MonitorApiError ? error.status : null);
                setStatsError(formatErrorMessage(error));
            } finally {
                setStatsLoading(false);
                setStatsDurationMs(getRequestDuration(startTime));
            }
        },
        [],
    );

    const loadFailures = useCallback(async (query: FailureQuery) => {
        const startTime = getRequestStartTime();
        setFailuresLoading(true);
        setFailuresError(null);

        try {
            const result = await fetchAdminFailures(query);
            setFailures(result);
            setFailuresStatusCode(200);
            setLastUpdatedAt(new Date().toISOString());
        } catch (error) {
            setFailures(emptyFailures);
            setFailuresStatusCode(error instanceof MonitorApiError ? error.status : null);
            setFailuresError(formatErrorMessage(error));
        } finally {
            setFailuresLoading(false);
            setFailuresDurationMs(getRequestDuration(startTime));
        }
    }, []);

    useEffect(() => {
        void loadHealth();
    }, [loadHealth, refreshTick]);

    useEffect(() => {
        void loadOverviewAndDaily(normalizedFilter);
    }, [loadOverviewAndDaily, normalizedFilter, refreshTick]);

    useEffect(() => {
        void loadFailures(failureQuery);
    }, [failureQuery, loadFailures, refreshTick]);

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

    const totalPages = Math.max(1, failures.pagination.totalPages || 1);

    const handleRefreshAll = () => {
        setRefreshTick((prev) => prev + 1);
    };

    const handleResetFilters = () => {
        setPlatform('all');
        setStartDate('');
        setEndDate('');
        setErrorCode('');
        setPage(1);
        setPageSize(20);
        setIncludeUrl(false);
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
                            同时接入 /api/health 与 /api/admin/stats，管理员统计密钥由服务端环境变量提供。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <Button
                                variant="outline"
                                onClick={handleRefreshAll}
                                disabled={healthLoading || statsLoading || failuresLoading}
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
                                statusCode={statsStatusCode}
                                durationMs={statsDurationMs}
                                loading={statsLoading}
                            />
                        </div>
                        <CardDescription>
                            概览与按日趋势由服务端代理请求上游统计接口，并跟随当前筛选条件刷新。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {statsError && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {statsError}
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard
                                title="累计成功"
                                value={overview?.summary.totalSuccessCount || 0}
                                subtitle="全量成功解析次数"
                            />
                            <MetricCard
                                title="今日成功"
                                value={overview?.summary.todaySuccessCount || 0}
                                subtitle="当日成功解析次数"
                            />
                            <MetricCard
                                title="累计失败"
                                value={overview?.summary.totalFailureCount || 0}
                                subtitle="全量失败解析次数"
                            />
                            <MetricCard
                                title="近期失败"
                                value={overview?.summary.recentFailureCount || 0}
                                subtitle="最近时间窗口失败次数"
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-base">按日趋势</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[280px] w-full">
                                        {statsLoading ? (
                                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                                趋势数据加载中...
                                            </div>
                                        ) : dailyStats.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={dailyStats}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis allowDecimals={false} />
                                                    <RechartsTooltip />
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
                                            </ResponsiveContainer>
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
                                <ShieldAlert className="h-5 w-5" />
                                失败日志
                            </CardTitle>
                            <RequestMetaBadges
                                statusCode={failuresStatusCode}
                                durationMs={failuresDurationMs}
                                loading={failuresLoading}
                            />
                        </div>
                        <CardDescription>
                            支持平台、日期范围、错误码筛选，默认不返回原始 URL。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {failuresError && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {failuresError}
                            </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

                            <div className="flex items-end gap-2">
                                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                                    <Checkbox
                                        id="include-url"
                                        checked={includeUrl}
                                        onCheckedChange={(checked) => {
                                            setIncludeUrl(checked === true);
                                            setPage(1);
                                        }}
                                    />
                                    <Label htmlFor="include-url" className="cursor-pointer font-normal">
                                        返回原始 URL
                                    </Label>
                                </div>
                                <Button variant="outline" onClick={handleResetFilters}>
                                    重置筛选
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>时间</TableHead>
                                        <TableHead>平台</TableHead>
                                        <TableHead>错误码</TableHead>
                                        <TableHead>消息</TableHead>
                                        <TableHead>请求ID</TableHead>
                                        {includeUrl && <TableHead>URL</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {failuresLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={includeUrl ? 6 : 5} className="h-20 text-center">
                                                日志加载中...
                                            </TableCell>
                                        </TableRow>
                                    ) : failures.items.length > 0 ? (
                                        failures.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                    {formatDateTime(item.timestamp)}
                                                </TableCell>
                                                <TableCell>{item.platform}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.errorCode}</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[360px] truncate">{item.message}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {item.requestId}
                                                </TableCell>
                                                {includeUrl && (
                                                    <TableCell className="max-w-[300px] truncate text-xs">
                                                        {item.url || '-'}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={includeUrl ? 6 : 5} className="h-20 text-center">
                                                暂无失败日志
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                            <div className="inline-flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                当前第 {failures.pagination.page} 页，共 {totalPages} 页，合计{' '}
                                {formatMetric(failures.pagination.total)} 条
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={failuresLoading || page <= 1}
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                >
                                    上一页
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={failuresLoading || page >= totalPages}
                                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                >
                                    下一页
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {(healthError || statsError || failuresError) && (
                    <div className="rounded-md border border-amber-300/60 bg-amber-100/40 px-4 py-3 text-sm text-amber-900 dark:border-amber-600/30 dark:bg-amber-900/20 dark:text-amber-200">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <div>
                                <p className="font-medium">存在部分请求失败</p>
                                <p className="mt-1 text-xs">
                                    可先检查服务端环境变量、日期筛选范围和上游服务可用性；错误详情已在各区块显示。
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
