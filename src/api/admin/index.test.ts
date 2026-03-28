import { describe, expect, it } from 'vitest';

import { aggregateAdminRequests } from './aggregation';
import { normalizeAggregateData, normalizeRequestStats } from './index';

describe('aggregateAdminRequests', () => {
  it('builds summary, platform totals, daily stats and request source rankings', () => {
    const result = aggregateAdminRequests(
      [
        {
          timestamp: '2026-03-28T10:00:00.000Z',
          platform: 'douyin',
          requestSource: 'todo.bhwa233.com',
          success: true,
        },
        {
          timestamp: '2026-03-28T11:00:00.000Z',
          platform: 'douyin',
          requestSource: 'todo.bhwa233.com',
          success: false,
        },
        {
          timestamp: '2026-03-27T08:00:00.000Z',
          platform: 'bilibili',
          requestSource: 'chat.bhwa233.com',
          success: true,
        },
      ],
      {
        startDate: '2026-03-27',
        endDate: '2026-03-28',
        topN: 5,
        now: new Date('2026-03-28T12:00:00.000Z'),
      },
    );

    expect(result.summary).toEqual({
      totalSuccessCount: 2,
      todaySuccessCount: 1,
      totalFailureCount: 1,
      recentFailureCount: 1,
    });
    expect(result.platformTotals).toEqual([
      { platform: 'douyin', count: 2 },
      { platform: 'bilibili', count: 1 },
    ]);
    expect(result.recentDailyStats).toEqual([
      { date: '2026-03-27', successCount: 1, failureCount: 0 },
      { date: '2026-03-28', successCount: 1, failureCount: 1 },
    ]);
    expect(result.requestSourceTopN).toEqual([
      { requestSource: 'todo.bhwa233.com', count: 2 },
      { requestSource: 'chat.bhwa233.com', count: 1 },
    ]);
  });
});

describe('normalizeAggregateData', () => {
  it('maps request source rankings from aggregate payload', () => {
    const result = normalizeAggregateData({
      summary: {
        totalSuccessCount: 1200,
        todaySuccessCount: 86,
        totalFailureCount: 32,
        recentFailureCount: 5,
      },
      platformTotals: [{ platform: 'bilibili', count: 560 }],
      recentDailyStats: [{ date: '2026-03-22', successCount: 95, failureCount: 2 }],
      requestSourceTopN: [{ requestSource: 'todo.bhwa233.com', count: 120 }],
    });

    expect(result.requestSourceTopN).toEqual([
      {
        requestSource: 'todo.bhwa233.com',
        count: 120,
      },
    ]);
  });
});

describe('normalizeRequestStats', () => {
  it('maps request log rows and pagination from request payload', () => {
    const result = normalizeRequestStats(
      {
        items: [
          {
            id: 'req_log_1',
            createdAt: '2026-03-28T02:00:00.000Z',
            platform: 'douyin',
            requestSource: 'todo.bhwa233.com',
            success: false,
            errorCode: 'PARSE_FAILED',
            errorMessage: '解析失败',
            requestId: 'req_123',
            url: 'https://www.douyin.com/video/1',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
        filters: {
          requestSource: 'todo.bhwa233.com',
          success: false,
        },
      },
      { page: 1, pageSize: 20 },
    );

    expect(result.items[0]).toMatchObject({
      requestSource: 'todo.bhwa233.com',
      success: false,
      errorCode: 'PARSE_FAILED',
      message: '解析失败',
      requestId: 'req_123',
      url: 'https://www.douyin.com/video/1',
    });
    expect(result.filters).toMatchObject({
      requestSource: 'todo.bhwa233.com',
      success: false,
    });
  });
});
