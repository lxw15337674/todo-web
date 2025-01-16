'use client'
import { getProducersWithCount } from "@/api/gallery/producer"
import { getPics, getPicsCount } from "@/api/gallery/media"
import { useEffect, useRef } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Masonry } from "@mui/lab"
import { Button } from "@/components/ui/button"
import { PhotoProvider } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { ProducerDialog } from "@/public/app/gallery/components/producer-dialog"
import { UploadStatus } from "@prisma/client"
import { GalleryItem } from './components/gallery-Item'
import { useRequest, useSessionStorageState } from "ahooks"
import { getPostCount } from "@/api/gallery/post"
import { Media, Producer, Post } from '@prisma/client'
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MediaType } from "@/api/gallery/type"

const PAGE_SIZE = 20*6

type MediaWithRelations = Media & {
  producer: Producer | null
  post: Post | null
}

interface GalleryState {
  producer: string | null
  sort: 'asc' | 'desc'
  type: MediaType|null
}

const DEFAULT_STATE: GalleryState = {
  producer: null,
  sort: 'desc',
  type: MediaType.image
}

export default function ImagePage() {
  const { data: producers = [], refresh: refreshProducers } = useRequest(getProducersWithCount, {
    cacheKey: 'gallery-producers'
  })
  const [state, setState] = useSessionStorageState<GalleryState>('gallery-state', { 
    defaultValue: DEFAULT_STATE 
  })

  const { data: images = [], loading, run: loadImages } = useRequest<MediaWithRelations[], [number]>(
    async (page: number): Promise<MediaWithRelations[]> => {
      const result = await getPics(
        page, 
        PAGE_SIZE, 
        state?.producer ?? null, 
        state?.sort ?? 'desc',
        state?.type ?? null
      )
      return page === 1 ? result : [...(images ?? []), ...result]
    },
    { 
      manual: true,
      throttleWait: 2000,
    }
  )
  
  const { data: total = 0 } = useRequest(
    () => getPicsCount(state?.producer ?? null, state?.type ?? null),
    { 
      refreshDeps: [state],
    }
  )

  const { data: stats } = useRequest(
    async () => {
      const [uploaded, pending] = await Promise.all([
        getPostCount({ status: UploadStatus.UPLOADED, producerId: state?.producer || undefined }),
        getPostCount({ status: UploadStatus.PENDING, producerId: state?.producer || undefined })
      ])
      return { uploaded, pending }
    },
    { 
      refreshDeps: [state?.producer],
    }
  )

  // Infinite scroll
  const loadingRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(1)
  const observerRef = useRef<IntersectionObserver>()

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && PAGE_SIZE * pageRef.current < (total ?? 0)) {
          pageRef.current += 1
          loadImages(pageRef.current)
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [loading, total, loadImages])

  useEffect(() => {
    pageRef.current = 1
    loadImages(1)
  }, [state])

  const [dialogOpen, setDialogOpen] = useSessionStorageState('producer-dialog-open', {
    defaultValue: false
  })
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b bg-background">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">生产者</label>
              <Select 
                value={state?.producer ?? 'all'} 
                onValueChange={value => setState(prev => ({
                  producer: value === 'all' ? null : value,
                  sort: (prev ?? DEFAULT_STATE).sort,
                  type: (prev ?? DEFAULT_STATE).type
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部生产者" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[300px]">
                    <SelectGroup>
                      <SelectItem value="all">全部生产者</SelectItem>
                      {producers.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="truncate">
                            {p.name} ({p.postCount} 帖子 / {p.mediaCount} 图片)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">排序方式</label>
              <Select 
                value={state?.sort ?? 'desc'} 
                onValueChange={sort => setState(prev => ({
                  producer: (prev ?? DEFAULT_STATE).producer,
                  sort: sort as 'asc' | 'desc',
                  type: (prev ?? DEFAULT_STATE).type
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="desc">最新优先</SelectItem>
                    <SelectItem value="asc">最早优先</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">媒体类型</label>
              <Select 
                value={state?.type ?? 'all'} 
                onValueChange={type => setState(prev => ({
                  ...prev ?? DEFAULT_STATE,
                  type: type as MediaType
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="媒体类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="image">图片</SelectItem>
                    <SelectItem value="video">视频</SelectItem>
                    <SelectItem value="livephoto">实况照片</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(true)}
                className="w-full"
              >
                管理生产者
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4 text-sm text-muted-foreground">
            <div>共 {total} 个媒体文件</div>
            <div className="sm:ml-auto">
              已爬取 {stats?.uploaded ?? 0} 帖子 · 待爬取 {stats?.pending ?? 0} 帖子
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-2">
        <PhotoProvider>
          {loading && images.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          ) : (
            <Masonry 
              columns={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6, xxl: 8 }} 
              spacing={2}
              defaultHeight={450}
              defaultColumns={4}
            >
              {images.map((image, index) => (
                <GalleryItem
                  key={image.id}
                  image={image}
                  index={index}
                  selectedProducer={state?.producer ?? null}
                />
              ))}
            </Masonry>
          )}
        </PhotoProvider>

        <div ref={loadingRef} className="py-4 text-center">
          {loading && <p className="text-muted-foreground">加载中...</p>}
          {!loading && images.length > 0 && (
            <p className="text-muted-foreground">
              ---- 已加载 {images.length} / {total} 个媒体文件 ----
            </p>
          )}
        </div>
      </div>

      <ProducerDialog
        open={dialogOpen ?? false}
        onOpenChange={setDialogOpen}
        producers={producers}
        onSuccess={refreshProducers}
      />
    </div>
  )
}