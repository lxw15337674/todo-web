import axios from 'axios';
import { unstable_cache } from 'next/cache';

export interface IData {
  title: string;
  desc: string;
  hot: number;
  url: string;
}

export interface IRootObject {
  code: number;
  message: string;
  name: string;
  title: string;
  subtitle: string;
  from: string;
  total: number;
  updateTime: string;
  data: IData[];
}

// 知乎话题API相关接口
export interface ZhihuTopicItem {
  title: string;
  detail: string;
  cover: string;
  hot_value_desc: string;
  answer_cnt: number;
  follower_cnt: number;
  comment_cnt: number;
  created_at: number;
  created: string;
  link: string;
}

export interface ZhihuTopicResponse {
  code: number;
  message: string;
  data: ZhihuTopicItem[];
}

// 猫眼电影API相关接口
export interface MaoyanMovieItem {
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

export interface MaoyanMovieResponse {
  code: number;
  message: string;
  data: {
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
  };
}

// 猫网剧热度API相关接口
export interface MaoyanWebSeriesItem {
  series_id: number;
  series_name: string;
  release_info: string;
  platform_desc: string;
  platform_txt: number;
  curr_heat: number;
  curr_heat_desc: string;
  bar_value: number;
}

export interface MaoyanWebSeriesResponse {
  code: number;
  message: string;
  data: {
    update_gap_second: number;
    updated: string;
    updated_at: number;
    list: MaoyanWebSeriesItem[];
  };
}

// 每日新闻API相关接口
export interface DailyNewsItem {
  date: string;
  news: string[];
  image: string;
  tip: string;
  cover: string;
  audio: {
    music: string;
    news: string;
  };
  link: string;
  created: string;
  created_at: number;
  updated: string;
  updated_at: number;
  day_of_week: string;
  lunar_date: string;
  api_updated: string;
  api_updated_at: number;
}

export interface DailyNewsResponse {
  code: number;
  message: string;
  data: DailyNewsItem;
}

// AI资讯API相关接口
export interface AiNewsItem {
  title: string;
  detail: string;
  link: string;
  source: string;
  date: string;
}

export interface AiNewsResponse {
  code: number;
  message: string;
  data: {
    date: string;
    news: AiNewsItem[];
  };
}

// 通用获取API函数
const fetchFrom60sApi = async (endpoint: string) => {
  try {
    const response = await axios.get(`https://60s.viki.moe/v2/${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`获取${endpoint}数据失败:`, error);
    return {
      code: -1,
      message: '获取数据失败',
      data: [],
    };
  }
};

// 适配知乎话题数据为通用格式
const adaptZhihuTopicData = (zhihuData: ZhihuTopicResponse): IRootObject => {
  const adaptedData: IData[] = zhihuData.data.map((item, index) => ({
    title: item.title,
    desc: item.detail,
    hot: item.answer_cnt, // 使用回答数量作为热度值
    url: item.link,
  }));

  return {
    code: zhihuData.code,
    message: zhihuData.message,
    name: 'zhihu',
    title: '知乎话题',
    subtitle: '知乎实时热门话题榜',
    from: 'zhihu',
    total: adaptedData.length,
    updateTime: Date.now().toString(),
    data: adaptedData,
  };
};

// 适配猫眼电影数据为通用格式
const adaptMaoyanMovieData = (movieData: MaoyanMovieResponse): IRootObject => {
  const adaptedData: IData[] = movieData.data.list.map((item) => ({
    title: item.movie_name,
    desc: `${item.release_info} | 票房: ${item.box_office}${item.box_office_unit} | 占比: ${item.box_office_rate}`,
    hot: parseFloat(item.box_office), // 使用票房作为热度值
    url: '', // 猫眼电影可能没有直接的链接
  }));

  return {
    code: movieData.code,
    message: movieData.message,
    name: 'maoyan-movie',
    title: '猫眼电影',
    subtitle: '实时票房',
    from: 'maoyan-movie',
    total: adaptedData.length,
    updateTime: movieData.data.updated_at.toString(),
    data: adaptedData,
  };
};

// 适配猫眼网剧数据为通用格式
const adaptMaoyanWebSeriesData = (webSeriesData: MaoyanWebSeriesResponse): IRootObject => {
  const adaptedData: IData[] = webSeriesData.data.list.map((item) => ({
    title: item.series_name,
    desc: item.platform_desc,
    hot: item.curr_heat, // 使用热度值
    url: '', // 网剧可能没有直接链接
  }));

  return {
    code: webSeriesData.code,
    message: webSeriesData.message,
    name: 'maoyan-web',
    title: '猫眼网剧',
    subtitle: '网剧实时热度榜',
    from: 'maoyan-web',
    total: adaptedData.length,
    updateTime: webSeriesData.data.updated_at.toString(),
    data: adaptedData,
  };
};

// 适配每日新闻数据为通用格式
const adaptDailyNewsData = (newsData: DailyNewsResponse): IRootObject => {
  const adaptedData: IData[] = newsData.data.news.map((item, index) => ({
    title: item,
    desc: `第${index + 1}条新闻`,
    hot: index + 1, // 序号作为热度值
    url: newsData.data.link || '', // 如果有链接则使用
  }));

  return {
    code: newsData.code,
    message: newsData.message,
    name: 'daily-news',
    title: '每日新闻',
    subtitle: '每天60秒读懂世界',
    from: 'daily-news',
    total: adaptedData.length,
    updateTime: newsData.data.updated_at.toString(),
    data: adaptedData,
  };
};

// 适配AI资讯数据为通用格式
const adaptAiNewsData = (aiNewsData: AiNewsResponse): IRootObject => {
  const adaptedData: IData[] = aiNewsData.data.news.map((item) => ({
    title: item.title,
    desc: item.detail,
    hot: 0, // AI资讯可能没有热度
    url: item.link,
  }));

  return {
    code: aiNewsData.code,
    message: aiNewsData.message,
    name: 'ai-news',
    title: 'AI资讯',
    subtitle: 'AI资讯快报',
    from: 'ai-news',
    total: adaptedData.length,
    updateTime: Date.now().toString(),
    data: adaptedData,
  };
};

export const getHotLists = unstable_cache(
  (type: string) => {
    return axios
      .get(`https://hot-api-bhwa233.vercel.app/${type}`, {
        params: {
          cache: true,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((res) => {
        console.error(res.message);
      });
  },
  ['hot'],
  { revalidate: 60 * 60 },
);

// 获取知乎话题数据
export const getZhihuTopics = unstable_cache(
  async () => {
    try {
      const response = await fetchFrom60sApi('zhihu');
      return adaptZhihuTopicData(response);
    } catch (error) {
      console.error('获取知乎话题数据失败:', error);
      return {
        code: -1,
        message: '获取数据失败',
        name: 'zhihu',
        title: '知乎话题',
        subtitle: '知乎实时热门话题榜',
        from: 'zhihu',
        total: 0,
        updateTime: Date.now().toString(),
        data: [],
      };
    }
  },
  ['zhihu-hot'],
  { revalidate: 60 * 30 }, // 每30分钟更新一次
);

// 获取猫眼电影数据
export const getMaoyanMovie = unstable_cache(
  async () => {
    try {
      // 使用60s.viki.moe的API 获取实时票房数据 (该API已包含猫眼实时票房数据)
      const response = await fetchFrom60sApi('maoyan/realtime/movie');
      return adaptMaoyanMovieData(response);
    } catch (error) {
      console.error('获取猫眼实时票房数据失败:', error);
      return {
        code: -1,
        message: '获取数据失败',
        name: 'maoyan-movie',
        title: '猫眼电影',
        subtitle: '全球票房总榜',
        from: 'maoyan-movie',
        total: 0,
        updateTime: Date.now().toString(),
        data: [],
      };
    }
  },
  ['maoyan-movie'],
  { revalidate: 60 * 60 }, // 每小时更新一次
);

// 获取猫眼网剧数据
export const getMaoyanWebSeries = unstable_cache(
  async () => {
    try {
      const response = await fetchFrom60sApi('maoyan/realtime/web');
      return adaptMaoyanWebSeriesData(response);
    } catch (error) {
      console.error('获取猫眼网剧数据失败:', error);
      return {
        code: -1,
        message: '获取数据失败',
        name: 'maoyan-web',
        title: '猫眼网剧',
        subtitle: '网剧实时热度榜',
        from: 'maoyan-web',
        total: 0,
        updateTime: Date.now().toString(),
        data: [],
      };
    }
  },
  ['maoyan-webseries'],
  { revalidate: 60 * 30 }, // 每30分钟更新一次
);

// 获取每日新闻数据
export const getDailyNews = unstable_cache(
  async () => {
    try {
      const response = await fetchFrom60sApi('60s');
      return adaptDailyNewsData(response);
    } catch (error) {
      console.error('获取每日新闻数据失败:', error);
      return {
        code: -1,
        message: '获取数据失败',
        name: 'daily-news',
        title: '每日新闻',
        subtitle: '每天60秒读懂世界',
        from: 'daily-news',
        total: 0,
        updateTime: Date.now().toString(),
        data: [],
      };
    }
  },
  ['daily-news'],
  { revalidate: 60 * 60 * 24 }, // 每天更新一次
);

// 获取AI资讯数据
export const getAiNews = unstable_cache(
  async () => {
    try {
      const response = await fetchFrom60sApi('ai-news');
      return adaptAiNewsData(response);
    } catch (error) {
      console.error('获取AI资讯数据失败:', error);
      return {
        code: -1,
        message: '获取数据失败',
        name: 'ai-news',
        title: 'AI资讯',
        subtitle: 'AI资讯快报',
        from: 'ai-news',
        total: 0,
        updateTime: Date.now().toString(),
        data: [],
      };
    }
  },
  ['ai-news'],
  { revalidate: 60 * 60 }, // 每小时更新一次
);
