import Image from 'next/image';
import React from 'react';
import dayjs from 'dayjs';
import { Card } from '../../src/components/ui/card';
import { ScrollArea } from '../../src/components/ui/scroll-area';
import Link from 'next/link';

// 小红书热点数据类型
interface RedNoteItem {
    rank: number;
    title: string;
    score: string;
    word_type: string; // "热", "新", "无"
    work_type_icon: string;
    link: string;
}

interface RedNoteData {
    code: number;
    message: string;
    data: RedNoteItem[];
}

interface RedNoteCardProps {
    label: string;
    name: string;
}

// 服务端获取小红书热点数据
async function getRedNoteData(): Promise<RedNoteData | null> {
    try {
        const response = await fetch('https://60s.viki.moe/v2/rednote', {
            next: { revalidate: 600 } // 10分钟缓存
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: RedNoteData = await response.json();
        return data;
    } catch (error) {
        console.error('获取小红书热点数据失败:', error);
        return null;
    }
}

// 获取标签样式
const getTagStyle = (wordType: string) => {
    switch (wordType) {
        case '热':
            return {
                bg: 'bg-red-500/20',
                text: 'text-red-400',
                border: 'border-red-500/30'
            };
        case '新':
            return {
                bg: 'bg-blue-500/20',
                text: 'text-blue-400',
                border: 'border-blue-500/30'
            };
        default:
            return null;
    }
};

const RedNoteCard = async ({ label, name }: RedNoteCardProps) => {
    const hotData = await getRedNoteData();

    if (!hotData || !hotData.data || hotData.data.length === 0) {
        return (
            <Card className="w-full max-w-2xl bg-zinc-900 text-white">
                <div className="p-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Image
                            src={`/logo/${name}.png`}
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

    // 只取前20条
    const topHots = hotData.data.slice(0, 20);

    return (
        <Card className="w-full max-w-2xl bg-zinc-900 text-white">
            <div className="p-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Image
                        src={`/logo/${name}.png`}
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
                    {topHots.map((item) => {
                        const tagStyle = getTagStyle(item.word_type);

                        return (
                            <div
                                key={item.rank}
                                className="flex items-start gap-4 p-2 hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-1">
                                    <span className="text-xs font-medium text-zinc-400">{item.rank}</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                        <Link
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-base cursor-pointer text-zinc-50 hover:text-pink-400 transition-colors visited:text-blue-400 flex-1"
                                            title={item.title}
                                        >
                                            {item.title}
                                        </Link>

                                        {tagStyle && (
                                            <span
                                                className={`px-1.5 py-0.5 rounded text-xs font-medium border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} shrink-0`}
                                            >
                                                {item.word_type}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                                        <span className="flex items-center gap-1">
                                            <svg
                                                className="w-3 h-3 text-pink-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-pink-400 font-medium">{item.score}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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

export default RedNoteCard;
