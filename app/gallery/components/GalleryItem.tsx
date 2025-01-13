import { Producer, Media, Post } from '@prisma/client'
import { Button } from "@/components/ui/button"
import { ExternalLink, Video } from "lucide-react"
import { PhotoView } from 'react-photo-view'
import Image from "next/image"
import { formatDate } from "@/utils/date"
import { useRef } from 'react'

interface Props {
    image: Media & { producer: Producer | null, post: Post | null }
    index: number
    selectedProducer: string | null
}

const VIDEO_EXTENSIONS = ['.mov', '.mp4']

export const GalleryItem = ({ image }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const handleMouseEnter = async () => {
        if (videoRef.current) {
            try {
                await videoRef.current.play();
            } catch (error: unknown) {
                // Ignore AbortError when play is interrupted
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Error playing video:', error);
                }
            }
        }
    }
    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }
    const imageUrl = image.galleryMediaUrl ?? image.originMediaUrl ?? `https://placehold.co/${image.width}x${image.height}?text=${image.id}`

    const handleProducerClick = () => {
        const platform = image.post?.platform ?? 'WEIBO'
        const userId = image.post?.userId ?? image.userId

        switch (platform) {
            case 'WEIBO':
                window.open(`https://weibo.com/u/${userId}`, '_blank')
                break
            case 'XIAOHONGSHU':
                window.open(`https://www.xiaohongshu.com/user/profile/${userId}`, '_blank')
                break
            case 'DOUYIN':
                window.open(`https://www.douyin.com/user/${userId}`, '_blank')
                break
        }
    }

    return (
        <div
            className={`relative group overflow-hidden`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        // style={{
        //     width: image?.width??undefined,
        //     height: image?.height??undefined
        // }}
        >
            {image.galleryMediaUrl && VIDEO_EXTENSIONS.some(ext => image.galleryMediaUrl?.endsWith(ext)) ? (
                <div className="relative">
                    <video
                        ref={videoRef}
                        src={image.galleryMediaUrl}
                        loop
                        muted
                        width={image?.width ?? undefined}
                        height={image?.height ?? undefined}
                        playsInline
                        className="w-full h-auto transform transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-black/50 p-2 ">
                        <Video className=" text-white" width={image?.width ?? undefined}
                            height={image?.height ?? undefined} />
                    </div>
                </div>
            ) : (
                <PhotoView src={imageUrl}>
                    <Image
                        className="transform transition-transform duration-300 group-hover:scale-105 max-h-[600px]"
                        src={imageUrl}
                        alt={image.originSrc ?? image.id.toString()}
                        width={image?.width ?? undefined}
                        height={image?.height ?? undefined}
                        loading="lazy"
                    />
                </PhotoView>
            )}
            <div className="absolute duration-300 bottom-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity w-full">
                <div className="flex justify-between items-center">
                    <span
                        className="text-white text-sm hover:underline cursor-pointer"
                        title={`查看${image.producer?.name}的主页`}
                        onClick={handleProducerClick}
                    >
                        {image.producer?.name}
                    </span>
                    <span className="text-white text-sm">
                        {formatDate(image.createTime)}
                    </span>
                </div>
            </div>
            {(image.originSrc || image.post?.platformId) && (
                <Button
                    size="icon"
                    variant="secondary"
                    className="absolute duration-300 top-2 right-2 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    onClick={() => window.open(image.originSrc ?? `https://weibo.com/${image.post?.userId}/${image.post?.platformId}`, '_blank')}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
