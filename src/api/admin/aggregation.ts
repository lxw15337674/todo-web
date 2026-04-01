export type AggregationInputItem = {
  timestamp: string;
  platform: string;
  requestSource: string;
  requestDomain?: string;
  url?: string;
  success: boolean;
};

export type UrlAggregateStatus = 'ok' | 'degraded' | 'down';

export type AggregatedOverviewData = {
  summary: {
    totalSuccessCount: number;
    todaySuccessCount: number;
    totalFailureCount: number;
    recentFailureCount: number;
  };
  platformTotals: Array<{
    platform: string;
    count: number;
  }>;
  recentDailyStats: Array<{
    date: string;
    successCount: number;
    failureCount: number;
  }>;
  urlTopN: Array<{
    url: string;
    count: number;
    successCount: number;
    failureCount: number;
    lastSeenAt: string;
    status: UrlAggregateStatus;
  }>;
  requestDomainTopN: Array<{
    requestDomain: string;
    count: number;
  }>;
};

type AggregateAdminRequestsOptions = {
  startDate?: string;
  endDate?: string;
  topN?: number;
  now?: Date;
};

const DEFAULT_TOP_N = 10;
const DEFAULT_RECENT_DAYS = 7;
const DOWN_FAILURE_THRESHOLD = 3;

const resolveUrlAggregateStatus = (
  successCount: number,
  failureCount: number,
): UrlAggregateStatus => {
  if (failureCount === 0) {
    return 'ok';
  }

  if (successCount === 0 && failureCount >= DOWN_FAILURE_THRESHOLD) {
    return 'down';
  }

  return 'degraded';
};

const toDateKey = (value: string) => value.slice(0, 10);

const getDateKey = (now = new Date()) => now.toISOString().slice(0, 10);

const getDateKeyDaysAgo = (daysAgo: number, now = new Date()) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return getDateKey(date);
};

const buildDateRange = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

const resolveSeriesDates = (
  items: AggregationInputItem[],
  options: AggregateAdminRequestsOptions,
) => {
  if (options.startDate && options.endDate) {
    return buildDateRange(options.startDate, options.endDate);
  }

  if (options.startDate) {
    return buildDateRange(options.startDate, getDateKey(options.now));
  }

  if (options.endDate) {
    const end = new Date(`${options.endDate}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() - (DEFAULT_RECENT_DAYS - 1));
    return buildDateRange(end.toISOString().slice(0, 10), options.endDate);
  }

  if (items.length === 0) {
    const now = options.now ?? new Date();
    return Array.from({ length: DEFAULT_RECENT_DAYS }, (_, index) =>
      getDateKeyDaysAgo(DEFAULT_RECENT_DAYS - index - 1, now),
    );
  }

  const itemDates = items
    .map((item) => toDateKey(item.timestamp))
    .filter((value) => value.length === 10)
    .sort((left, right) => left.localeCompare(right));

  const latestDate = itemDates[itemDates.length - 1] ?? getDateKey(options.now);
  const end = new Date(`${latestDate}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() - (DEFAULT_RECENT_DAYS - 1));

  return buildDateRange(end.toISOString().slice(0, 10), latestDate);
};

export const aggregateAdminRequests = (
  items: AggregationInputItem[],
  options: AggregateAdminRequestsOptions = {},
): AggregatedOverviewData => {
  const now = options.now ?? new Date();
  const today = getDateKey(now);
  const recentFailureStart = getDateKeyDaysAgo(DEFAULT_RECENT_DAYS - 1, now);
  const topN = Math.max(1, options.topN ?? DEFAULT_TOP_N);

  const platformCounts = new Map<string, number>();
  const requestDomainCounts = new Map<string, number>();
  const urlAggregateMap = new Map<
    string,
    {
      url: string;
      count: number;
      successCount: number;
      failureCount: number;
      lastSeenAt: string;
    }
  >();
  const successByDate = new Map<string, number>();
  const failureByDate = new Map<string, number>();

  let totalSuccessCount = 0;
  let todaySuccessCount = 0;
  let totalFailureCount = 0;
  let recentFailureCount = 0;

  items.forEach((item) => {
    const dateKey = toDateKey(item.timestamp);

    platformCounts.set(
      item.platform,
      (platformCounts.get(item.platform) ?? 0) + 1,
    );

    const normalizedDomain = item.requestDomain?.trim() || item.requestSource.trim();
    if (normalizedDomain) {
      requestDomainCounts.set(
        normalizedDomain,
        (requestDomainCounts.get(normalizedDomain) ?? 0) + 1,
      );
    }

    const normalizedUrl = item.url?.trim();
    if (normalizedUrl) {
      const urlAggregate = urlAggregateMap.get(normalizedUrl) ?? {
        url: normalizedUrl,
        count: 0,
        successCount: 0,
        failureCount: 0,
        lastSeenAt: item.timestamp,
      };

      urlAggregate.count += 1;
      if (item.success) {
        urlAggregate.successCount += 1;
      } else {
        urlAggregate.failureCount += 1;
      }
      if (item.timestamp > urlAggregate.lastSeenAt) {
        urlAggregate.lastSeenAt = item.timestamp;
      }

      urlAggregateMap.set(normalizedUrl, urlAggregate);
    }

    if (item.success) {
      totalSuccessCount += 1;
      successByDate.set(dateKey, (successByDate.get(dateKey) ?? 0) + 1);

      if (dateKey === today) {
        todaySuccessCount += 1;
      }
      return;
    }

    totalFailureCount += 1;
    failureByDate.set(dateKey, (failureByDate.get(dateKey) ?? 0) + 1);

    if (dateKey >= recentFailureStart) {
      recentFailureCount += 1;
    }
  });

  const seriesDates = resolveSeriesDates(items, { ...options, now });

  return {
    summary: {
      totalSuccessCount,
      todaySuccessCount,
      totalFailureCount,
      recentFailureCount,
    },
    platformTotals: Array.from(platformCounts.entries())
      .map(([platform, count]) => ({ platform, count }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.platform.localeCompare(right.platform),
      ),
    recentDailyStats: seriesDates.map((date) => ({
      date,
      successCount: successByDate.get(date) ?? 0,
      failureCount: failureByDate.get(date) ?? 0,
    })),
    urlTopN: Array.from(urlAggregateMap.values())
      .map((item) => ({
        ...item,
        status: resolveUrlAggregateStatus(item.successCount, item.failureCount),
      }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          right.lastSeenAt.localeCompare(left.lastSeenAt) ||
          left.url.localeCompare(right.url),
      )
      .slice(0, topN),
    requestDomainTopN: Array.from(requestDomainCounts.entries())
      .map(([requestDomain, count]) => ({ requestDomain, count }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.requestDomain.localeCompare(right.requestDomain),
      )
      .slice(0, topN),
  };
};
