'use server'
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getTags } from './aiActions';

export const fetchTitle = async (url: string) => {
    if (url === '') {
        return '';
    }
    try {
        console.log(url);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1'
            }
        });
        const html = response.data;
        const $ = cheerio.load(html);
        await getTags(html);
        return $('title').text() || url;
    } catch (error) {
        console.error('Error fetching title:', error);
        return url;
    }
};
