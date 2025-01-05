import axios from 'axios';
import { sleep } from '../utils';
import { WeiboMblog } from '../types/weibo';

export class WeiboProducer {
  private headers = {
    "accept": "application/json, text/plain, */*",
    "mweibo-pwa": "1"
  };

  
  async produceWeiboPosts(userId: string,maxPage=20) {
    const posts: WeiboMblog[] = [];
    let containerid: string | null = null;
    let since_id: string | null = null;
    try {
      const { data } = await axios.get(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${userId}`);
      containerid = data.data.tabsInfo.tabs[1].containerid;
      console.log(`获取到用户containerid: ${containerid}`);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return posts;
    }

    for (let page = 0; page <= maxPage; page++) {
      try {
        const params: any = {
          type: "uid",
          value: userId,
          containerid
        };
        if (since_id) {
          params.since_id = since_id;
        }

        const { data } = await axios.get("https://m.weibo.cn/api/container/getIndex", {
          params,
          headers: this.headers
        });

        const cards = data.data.cards
          .filter((card: any) => card.card_type === 9)
          .map((card: any) => card.mblog);

        if (cards.length === 0) {
          console.log('没有更多微博数据');
          break;
        }

        since_id = data.data.cardlistInfo.since_id;
        posts.push(...cards);
        await sleep(2000);
      } catch (error) {
        console.error(`获取第 ${userId} 页微博失败:`, error);
        break;
      }
    }
    return posts;
  }
}
