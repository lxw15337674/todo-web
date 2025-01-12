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
import { Media, Producer, Post } from "@prisma/client"
import { GalleryItem } from './components/GalleryItem'
import { useRequest, useDebounceFn, useThrottleFn } from "ahooks"
import { getPostStats } from "@/api/gallery/post"

const PAGE_SIZE = 6 * 6

type MediaWithRelations = Media & {
  producer: Producer | null;
  post: Post | null;
}

export default function ImagePage() {
  const { data: producers=[], refresh: refreshProducers } = useRequest(getProducers, {
    manual: false
  })
  const [selectedProducer, setSelectedProducer] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>()
  const [producerDialogOpen, setProducerDialogOpen] = useState(false)
  const [imagesList, setImagesList] = useState<MediaWithRelations[]>([])

  const { data: postsStats } = useRequest(
    () => getPostStats(selectedProducer || undefined),
    {
      manual: false
    }
  );

  const { data: total = 0 } = useRequest(
    () => getPicsCount(selectedProducer),
    {
      manual: false,
      refreshDeps: [selectedProducer]
    }
  );

  const { data: imagesData, loading, run: loadImages } = useRequest(
    (currentPage: number) => getPics(currentPage, PAGE_SIZE, selectedProducer),
    {
      manual: true,
      refreshDeps: [selectedProducer]
    }
  );

  // 使用节流处理加载更多
  const { run: handleLoadMore } = useThrottleFn(
    async (currentPage: number) => {
      if (loading) return;
      await loadImages(currentPage);
      setPage(currentPage + 1);
    },
    { wait: 1000 }
  );

  // 使用防抖处理生产者选择
  const { run: handleProducerChange } = useDebounceFn(
    (value: string) => {
      setSelectedProducer(value === 'all' ? null : value);
    },
    { wait: 300 }
  );

  useEffect(() => {
    if (imagesData?.items) {
      setImagesList(prev => page === 1 ? imagesData.items : [...prev, ...imagesData.items]);
    }
  }, [imagesData, page]);

  useEffect(() => {
    setPage(1);
    setImagesList([]);
    loadImages(1);
  }, [selectedProducer, loadImages]);

  useEffect(() => {
    setHasMore(PAGE_SIZE * page < total);
  }, [page, total]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          handleLoadMore(page);
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
  }, [loading, hasMore, page, handleLoadMore]);

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center gap-2">
        <Select value={selectedProducer ?? 'all'} onValueChange={handleProducerChange}>
          <SelectTrigger className="w-[180px] my-2">
            <SelectValue placeholder="全部生产者" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部生产者</SelectItem>
              {producers.map((producer) => (
                <SelectItem key={producer.id} value={producer.id}>
                  {producer.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground">
          共 {total} 张图片 · 已加载 {imagesList.length} 张
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          已爬取 {postsStats?.uploaded ?? 0} 帖子 · 待爬取 {postsStats?.pending ?? 0} 帖子
        </div>
        <Button
          variant="outline"
          onClick={() => setProducerDialogOpen(true)}
        >
          管理生产者
        </Button>
      </div>

      <PhotoProvider>
        <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 6 }} spacing={1}>
          {imagesList.map((image: MediaWithRelations, index: number) => (
            <GalleryItem 
              key={image.id}
              image={image}
              index={index}
              selectedProducer={selectedProducer}
            />
          ))}
        </Masonry>
      </PhotoProvider>

      <div ref={loadingRef} className="py-4 text-center">
        {loading && <p className="text-muted-foreground">加载中...</p>}
        {!loading && imagesList.length > 0 && (
          <p className="text-muted-foreground">---- 已加载 {imagesList.length} / {total} 张图片 ----</p>
        )}
      </div>
      <ProducerDialog
        open={producerDialogOpen}
        onOpenChange={setProducerDialogOpen}
        producers={producers}
        onSuccess={refreshProducers}
      />
    </div>
  )
}