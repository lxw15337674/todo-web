'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs'; 
import { Card } from '../../src/components/ui/card';
import { ScrollArea } from '../../src/components/ui/scroll-area';

interface MaoyanMovieItem {
  movie_id: number;
  movie_name: string;
  release_info: string;
  box_office: string;
  box_office_unit: string;
  box_office_desc: string;
  box_office_rate: string;
  split_box_office: string;
  split_box_office_unit: string;
  split_box_office_desc: string;
  split_box_office_rate: string;
  show_count: number;
  show_count_rate: string;
  avg_show_view: string;
  avg_seat_view: string;
  sum_box_desc: string;
  sum_split_box_desc: string;
}

interface MaoyanMovieData {
  title: string;
  show_count_desc: string;
  view_count_desc: string;
  split_box_office: string;
  split_box_office_unit: string;
  box_office: string;
  box_office_unit: string;
  update_gap_second: number;
  updated: string;
  updated_at: number;
  list: MaoyanMovieItem[];
}

interface MaoyanMovieCardProps {
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

const MaoyanMovieCard = ({ label, name }: MaoyanMovieCardProps) => {
  const [movieData, setMovieData] = useState<MaoyanMovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://60s.viki.moe/v2/maoyan/realtime/movie');
        const data = await response.json();

        if (data && data.data) {
          setMovieData(data.data);
        } else {
          throw new Error('API返回格式不正确');
        }
      } catch (err) {
        console.error('获取猫眼电影数据失败:', err);
        setError('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>加载中...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !movieData) {
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
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const date = formatTime(movieData.updated_at.toString());

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
          {/* 总体票房信息 */}
          <div className="p-1 bg-blue-900/20 border-b border-zinc-800">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="text-zinc-400">总票房</div>
                <div className="text-yellow-400 font-bold text-lg">{movieData.box_office + movieData.box_office_unit}</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-400">排片数</div>
                <div className="text-cyan-400">{movieData.show_count_desc}</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-400">观影人次</div>
                <div className="text-green-400">{movieData.view_count_desc}</div>
              </div>
            </div>
          </div>

          {movieData.list.map((movie, index) => (
            <div key={movie.movie_id} className="flex items-start gap-4 p-2 hover:bg-zinc-800/50 transition-colors">
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-1">
                <span className="text-xs font-medium text-zinc-400">{index + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base min-w-0 truncate w-[60%]">{movie.movie_name}</h3>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">
                      {movie.box_office}{movie.box_office_unit}
                    </div>
                  </div>
                </div>

                {/* 详细票房和观影信息 - 自适应换行布局 */}
                <div className="mt-2 space-y-1">
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-800/50 rounded">
                      <span className="text-white">{movie.release_info}</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-800/50 rounded">
                      <span className="text-zinc-500">实时票房:</span>
                      <span className="text-yellow-400">{movie.box_office}{movie.box_office_unit}</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-800/50 rounded">
                      <span className="text-zinc-500">票房占比:</span>
                      <span className="text-green-400">{movie.box_office_rate}</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-800/50 rounded">
                      <span className="text-zinc-500">场次占比:</span>
                      <span className="text-cyan-400">{movie.show_count_rate}</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-800/50 rounded">
                      <span className="text-zinc-500">场均人次:</span>
                      <span className="text-purple-400">{movie.avg_show_view}</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-800/50 rounded">
                      <span className="text-zinc-500">上座率:</span>
                      <span className="text-pink-400">{movie.avg_seat_view}</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-800/50 rounded">
                      <span className="text-zinc-500">累计票房:</span>
                      <span className="text-blue-400">{movie.sum_box_desc}</span>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-800/50 rounded">
                      <span className="text-zinc-500">场次数:</span>
                      <span className="text-red-400">{movie.show_count}</span>
                    </div>
                  </div>
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

export default MaoyanMovieCard;