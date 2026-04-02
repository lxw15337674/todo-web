import { describe, expect, it } from 'vitest';

import { aggregateAdminRequests } from './aggregation';
import {
  normalizeAggregateData,
  normalizeRequestDomainStats,
  normalizeRequestStats,
} from './index';

describe('aggregateAdminRequests', () => {
  it('builds summary, platform totals, daily stats, url rankings and domain rankings', () => {
    const result = aggregateAdminRequests(
      [
        {
          timestamp: '2026-03-28T10:00:00.000Z',
          platform: 'douyin',
          requestSource: 'todo.bhwa233.com',
          requestDomain: 'bhwa233.com',
          url: 'https://www.douyin.com/video/1',
          success: true,
        },
        {
          timestamp: '2026-03-28T11:00:00.000Z',
          platform: 'douyin',
          requestSource: 'todo.bhwa233.com',
          requestDomain: 'bhwa233.com',
          url: 'https://www.douyin.com/video/1',
          success: false,
        },
        {
          timestamp: '2026-03-27T08:00:00.000Z',
          platform: 'bilibili',
          requestSource: 'chat.bhwa233.com',
          requestDomain: 'example.com',
          url: 'https://www.bilibili.tv/en/video/2',
          success: true,
        },
        {
          timestamp: '2026-03-28T09:00:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'chat.bhwa233.com',
          requestDomain: 'example.com',
          url: 'https://www.bilibili.tv/en/video/3',
          success: false,
        },
        {
          timestamp: '2026-03-28T09:30:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'chat.bhwa233.com',
          requestDomain: 'example.com',
          url: 'https://www.bilibili.tv/en/video/3',
          success: false,
        },
        {
          timestamp: '2026-03-28T09:50:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'chat.bhwa233.com',
          requestDomain: 'example.com',
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
    expect(result.requestDomainTopN).toEqual([
      {
        requestDomain: 'www.bilibili.tv',
        count: 4,
        successCount: 2,
        failureCount: 2,
        lastSeenAt: '2026-03-28T09:50:00.000Z',
        status: 'degraded',
      },
      {
        requestDomain: 'www.douyin.com',
        count: 2,
        successCount: 1,
        failureCount: 1,
        lastSeenAt: '2026-03-28T11:00:00.000Z',
        status: 'degraded',
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
          requestDomain: 'bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/9',
          success: false,
        },
        {
          timestamp: '2026-03-28T08:10:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'todo.bhwa233.com',
          requestDomain: 'bhwa233.com',
          url: 'https://www.bilibili.tv/en/video/9',
          success: false,
        },
        {
          timestamp: '2026-03-28T08:20:00.000Z',
          platform: 'bilibili_tv',
          requestSource: 'todo.bhwa233.com',
          requestDomain: 'bhwa233.com',
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
  it('maps url rankings and request domain rankings from aggregate payload', () => {
    const result = normalizeAggregateData({
      summary: {
        totalSuccessCount: 1200,
        todaySuccessCount: 86,
        totalFailureCount: 32,
        recentFailureCount: 5,
      },
      platformTotals: [{ platform: 'bilibili', count: 560 }],
      recentDailyStats: [
        { date: '2026-03-22', successCount: 95, failureCount: 2 },
      ],
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
      requestDomainTopN: [{ requestDomain: 'bhwa233.com', count: 120 }],
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
    expect(result.requestDomainTopN).toEqual([
      {
        requestDomain: 'bhwa233.com',
        count: 120,
        successCount: 0,
        failureCount: 0,
        lastSeenAt: '',
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
            requestHost: 'todo.bhwa233.com',
            requestDomain: 'bhwa233.com',
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
          requestHost: 'todo.bhwa233.com',
          requestDomain: 'bhwa233.com',
          success: false,
        },
      },
      { page: 1, pageSize: 20 },
    );

    expect(result.items[0]).toMatchObject({
      requestSource: 'todo.bhwa233.com',
      requestHost: 'todo.bhwa233.com',
      requestDomain: 'bhwa233.com',
      success: false,
      errorCode: 'PARSE_FAILED',
      message: '解析失败',
      requestId: 'req_123',
      url: 'https://www.douyin.com/video/1',
    });
    expect(result.filters).toMatchObject({
      url: 'https://www.douyin.com/video/1',
      requestSource: 'todo.bhwa233.com',
      requestHost: 'todo.bhwa233.com',
      requestDomain: 'bhwa233.com',
      success: false,
    });
  });
});

describe('normalizeRequestDomainStats', () => {
  it('maps aggregate domain rows and pagination from request payload', () => {
    const result = normalizeRequestDomainStats(
      {
        items: [
          {
            key: 'weibo.cn',
            requestDomain: 'weibo.cn',
            total: 8,
            successCount: 6,
            failureCount: 2,
            latestCreatedAt: '2026-03-28T10:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
        filters: {
          groupBy: 'domain',
          sortBy: 'count',
          sortOrder: 'desc',
          requestDomain: 'weibo.cn',
          q: 'wei',
        },
      },
      { page: 1, pageSize: 20 },
    );

    expect(result.items[0]).toMatchObject({
      key: 'weibo.cn',
      requestDomain: 'weibo.cn',
      total: 8,
      successCount: 6,
      failureCount: 2,
      latestCreatedAt: '2026-03-28T10:00:00.000Z',
    });
    expect(result.filters).toMatchObject({
      groupBy: 'domain',
      sortBy: 'count',
      sortOrder: 'desc',
      requestDomain: 'weibo.cn',
      q: 'wei',
    });
  });

  it('maps aggregate host rows when requestDomain is absent', () => {
    const result = normalizeRequestDomainStats(
      {
        items: [
          {
            key: 'unknown',
            requestHost: 'unknown',
            total: 22,
            successCount: 4,
            failureCount: 18,
            latestCreatedAt: '2026-03-31T14:24:49.657Z',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
        filters: {
          groupBy: 'host',
          sortBy: 'count',
          sortOrder: 'desc',
          requestSource: 'unknown',
        },
      },
      { page: 1, pageSize: 20 },
    );

    expect(result.items[0]).toMatchObject({
      key: 'unknown',
      requestHost: 'unknown',
      requestDomain: 'unknown',
      total: 22,
      successCount: 4,
      failureCount: 18,
    });
    expect(result.filters).toMatchObject({
      groupBy: 'host',
      requestSource: 'unknown',
    });
  });
});
