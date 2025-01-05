import { getProducers } from './utils/db/producer';
import { mWeibo } from './weibo/mWeibo';
import { log } from './utils/log';

async function main() {
    try {
        // 从数据库获取所有活跃的生产者
        const producers = await getProducers();

        // 爬取所有生产者的微博数据
        mWeibo(producers);
    } catch (error) {
        log('主函数出错:' + error, 'error');
    }
}

// 运行主函数
main();