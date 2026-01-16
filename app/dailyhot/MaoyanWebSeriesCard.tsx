import Image from 'next/image';
import React from 'react';
import dayjs from 'dayjs';
import { Card } from '../../src/components/ui/card';
import { ScrollArea } from '../../src/components/ui/scroll-area';

// 猫眼网剧数据类型
interface MaoyanWebSeriesItem {
    series_id: number;
    series_name: string;
    release_info: string;
    platform_desc: string;
    platform_txt: number;
    curr_heat: number;
    curr_heat_desc: string;
    bar_value: number;
}

interface MaoyanWebSeriesData {
    code: number;
    message: string;
    data: {
        update_gap_second: number;
        updated: string;
        updated_at: number;
        list: MaoyanWebSeriesItem[];
    };
}

interface MaoyanWebSeriesCardProps {
    label: string;
    name: string;
}

export const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = dayjs(timestamp);
    const now = dayjs();

    const diffInSeconds = now.diff(date, 'second');
    const diffInMinutes = now.diff(date, 'minute');
    const diffInHours = now.diff(date, 'hour');
    if (diffInSeconds < 60) {
        return "刚刚更新";
    } else if (diffInMinutes < 60) {
        const minutes = Math.floor(diffInMinutes);
        return `${minutes}分钟前更新`;
    } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return `${hours}小时前更新`;
    } else {
        return date.format('M月D日');
    }
};

// 服务端获取猫眼网剧数据
async function getMaoyanWebSeriesData(): Promise<MaoyanWebSeriesData | null> {
    try {
        const response = await fetch('https://60s.viki.moe/v2/maoyan/realtime/web', {
            next: { revalidate: 600 } // 10分钟缓存
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: MaoyanWebSeriesData = await response.json();
        return data;
    } catch (error) {
        console.error('获取猫眼网剧数据失败:', error);
        return null;
    }
}

const MaoyanWebSeriesCard = async ({ label, name }: MaoyanWebSeriesCardProps) => {
    const seriesData = await getMaoyanWebSeriesData();

    if (!seriesData || !seriesData.data) {
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

    // 只取前20条数据
    const topSeries = seriesData.data.list.slice(0, 20);
    const date = formatTime(seriesData.data.updated_at.toString());

    // 获取平台颜色
    const getPlatformColor = (platformTxt: number) => {
        switch (platformTxt) {
            case 0: return 'text-blue-400'; // 优酷
            case 1: return 'text-green-400'; // 爱奇艺
            case -1: return 'text-purple-400'; // 腾讯/多平台
            default: return 'text-zinc-400';
        }
    };

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
                    {topSeries.map((series, index) => (
                        <div key={series.series_id} className="flex items-start gap-4 p-2 hover:bg-zinc-800/50 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-1">
                                <span className="text-xs font-medium text-zinc-400">{index + 1}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-bold text-base min-w-0 flex-1">{series.series_name}</h3>
                                    <div className="text-right shrink-0">
                                        <span className="text-orange-400 font-bold text-sm">
                                            {series.curr_heat_desc}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                    <span className={`px-2 py-0.5 rounded ${getPlatformColor(series.platform_txt)} bg-zinc-800/50`}>
                                        {series.platform_desc}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-zinc-400 bg-zinc-800/50">
                                        {series.release_info}
                                    </span>
                                </div>

                                {/* 热度进度条 */}
                                <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-orange-500 to-pink-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((series.bar_value / 6000) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-2 border-t border-zinc-800">
                <p className="text-sm text-zinc-400 text-right">更新时间: {date}</p>
            </div>
        </Card>
    );
};

export default MaoyanWebSeriesCard;
