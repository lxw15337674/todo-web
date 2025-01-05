import axios from 'axios';
import { log } from './utils/log';

export async function getPersonWeibo() {
    try {
        const response = await axios.get("https://weibo.com/ajax/statuses/mymblog", {
            params: {
                uid: 5886364444,
                page: 2,
                feature: 0
            },
            headers: {
                accept: "application/json, text/plain, */*",
                "accept-language": "zh-CN,zh;q=0.9",
                "client-version": "v2.47.17",
                priority: "u=1, i",
                // "sec-ch-ua": "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
                // "sec-ch-ua-mobile": "?0",
                // "sec-ch-ua-platform": "\"Windows\"",
                // "sec-fetch-dest": "empty",
                // "sec-fetch-mode": "cors",
                // "sec-fetch-site": "same-origin",
                // "server-version": "v2025.01.02.1",
                "x-requested-with": "XMLHttpRequest",
                // "x-xsrf-token": "Upml6pSb5j2Va4iPCgFO54Bz",
                // cookie: "XSRF-TOKEN=Upml6pSb5j2Va4iPCgFO54Bz; SUB=_2AkMQJAAMf8NxqwFRmf4dxGzkbo1_zArEieKmePHXJRMxHRl-yT9kqhUQtRB6O6Qu4xn_N9iAwgQHE2-uaI2Ssy40ow6p; SUBP=0033WrSXqPxfM72-Ws9jqgMF55529P9D9W5Nn_7qbB5s6On9MkL_YrG2; WBPSESS=UpRpmiZuabnjxMaPsrZiV4irVfaJckA8YWDLyiVQgmNqEf-IhrdhoF-Kg5nddzwJlxkMU1VfJqZlKL69BHos9hkJGRnyhPO5K14b80DfJwrU7eWOoZtbSHE70zoB3LuuQ5m137TLguVqOEBkClwtrL2YV0fLVn8FGITyYNOpZW8=",
                Referer: "https://weibo.com/u/5886364444",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
        });
        return response.data;
    } catch (error) {
        log('获取个人微博失败: ' + error, 'error');
    }
}
