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

export async function getFutuStockMap(area: string, mapType: string): Promise<string> {
    if (isFutuProcessing) {
        throw new Error('Another process is running');
    }
    isFutuProcessing = true;

    try {
        const page = await getPage();
        await page.goto(`https://www.futunn.com/quote/${area}/heatmap`, {
            waitUntil: 'load',
        })
        if (mapType === MapType.hy) {
            await page.click('.select-component.heatmap-list-select');
            await page.evaluate(() => {
                const parentElement = document.querySelector('.pouper.max-hgt');
                (parentElement?.children[1] as HTMLElement)?.click();
            });
        }
        await page.waitForTimeout(3000);
        const element = await page.locator('.quote-page.router-page');
        if (!element) {
            throw new Error('热力图元素未找到，请稍后重试');
        }

        // Wait for content to load
        await page.waitForTimeout(2000);
        
        const screenshot = await element.screenshot({
            type: 'jpeg',
        });

        const base64Image = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
        return base64Image;
    } catch (error) {
        console.error('获取富途热力图失败:', error);
        throw new Error('获取富途热力图失败，请稍后重试');
    } finally {
        isFutuProcessing = false;
        await closeBrowser();
    }
}

export async function getYuntuStockMap(): Promise<string> {
    if (isYuntuProcessing) {
        throw new Error('Another process is running');
    }
    isYuntuProcessing = true;

    try {
        const page = await getPage();
        await page.goto('https://dapanyuntu.com/', {
            waitUntil: 'networkidle',
            timeout: 60000
        });
        await page.waitForTimeout(10000);
        const element = await page.locator('#body');
        
        if (!element) {
            throw new Error('热力图元素未找到，请稍后重试');
        }

        const screenshot = await element.screenshot({
            type: 'jpeg',
        });

        const base64Image = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
        return base64Image;
    } catch (error) {
        console.error('获取云图热力图失败:', error);
        throw new Error('获取云图热力图失败，请稍后重试');
    } finally {
        isYuntuProcessing = false;
        await closeBrowser();
    }
}