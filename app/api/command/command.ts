import { getBinanceData } from './acions/binance'
import { holiday } from './acions/fishingTime'
import { getFutureData } from './acions/future'
import { repeatMessage } from './acions/repeatMessage'
import { getHotSpot } from './acions/stockHotSpot'
import { getCNMarketIndexData, getHKMarketIndexData, getStockData, getStockDetailData, getUSMarketIndexData } from './acions/stockInfo'
import { getStockSummary } from './acions/stockSummary'
import { getFutuStockMap, getYuntuStockMap, MapType } from './acions/stockThermalMap'
import { getWeiboData } from './acions/weibo'
import { getRandomImage } from './acions/randomImage'
import { getHelp } from './acions/getHelp'
import { polishContent } from './acions/ai'

export interface CommandParams {
  args?: string,
  sendMessage: (content: string, type?: 'text' | 'image') => void,
  key: string,
  roomId?: string
}

export const commandMap: { key: string, callback: (params: CommandParams) => Promise<string>, msg: string, hasArgs: boolean, enable?: boolean, type?: 'text' | 'image' }[]
  = [
    // 股市相关命令
    {
      key: 'scn',
      callback: async (params: CommandParams) => {
        const result = await getCNMarketIndexData();
        return result || '获取数据失败';
      },
      msg: 'scn - 获取上证指数信息，包含大盘涨跌幅、成交量等核心数据',
      hasArgs: false,
    },
    {
      key: 'sus',
      callback: async (params: CommandParams) => {
        const result = await getUSMarketIndexData();
        return result || '获取美股指数数据失败';
      },
      msg: 'sus - 获取美股指数信息，包含大盘涨跌幅、成交量等核心数据',
      hasArgs: false,
    },
    {
      key: 'shk',
      callback: async (params: CommandParams) => {
        const result = await getHKMarketIndexData();
        return result || '获取港股指数数据失败';
      },
      msg: 'shk - 获取港股指数信息，包含大盘涨跌幅、成交量等核心数据',
      hasArgs: false,
    },
    {
      key: 's ',
      callback: async (params) => {
        if (!params.args) {
          throw new Error('请输入股票代码，例如: s 600519 000858');
        }
        return getStockData(params.args);
      },
      msg: 's [股票代码] - 获取股票信息,支持一次查询多只股票 例如: s 600519 000858',
      hasArgs: true,
    },
    {
      key: 'sd ',
      callback: async (params) => {
        if (!params.args) {
          throw new Error('请输入股票代码，例如: sd gzmt');
        }
        return getStockDetailData(params.args);
      },
      msg: 'sd [股票代码] - 获取股票详细信息 例如: sd gzmt',
      hasArgs: true,
    },
    {
      key: 'dp',
      callback: async (params: CommandParams) => {
        const result = await getStockSummary();
        return result || '获取大盘数据失败';
      },
      msg: 'dp - 获取大盘市场信息，包括涨跌家数、板块概览等',
      hasArgs: false,
    },
    {
      key: 'm',
      callback: async (params) => {
        if (!params.args||params.args==='dp') {
          const imageData = await getYuntuStockMap();
          params.sendMessage(imageData, 'image');
          return '';
        }

        const [market, type] = params.args.split(' ');
        if (!['cn', 'hk', 'us'].includes(market)) {
          throw new Error('市场类型无效，请使用: cn (A股) 或 hk (港股) 或 us (美股)');
        }
        
        const imageData = await getFutuStockMap(market as 'cn' | 'hk' | 'us', type as MapType);
        params.sendMessage(imageData, 'image');
        return '';
      },
      msg: 'm [市场] [类型] - 获取热力图\n  m - 获取云图大盘热力图\n  m cn/hk/us hy/gu - 获取富途热力图 (hy:行业图 gu:个股图)',
      hasArgs: true,
      type: 'image'
    },

    // 期货与数字货币
    {
      key: 'f ',
      callback: async (params) => {
        if (!params.args) {
          throw new Error('请输入期货代码，例如: f XAU');
        }
        return getFutureData(params.args);
      },
      msg: 'f [期货代码] - 获取期货信息 例如: f XAU',
      hasArgs: true,
    },
    {
      key: 'b ',
      callback: async (params) => {
        if (!params.args) {
          throw new Error('请输入数字货币代码，例如: b btc');
        }
        return getBinanceData(params.args);
      },
      msg: 'b [货币代码] - 获取数字货币信息 例如: b btc',
      hasArgs: true,
    },

    // 热点资讯
    {
      key: 'hot',
      callback: async (params: CommandParams) => {
        const result = await getHotSpot();
        return result || '获取数据失败';
      },
      msg: 'hot - 获取今日热点概念板块及相关个股',
      hasArgs: false,
    },
    {
      key: 'wb',
      callback: async (params: CommandParams) => {
        const result = await getWeiboData();
        return result || '获取微博热搜失败';
      },
      msg: 'wb - 获取微博热搜',
      hasArgs: false,
    },

    // 其他工具
    {
      key: 'hy',
      callback: async (params: CommandParams) => {
        const result = await holiday();
        return result || '获取节假日信息失败';
      },
      msg: 'hy - 获取节假日信息',
      hasArgs: false,
    },
    {
      key: 'hp',
      callback: async (params: CommandParams) => {
        const result = await getHelp();
        return result || '获取帮助信息失败';
      },
      msg: 'hp - 获取命令帮助',
      hasArgs: false,
    },
    // 随机图片命令
    {
      key: 'img',
      callback: getRandomImage,
      msg: 'img - 获取一张随机图片',
      hasArgs: false,
    },
  ];

// 解析命令
export async function parseCommand(msg: string, sendMessage: (content: string, type?: 'text' | 'image') => void, roomId?: string) {
  for (const command of commandMap) {
    if (msg.startsWith(command.key)) {
      const args = command.hasArgs ? msg.slice(command.key.length).trim() : undefined;
      return command.callback({
        args,
        sendMessage,
        key: command.key,
        roomId
      });
    }
  }
  const polishedText = await polishContent(msg);
  return polishedText
}

