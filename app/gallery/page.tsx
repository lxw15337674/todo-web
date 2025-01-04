'use client'
import { getProducers } from "@/api/gallery/producer"
import { getPics } from "@/api/gallery/weiboMedia"
import { usePromise } from "wwhooks"
import { useEffect, useRef, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Masonry } from "@mui/lab"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { ProducerDialog } from "@/components/producer/producer-dialog"

const Count = 6 * 12
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
  const [fallbackImages, setFallbackImages] = useState<Set<number>>(new Set())

  const getImageUrl = (image: any) => {
    return fallbackImages.has(image.id) ? image.galleryUrl : image.weiboImgUrl
  }

  const handleImageError = (imageId: number) => {
    setFallbackImages(prev => {
      const newSet = new Set(prev)
      newSet.add(imageId)
      return newSet
    })
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
      const result = await getPics(currentPage, 30, weiboId)
      if (currentPage === 1) {
        setImages(result.items)
      } else {
        setImages(prev => [...prev, ...result.items])
      }
      setHasMore(currentPage < result.totalPages)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setLoading(false)
    }
  }
  console.log(producers)
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

        <ProducerDialog
          open={producerDialogOpen}
          onOpenChange={setProducerDialogOpen}
          producers={producers}
          onSuccess={refreshProducers}
        />
      </div>

      <PhotoProvider>
        <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 6 }} spacing={2}>
          {(images ?? []).map((image, index) => (
            <div
              className={`relative group overflow-hidden`}
              key={selectedProducer + '_' + index}
            >
              <PhotoView src={getImageUrl(image)}>
                <div className="transform transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={getImageUrl(image)}
                    alt={image.id.toString()}
                    loader={imageLoader}
                    width={image.width}
                    height={image.height}
                    className="w-full h-auto"
                    onError={() => handleImageError(image.id)}
                  />
                </div>
              </PhotoView>
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
          <p className="text-muted-foreground">---- 已加载 {images.length} 张图片 ----</p>
        )}
      </div>
    </div>
  )
}