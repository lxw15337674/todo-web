import axios from 'axios';
import { Browser, Page, chromium } from 'playwright';

export enum MapType {
    hy = 'hy',
    gu = 'gu'
}

export enum Area {
    'hk' = 'hk',
    'us' = 'us',
    'cn' = 'cn'
}

const config = {
    headless: true,
    args: ['--no-sandbox',
        '--disable-setuid-sandbox',
    ]
}

let browser: Browser | null = null;
let page: Page | null = null;
let isFutuProcessing = false;
let isYuntuProcessing = false;

async function getPage(): Promise<Page> {
    if (!browser) {
        browser = await chromium.launch(config);
    }
    if (!page) {
        page = await browser.newPage();
        await page.setViewportSize({ width: 1920, height: 1080 });
    }
    return page;
}

async function closeBrowser() {
    if (page) {
        await page.close();
        page = null;
    }
    if (browser) {
        await browser.close();
        browser = null;
    }
}

const url = 'http://localhost:8080/api/ai'
export async function getFutuStockMap(area: string = 'cn', mapType: string): Promise<string> {
    try {
        console.log('Fetching Futu stock map...');
        const { data } = await axios.get(`${url}/getFutuStockMap?area=${area}&mapType=${mapType}`);
        return data;
    } catch (error) {
        console.error('获取富途热力图失败:', error);
        throw new Error('获取富途热力图失败，请稍后重试');
    } finally {
        isFutuProcessing = false;
        await closeBrowser();
    }
}

export async function getYuntuStockMap(): Promise<string> {
    try {
        console.log('Fetching Yuntu stock map...');
        const { data } = await axios.get(`${url}/stockThermalMap`);
        return data;
    } catch (error) {
        console.error('获取云图热力图失败:', error);
        throw new Error('获取云图热力图失败，请稍后重试');
    }
}