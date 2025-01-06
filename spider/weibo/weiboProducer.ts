import axios, { AxiosError } from 'axios';
import { sleep } from '../common';
import { WeiboMblog } from '../types/weibo';
import { log } from '../utils/log';

const headers = {
    "accept": "application/json, text/plain, */*",
    "mweibo-pwa": "1"
} as const;

const baseUrl = 'https://m.weibo.cn/api/container/getIndex';
const delayMs = 10000;

const getContainerId = async (userId: string): Promise<string> => {
    try {
        const { data } = await axios.get(`${baseUrl}?type=uid&value=${userId}`);
        const containerId = data.data.tabsInfo.tabs[1].containerid;
        log(`获取到用户containerId: ${containerId}`, 'info');
        return containerId;
    } catch (error) {
        const msg = error instanceof AxiosError ? error.message : '未知错误';
        log(`获取用户信息失败: ${msg}`, 'error');
        throw error;
    }
};

const fetchPage = async (userId: string, containerId: string, sinceId?: string) => {
    const params = {
        type: "uid",
        value: userId,
        containerid: containerId,
        ...(sinceId && { since_id: sinceId })
    };

    const { data } = await axios.get(baseUrl, {
        params,
        headers
    });

    return {
        cards: data.data.cards
            .filter((card: any) => card.card_type === 9)
            .map((card: any) => card.mblog),
        sinceId: data.data.cardlistInfo.since_id
    };
};

export const produceWeiboPosts = async (
    userId: string, 
    onPage?: (posts: WeiboMblog[]) => Promise<void>,
    maxPage = 20
): Promise<WeiboMblog[]> => {
    const posts: WeiboMblog[] = [];
    let sinceId: string | undefined;

    try {
        const containerId = await getContainerId(userId);

        for (let page = 0; page <= maxPage; page++) {
            try {
                const { cards, sinceId: newSinceId } = await fetchPage(userId, containerId, sinceId);

                if (!cards.length) {
                    log('没有更多微博数据', 'info');
                    break;
                }

                sinceId = newSinceId;
                posts.push(...cards);
                log(`成功获取第 ${page + 1} 页微博`, 'success');
                
                // Process this page's data if callback provided
                if (onPage) {
                    await onPage(cards);
                }
                
                await sleep(delayMs);
            } catch (error) {
                const msg = error instanceof AxiosError ? error.message : '未知错误';
                log(`获取第 ${page + 1} 页微博失败: ${msg}`, 'error');
                break;
            }
        }
    } catch (error) {
        log('获取微博列表失败', 'error');
        return posts;
    }

    return posts;
};
