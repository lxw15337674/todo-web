'use client'
import { getProducers } from "@/api/gallery/producer"
import { getPics, getPicsCount } from "@/api/gallery/media"
import { useEffect, useRef, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Masonry } from "@mui/lab"
import { Button } from "@/components/ui/button"
import { PhotoProvider } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { ProducerDialog } from "@/public/app/gallery/components/producer-dialog"
import { Media } from "@prisma/client"
import { GalleryItem } from './components/GalleryItem'
import { useRequest } from "ahooks"

const PAGE_SIZE = 6 * 6

export default function ImagePage() {
  const { data: producers=[], refresh: refreshProducers } = useRequest(getProducers, {
    manual: false
  })
  const [selectedProducer, setSelectedProducer] = useState<string | null>(null)
  const [images, setImages] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>()
  const [producerDialogOpen, setProducerDialogOpen] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchTotal = async () => {
      const weiboIds = selectedProducer === 'all' ? null : producers.find(p => p.id === selectedProducer)?.weiboIds;
      const total = await getPicsCount(weiboIds);
      setTotal(total);
      setHasMore(PAGE_SIZE * page < total);
    };
    fetchTotal();
    setPage(1);
    setImages([]);
    loadImages(1);
  }, [selectedProducer]);

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
      const weiboIds = selectedProducer === 'all' ? null : producers.find(p => p.id === selectedProducer)?.weiboIds
      const result = await getPics(currentPage, PAGE_SIZE, weiboIds)
      setImages(prev => currentPage === 1 ? result.items : [...prev, ...result.items])
      setHasMore(PAGE_SIZE * currentPage < total)
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
            <SelectValue placeholder="全部生产者" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部生产者</SelectItem>
              {(producers ?? []).map((producer) => (
                <SelectItem key={producer.id} value={producer.id}>
                  {producer.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>



        <div className="text-sm text-muted-foreground">
          共 {total} 张图片 · 已加载 {images.length} 张 · 剩余 {total - images.length} 张
        </div>

        <ProducerDialog
          open={producerDialogOpen}
          onOpenChange={setProducerDialogOpen}
          producers={producers}
          onSuccess={refreshProducers}
        />
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => setProducerDialogOpen(true)}
        >
          管理生产者
        </Button>
      </div>

      <PhotoProvider>
        <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 6 }} spacing={1}>
          {(images ?? []).map((image, index) => (
            <GalleryItem 
              key={selectedProducer + '_' + index}
              image={image}
              index={index}
              selectedProducer={selectedProducer}
              producers={producers}
            />
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