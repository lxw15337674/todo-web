import { describe, expect, it } from 'vitest';

import { aggregateAdminRequests } from './aggregation';
import { normalizeAggregateData, normalizeRequestStats } from './index';

describe('aggregateAdminRequests', () => {
  it('builds summary, platform totals, daily stats and url rankings', () => {
    const result = aggregateAdminRequests(
      [
        {
          timestamp: '2026-03-28T10:00:00.000Z',
          platform: 'douyin',
          requestSource: 'todo.bhwa233.com',
          url: 'https://www.douyin.com/video/1',
          success: true,
        },
        {
          timestamp: '2026-03-28T11:00:00.000Z',
          platform: 'douyin',
          requestSource: 'todo.bhwa233.com',
          url: 'https://www.douyin.com/video/1',
          success: false,
        },
        {
          timestamp: '2026-03-27T08:00:00.000Z',
          platform: 'bilibili',
          requestSource: 'chat.bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/2',
          success: true,
        },
        {
          timestamp: '2026-03-28T09:00:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'chat.bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/3',
          success: false,
        },
        {
          timestamp: '2026-03-28T09:30:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'chat.bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/3',
          success: false,
        },
        {
          timestamp: '2026-03-28T09:50:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'chat.bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/3',
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
      totalSuccessCount: 3,
      todaySuccessCount: 2,
      totalFailureCount: 3,
      recentFailureCount: 3,
    });
    expect(result.platformTotals).toEqual([
      { platform: 'bilibili_tv', count: 3 },
      { platform: 'douyin', count: 2 },
      { platform: 'bilibili', count: 1 },
    ]);
    expect(result.recentDailyStats).toEqual([
      { date: '2026-03-27', successCount: 1, failureCount: 0 },
      { date: '2026-03-28', successCount: 2, failureCount: 3 },
    ]);
    expect(result.urlTopN).toEqual([
      {
        url: 'https://www.bilibili.tv/en/video/3',
        count: 3,
        successCount: 1,
        failureCount: 2,
        lastSeenAt: '2026-03-28T09:50:00.000Z',
        status: 'degraded',
      },
      {
        url: 'https://www.douyin.com/video/1',
        count: 2,
        successCount: 1,
        failureCount: 1,
        lastSeenAt: '2026-03-28T11:00:00.000Z',
        status: 'degraded',
      },
      {
        url: 'https://www.bilibili.tv/en/video/2',
        count: 1,
        successCount: 1,
        failureCount: 0,
        lastSeenAt: '2026-03-27T08:00:00.000Z',
        status: 'ok',
      },
    ]);
  });

  it('marks urls with repeated failures as down', () => {
    const result = aggregateAdminRequests(
      [
        {
          timestamp: '2026-03-28T08:00:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'todo.bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/9',
          success: false,
        },
        {
          timestamp: '2026-03-28T08:10:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'todo.bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/9',
          success: false,
        },
        {
          timestamp: '2026-03-28T08:20:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'todo.bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/9',
          success: false,
        },
      ],
      {
        now: new Date('2026-03-28T12:00:00.000Z'),
      },
    );

    expect(result.urlTopN).toEqual([
      {
        url: 'https://www.bilibili.tv/en/video/9',
        count: 3,
        successCount: 0,
        failureCount: 3,
        lastSeenAt: '2026-03-28T08:20:00.000Z',
        status: 'down',
      },
    ]);
  });
});

describe('normalizeAggregateData', () => {
  it('maps url rankings from aggregate payload', () => {
    const result = normalizeAggregateData({
      summary: {
        totalSuccessCount: 1200,
        todaySuccessCount: 86,
        totalFailureCount: 32,
        recentFailureCount: 5,
      },
      platformTotals: [{ platform: 'bilibili', count: 560 }],
      recentDailyStats: [{ date: '2026-03-22', successCount: 95, failureCount: 2 }],
      urlTopN: [
        {
          url: 'https://www.bilibili.tv/en/video/4798982132210688',
          count: 120,
          successCount: 110,
          failureCount: 10,
          lastSeenAt: '2026-03-28T12:00:00.000Z',
          status: 'degraded',
        },
      ],
    });

    expect(result.urlTopN).toEqual([
      {
        url: 'https://www.bilibili.tv/en/video/4798982132210688',
        count: 120,
        successCount: 110,
        failureCount: 10,
        lastSeenAt: '2026-03-28T12:00:00.000Z',
        status: 'degraded',
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
          url: 'https://www.douyin.com/video/1',
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
      url: 'https://www.douyin.com/video/1',
      requestSource: 'todo.bhwa233.com',
      success: false,
    });
  });
});
