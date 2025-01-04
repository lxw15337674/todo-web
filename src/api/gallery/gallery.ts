'use server'
import axios from "axios";

interface Category {
    uid: string;
    name: string;
}
interface Category {
    uid: string;
    name: string;
}

interface ImageInfo {
    url: string;
    width: number;
    height: number;
}

export interface Image {
    pic_id: string;
    wb_url: string;
    pic_info: {
        large: ImageInfo;
        original: ImageInfo;
    };
}

export async function getGalleryCategories(): Promise<Category[]> {
    const data = await axios.get(`https://awsl.api.awsl.icu/producers`)
    return data.data;
}


export async function getImagesByUid(uid: string, limit: number = 20, offset: number = 0): Promise<Image[]> {
    const data = await axios.get(`https://awsl.api.awsl.icu/v2/list`, {
        params: {
            uid,
            limit,
            offset
        }
    });
    return data.data;
}


