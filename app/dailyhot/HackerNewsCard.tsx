import Image from 'next/image';
import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { Card } from '../../src/components/ui/card';
import { ScrollArea } from '../../src/components/ui/scroll-area';
import Link from 'next/link';

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// Hacker News API 数据类型
interface HackerNewsItem {
    id: number;
    title: string;
    url?: string;
    score: number;
    by: string;
    time: number;
    descendants?: number; // 评论数
    type: string;
}

interface HackerNewsCardProps {
    label: string;
    name: string;
}

// 格式化时间显示
const formatTime = (timestamp: number): string => {
    const date = dayjs.unix(timestamp);
    const now = dayjs();

    const diffInHours = now.diff(date, 'hour');

    if (diffInHours < 1) {
        const diffInMinutes = now.diff(date, 'minute');
        return diffInMinutes < 1 ? '刚刚' : `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
        return `${diffInHours}小时前`;
    } else {
        const diffInDays = now.diff(date, 'day');
        return diffInDays === 1 ? '昨天' : `${diffInDays}天前`;
    }
};

// 获取 Hacker News Top Stories
async function getHackerNewsStories(): Promise<HackerNewsItem[]> {
    try {
        // 步骤1: 获取 top stories 的 ID 列表
        const idsResponse = await fetch(
            'https://hacker-news.firebaseio.com/v0/topstories.json',
            {
                next: { revalidate: 600 } // 10分钟缓存
            }
        );

        if (!idsResponse.ok) {
            throw new Error(`Failed to fetch story IDs: ${idsResponse.status}`);
        }

        const ids: number[] = await idsResponse.json();

        // 只取前30条
        const topIds = ids.slice(0, 30);

        // 步骤2: 并行获取每个故事的详细信息
        const storyPromises = topIds.map(async (id) => {
            try {
                const response = await fetch(
                    `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
                    {
                        next: { revalidate: 600 }
                    }
                );

                if (!response.ok) {
                    return null;
                }

                return await response.json();
            } catch (error) {
                console.error(`Failed to fetch story ${id}:`, error);
                return null;
            }
        });

        const stories = await Promise.allSettled(storyPromises);

        // 过滤掉失败的请求和空值
        return stories
            .filter((result): result is PromiseFulfilledResult<HackerNewsItem> =>
                result.status === 'fulfilled' && result.value !== null
            )
            .map(result => result.value);

    } catch (error) {
        console.error('Failed to fetch Hacker News stories:', error);
        return [];
    }
}

const HackerNewsCard = async ({ label, name }: HackerNewsCardProps) => {
    const stories = await getHackerNewsStories();

    if (stories.length === 0) {
        return (
            <Card className="w-full max-w-2xl bg-zinc-900 text-white">
                <div className="p-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/logo/y18.svg"
                            alt="avatar"
                            loading="lazy"
                            width={24}
                            height={24}
                            style={{
                                height: 24
                            }}
                        />
                        <span className="font-bold">{label}</span>
                    </div>
                </div>
                <div className="h-[410px] flex items-center justify-center">
                    <div className="text-center text-red-500">
                        <p>数据加载失败</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl bg-zinc-900 text-white">
            <div className="p-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Image
                        src="/logo/y18.svg"
                        alt="avatar"
                        loading="lazy"
                        width={24}
                        height={24}
                        style={{
                            height: 24
                        }}
                    />
                    <span className="font-bold">{label}</span>
                </div>
            </div>
            <ScrollArea className="h-[410px]">
                <div className="divide-y divide-zinc-800">
                    {stories.map((story, index) => (
                        <div
                            key={story.id}
                            className="flex items-start gap-4 p-2 hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-1">
                                <span className="text-xs font-medium text-zinc-400">{index + 1}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <Link
                                    href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-base cursor-pointer text-zinc-50 hover:text-orange-400 transition-colors visited:text-blue-400 block"
                                    title={story.title}
                                >
                                    {story.title}
                                </Link>

                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <svg
                                            className="w-3 h-3 text-orange-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                        <span className="text-orange-400 font-medium">{story.score}</span>
                                    </span>

                                    {story.descendants !== undefined && (
                                        <span className="flex items-center gap-1">
                                            <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                                />
                                            </svg>
                                            <span>{story.descendants}</span>
                                        </span>
                                    )}

                                    <span className="flex items-center gap-1">
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <span>{story.by}</span>
                                    </span>

                                    <span className="flex items-center gap-1">
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>{formatTime(story.time)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-2 border-t border-zinc-800">
                <p className="text-sm text-zinc-400 text-right">
                    更新时间: {dayjs().format('M月D日 HH:mm')}
                </p>
            </div>
        </Card>
    );
};

export default HackerNewsCard;
