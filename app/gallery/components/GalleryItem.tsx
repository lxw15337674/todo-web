import { Producer, WeiboMedia } from '@prisma/client'
import { Button } from "@/components/ui/button"
import { ExternalLink, Video } from "lucide-react"
import { PhotoView } from 'react-photo-view'
import Image from "next/image"
import { formatDate } from "@/utils/date"
import { useEffect, useRef } from 'react'

interface Props {
    image: WeiboMedia
    index: number
    selectedProducer: string | null
    producers: Producer[]
}

const imageLoader = ({ src }: { src: string }) => {
    return src
}

export const GalleryItem = ({ image, producers }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play()
        }
    }

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }
    const imageUrl = image.galleryImgUrl ?? image.originImgUrl ?? `https://placehold.co/${image.width}x${image.height}?text=${image.id}`
    return (
        <div
            className={`relative group overflow-hidden`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {image.galleryVideoSrc ? (
                <div className="relative">
                    <video
                        ref={videoRef}
                        src={image.galleryVideoSrc}
                        loop
                        muted
                        playsInline
                        className="w-full h-auto transform transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-black/50 p-2 ">
                        <Video className="h-4 w-4 text-white" />
                    </div>
                </div>
            ) : (
                <PhotoView src={imageUrl}>
                    <div className="transform transition-transform duration-300 group-hover:scale-105">
                        <Image
                            src={imageUrl}
                            alt={image.id.toString()}
                            loader={imageLoader}
                            width={image.width}
                            height={image.height}
                            className="w-full h-auto"
                        />
                    </div>
                </PhotoView>
            )}
            <div className="absolute duration-300 bottom-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity w-full">
                <div className="flex justify-between items-center">
                    <span
                        className="text-white text-sm hover:underline cursor-pointer"
                        title={`查看${producers.find(p => p.weiboId === image.userId.toString())?.name}的微博`}
                        onClick={() => window.open(`https://weibo.com/u/${image.userId}`, '_blank')}
                    >
                        {producers.find(p => p.weiboId === image.userId.toString())?.name}
                    </span>
                    <span className="text-white text-sm">
                        {formatDate(image.createTime)}
                    </span>
                </div>
            </div>
            {image.weiboUrl && (
                <Button
                    size="icon"
                    variant="secondary"
                    className="absolute duration-300 top-2 right-2 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    onClick={() => window.open(image.weiboUrl ?? '', '_blank')}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
