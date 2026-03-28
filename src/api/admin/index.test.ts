import { describe, expect, it } from 'vitest';

import {
  normalizeDailyStats,
  normalizeFailureStats,
  normalizeOverviewData,
} from './index';

describe('normalizeDailyStats', () => {
  it('aggregates per-platform count items into daily success totals', () => {
    const result = normalizeDailyStats({
      items: [
        { date: '2026-03-28', platform: 'bilibili', count: 121 },
        { date: '2026-03-28', platform: 'douyin', count: 128 },
        { date: '2026-03-27', platform: 'bilibili', count: 1014 },
        { date: '2026-03-27', platform: 'douyin', count: 731 },
      ],
    });

    expect(result).toEqual([
      {
        date: '2026-03-27',
        successCount: 1745,
        failureCount: 0,
      },
      {
        date: '2026-03-28',
        successCount: 249,
        failureCount: 0,
      },
    ]);
  });

  it('preserves aggregated daily stats when success and failure counts already exist', () => {
    const result = normalizeDailyStats({
      recentDailyStats: [
        { date: '2026-03-27', successCount: 1936, failureCount: 0 },
        { date: '2026-03-28', successCount: 256, failureCount: 1 },
      ],
    });

    expect(result).toEqual([
      {
        date: '2026-03-27',
        successCount: 1936,
        failureCount: 0,
      },
      {
        date: '2026-03-28',
        successCount: 256,
        failureCount: 1,
      },
    ]);
  });
});

describe('normalizeOverviewData', () => {
  it('maps source domain rankings from overview payload', () => {
    const result = normalizeOverviewData({
      summary: {
        totalSuccessCount: 1200,
        todaySuccessCount: 86,
        totalFailureCount: 32,
        recentFailureCount: 5,
      },
      platformTotals: [{ platform: 'bilibili', count: 560 }],
      recentDailyStats: [{ date: '2026-03-22', successCount: 95, failureCount: 2 }],
      sourceDomainTopN: [{ sourceDomain: 'todo.bhwa233.com', count: 120 }],
    });

    expect(result.sourceDomainTopN).toEqual([
      {
        sourceDomain: 'todo.bhwa233.com',
        count: 120,
      },
    ]);
  });
});

describe('normalizeFailureStats', () => {
  it('maps source domain on failure log rows', () => {
    const result = normalizeFailureStats(
      {
        items: [
          {
            id: 'log_1',
            createdAt: '2026-03-28T02:00:00.000Z',
            platform: 'douyin',
            sourceDomain: 'todo.bhwa233.com',
            errorCode: 'PARSE_FAILED',
            errorMessage: '解析失败',
            requestId: 'req_123',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      },
      { page: 1, pageSize: 20 },
    );

    expect(result.items[0]?.sourceDomain).toBe('todo.bhwa233.com');
  });
});
