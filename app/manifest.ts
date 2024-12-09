import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '工具箱',
        short_name: '工具箱',
        description: 'Next.js + Serwist PWA',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: 'icons/icon-256.png',
                sizes: '72x72',
                type: 'image/png',

            },
            {
                src: 'icons/icon-256.png',
                sizes: '96x96',
                type: 'image/png',

            },
            {
                src: 'icons/icon-256.png',
                sizes: '128x128',
                type: 'image/png',

            },
            {
                src: 'icons/icon-256.png',
                sizes: '144x144',
                type: 'image/png',

            },
            {
                src: 'icons/icon-256.png',
                sizes: '152x152',
                type: 'image/png',

            },
            {
                src: 'icons/icon-256.png',
                sizes: '192x192',
                type: 'image/png',

            },
            {
                src: 'icons/icon-256.png',
                sizes: '384x384',
                type: 'image/png',

            },
            {
                src: 'icons/icon-256.png',
                sizes: '512x512',
                type: 'image/png',

            },
        ],
    };
}