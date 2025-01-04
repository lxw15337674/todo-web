'use client'
import { getProducers } from "@/api/gallery/producer"
import { getPics } from "@/api/gallery/weiboMedia"
import { usePromise } from "wwhooks"
import { useEffect, useRef, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Masonry } from "@mui/lab"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ExternalLink, Video } from "lucide-react"
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { ProducerDialog } from "@/components/producer/producer-dialog"
import { formatDate } from "@/utils/date"

const PAGE_SIZE = 72 // 6 * 12
const imageLoader = ({ src }: { src: string }) => {
  return src
}


export default function ImagePage() {
  const { data: producers, reload: refreshProducers } = usePromise(getProducers, {
    initialData: [],
    manual: false
  })
  const [selectedProducer, setSelectedProducer] = useState<string | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>()
  const [producerDialogOpen, setProducerDialogOpen] = useState(false)
  const [total, setTotal] = useState(0)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  const handleMouseEnter = (videoKey: string) => {
    const video = videoRefs.current[videoKey]
    if (video) {
      video.play()
    }
  }

  const handleMouseLeave = (videoKey: string) => {
    const video = videoRefs.current[videoKey]
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }

  useEffect(() => {
    setPage(1)
    setImages([])
    setHasMore(true)
    loadImages(1)
  }, [selectedProducer])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadImages(page)
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, page])

  const loadImages = async (currentPage: number) => {
    if (loading) return
    setLoading(true)
    try {
      const weiboId = selectedProducer === 'all' ? null : producers.find(p => p.id === selectedProducer)?.weiboId
      const result = await getPics(currentPage, PAGE_SIZE, weiboId)
      setImages(prev => currentPage === 1 ? result.items : [...prev, ...result.items])
      setTotal(result.total)
      setHasMore(currentPage < result.totalPages)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center gap-2">
        <Select value={selectedProducer ?? 'all'} onValueChange={(value) => setSelectedProducer(value === 'all' ? null : value)}>
          <SelectTrigger className="w-[180px] my-2">
            <SelectValue placeholder="全部制作者" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部制作者</SelectItem>
              {(producers ?? []).map((producer) => (
                <SelectItem key={producer.id} value={producer.id}>
                  {producer.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setProducerDialogOpen(true)}
        >
          管理制作者
        </Button>

        <div className="text-sm text-muted-foreground">
          共 {total} 张图片
        </div>

        <ProducerDialog
          open={producerDialogOpen}
          onOpenChange={setProducerDialogOpen}
          producers={producers}
          onSuccess={refreshProducers}
        />
      </div>

      <PhotoProvider>
        <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 6 }} spacing={2}>
          {(images ?? []).map((image, index) => (
            <div
              className={`relative group overflow-hidden`}
              key={selectedProducer + '_' + index}
              onMouseEnter={() => handleMouseEnter(selectedProducer + '_' + index)}
              onMouseLeave={() => handleMouseLeave(selectedProducer + '_' + index)}
            >
              {image.videoSrc ? (
                <div className="relative">
                  <video
                    ref={el => {
                      if (el) {
                        videoRefs.current[selectedProducer + '_' + index] = el
                      }
                    }}
                    src={image.videoSrc}
                    loop
                    muted
                    playsInline
                    className="w-full h-auto transform transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-black/50 p-1 rounded-full">
                    <Video className="h-4 w-4 text-white" />
                  </div>
                </div>
              ) : (
                <PhotoView src={image.galleryUrl}>
                  <div className="transform transition-transform duration-300 group-hover:scale-105">
                    <Image
                      src={image.galleryUrl}
                      alt={image.id.toString()}
                      loader={imageLoader}
                      width={image.width}
                      height={image.height}
                      className="w-full h-auto"
                    />
                  </div>
                </PhotoView>
              )}
              <div className="absolute duration-300 bottom-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm">
                  {formatDate(image.createdAt)}
                </p>
              </div>
              {image.weiboUrl && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute duration-300 top-2 right-2 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  onClick={() => window.open(image.weiboUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </Masonry>
      </PhotoProvider>

      <div ref={loadingRef} className="py-4 text-center">
        {loading && <p className="text-muted-foreground">加载中...</p>}
        {!loading && images.length > 0 && (
          <p className="text-muted-foreground">---- 已加载 {images.length} / {total} 张图片 ----</p>
        )}
      </div>
    </div>
  )
}