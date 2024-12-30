'use service';

import axios from 'axios'

export interface ImageItem {
    id: string
    url: string
    name: string
}

const axiosInstance = axios.create({
    baseURL: 'https://telegraph-image-bww.pages.dev/',
})

// 添加请求拦截器以包含认证令牌
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export const getImages = async (): Promise<ImageItem[]> => {
    try {
        const response = await axiosInstance.get('https://telegraph-image-bww.pages.dev/api/manage/list')
        console.log(response.data)
        return response.data
    } catch (error) {
        throw new Error('获取图片列表失败')
    }
}

export const uploadImage = async (file: File): Promise<ImageItem> => {
    const formData = new FormData()
    formData.append('image', file)

    try {
        const response = await axiosInstance.post('/api/images', formData)
        return response.data
    } catch (error) {
        throw new Error('上传图片失败')
    }
}

export const deleteImage = async (id: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/api/images/${id}`)
    } catch (error) {
        throw new Error('删除图片失败')
    }
}
