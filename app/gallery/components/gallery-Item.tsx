import { Producer, Media, Post } from '@prisma/client'
import { Button } from "@/components/ui/button"
import { ExternalLink, Video } from "lucide-react"
import { PhotoView } from 'react-photo-view'
import Image from "next/image"
import { formatDate } from "@/utils/date"
import { useRef, useState } from 'react'
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
    image: Media & { producer: Producer | null, post: Post | null }
    index: number
}

const VIDEO_EXTENSIONS = ['.mov', '.mp4']

export const GalleryItem = ({ image }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isHovered, setIsHovered] = useState(false)

    function handleHoverChange(isEnter: boolean, videoEl: HTMLVideoElement | null) {
        if (isEnter) {
            try {
                videoEl?.play();
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Error playing video:', error);
                }
            }
        } else {
            videoEl?.pause();
            if (videoEl) videoEl.currentTime = 0;
        }
        setIsHovered(isEnter);
    }

    function getProducerUrl(platform: string, userId: string) {
        switch (platform) {
            case 'WEIBO':
                return /^\d+$/.test(userId)
                    ? `https://weibo.com/u/${userId}`
                    : `https://weibo.com/p/${userId}`;
            case 'XIAOHONGSHU':
                return `https://www.xiaohongshu.com/user/profile/${userId}`;
            case 'DOUYIN':
                return `https://www.douyin.com/user/${userId}`;
            default:
                return '';
        }
    }

    const isVideo = image.galleryMediaUrl && VIDEO_EXTENSIONS.some(ext => image.galleryMediaUrl?.endsWith(ext))
    const mediaUrl = image.galleryMediaUrl || ''
    const aspectRatio = image.width && image.height ? `${image.width} / ${image.height}` : undefined

    return (
        <div
            className={cn(
                "relative group overflow-hidden rounded-lg transition-all duration-300 ease-in-out",
                isHovered && "shadow-lg "
            )}
            onMouseEnter={() => handleHoverChange(true, videoRef.current)}
            onMouseLeave={() => handleHoverChange(false, videoRef.current)}
        >
            {isVideo ? (
                <div className="relative" style={{ aspectRatio }}>
                    {mediaUrl && (
                        <video
                            ref={videoRef}
                            src={mediaUrl}
                            poster={image.thumbnailUrl ?? undefined}
                            loop
                            muted
                            playsInline
                            preload="none"
                            className={cn(
                                "w-full h-full object-cover transition-all duration-300",
                                isHovered && "scale-105 brightness-90"
                            )}
                            onLoadedData={() => setIsLoading(false)}
                        />
                    )}
                    <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
                        <Video className="text-white w-4 h-4" />
                    </div>
                    {isLoading && (
                        <Skeleton className="absolute inset-0 rounded-lg" />
                    )}
                </div>
            ) : (
                    <PhotoView src={image.galleryMediaUrl ?? image.thumbnailUrl ?? `https://placehold.co/${image.width}x${image.height}?text=${image.id}`}>
                        <div className="relative cursor-zoom-in bg-muted/50 max-h-[50vh]" style={{ aspectRatio }}>
                        <Image
                            className={cn(
                                "object-cover transition-all duration-300",
                                isHovered && "scale-105 brightness-90"
                            )}
                                src={image.thumbnailUrl ?? image.galleryMediaUrl ?? `https://placehold.co/${image.width}x${image.height}?text=${image.id}`}
                            alt={image.originSrc ?? image.id.toString()}
                                fill
                                onLoad={() => setIsLoading(false)}
                        />
                        {isLoading && (
                            <Skeleton className="absolute inset-0" />
                        )}
                    </div>
                    </PhotoView>
            )}

            <div className={cn(
                "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent",
                "transition-opacity duration-300",
                isHovered ? "opacity-100" : "opacity-0"
            )}>
                <div className="flex justify-between items-center gap-2">
                    <button
                        className="text-white text-sm hover:underline truncate"
                        title={`查看${image.producer?.name}的主页`}
                        onClick={() => {
                            const platform = image.post?.platform ?? 'WEIBO';
                            const userId = image.post?.userId ?? image.userId;
                            if (userId) window.open(getProducerUrl(platform, userId), '_blank');
                        }}
                    >
                        {image.producer?.name}
                    </button>
                    <span className="text-white/80 text-sm whitespace-nowrap">
                        {formatDate(image.createTime)}
                    </span>
                </div>
            </div>

            {image.originSrc && (
                <Button
                    size="icon"
                    variant="secondary"
                    className={cn(
                        "absolute top-2 right-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm",
                        "transition-all duration-300 rounded-full",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                    )}
                    onClick={() => window.open(image.originSrc ?? `https://weibo.com/${image.post?.userId}/${image.post?.platformId}`, '_blank')}
                >
                    <ExternalLink className="h-4 w-4 text-white" />
                </Button>
            )}
        </div>
    )
}
