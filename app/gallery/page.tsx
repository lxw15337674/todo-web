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
import { GalleryItem } from './components/GalleryItem'
import { useRequest, useSessionStorageState } from "ahooks"
import { getPostCount } from "@/api/gallery/post"
import { safeSessionStorage } from "@/lib/utils"
import { Media, Producer, Post } from '@prisma/client'

const PAGE_SIZE = 5*6

type MediaWithRelations = Media & {
  producer: Producer | null
  post: Post | null
}

interface GalleryState {
  producer: string | null
  sort: 'asc' | 'desc'
  type: 'all' | 'image' | 'video'
}

const DEFAULT_STATE: GalleryState = {
  producer: null,
  sort: 'desc',
  type: 'image'
}
const cacheKey = 'gallery-producers'

export default function ImagePage() {
  const { data: producers = [], refresh: refreshProducers } = useRequest(getProducersWithCount, {
    cacheKey,
    setCache: (data) => safeSessionStorage.setItem(cacheKey, JSON.stringify(data)),
    getCache: () => {
      const cached = safeSessionStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : {};
    },
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
        state?.type === 'all' ? null : state?.type ?? null
      )
      return page === 1 ? result : [...(images ?? []), ...result]
    },
    { 
      manual: true,
      throttleWait: 2000,
    }
  )
  
  const { data: total = 0, run: fetchTotal } = useRequest(
    () => getPicsCount(state?.producer ?? null, state?.type === 'all' ? null : state?.type ?? null),
    { 
      manual: true,
      cacheKey: `gallery-total-${state?.producer}`,
      setCache: (data) => safeSessionStorage.setItem(`gallery-total-${state?.producer}`, JSON.stringify(data)),
      getCache: () => {
        const cached = safeSessionStorage.getItem(`gallery-total-${state?.producer}`);
        return cached ? JSON.parse(cached) : 0;
      }
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
      cacheKey: `gallery-stats-${state?.producer}`,
      setCache: (data) => safeSessionStorage.setItem(`gallery-stats-${state?.producer}`, JSON.stringify(data)),
      getCache: () => {
        const cached = safeSessionStorage.getItem(`gallery-stats-${state?.producer}`);
        return cached ? JSON.parse(cached) : { uploaded: 0, pending: 0 };
      }
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

  // Reset and reload on filter change
  useEffect(() => {
    pageRef.current = 1
    fetchTotal()
    loadImages(1)
  }, [state])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useSessionStorageState('producer-dialog-open', {
    defaultValue: false
  })

  return (
    <div className="space-y-2 p-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select 
            value={state?.producer ?? 'all'} 
            onValueChange={value => setState(prev => ({
              producer: value === 'all' ? null : value,
              sort: (prev ?? DEFAULT_STATE).sort,
              type: (prev ?? DEFAULT_STATE).type
            }))}
          >
            <SelectTrigger className="w-full sm:w-[180px] my-1 sm:my-2">
              <SelectValue placeholder="全部生产者" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectGroup>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 cursor-pointer">
                  <SelectItem value="all">全部生产者</SelectItem>
                  {producers.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="truncate">
                        {p.name} ({p.postCount} 帖子 / {p.mediaCount} 图片)
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select 
            value={state?.sort ?? 'desc'} 
            onValueChange={sort => setState(prev => ({
              producer: (prev ?? DEFAULT_STATE).producer,
              sort: sort as 'asc' | 'desc',
              type: (prev ?? DEFAULT_STATE).type
            }))}
          >
            <SelectTrigger className="w-full sm:w-[120px] my-1 sm:my-2">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="desc">最新优先</SelectItem>
                <SelectItem value="asc">最早优先</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select 
            value={state?.type ?? 'all'} 
            onValueChange={type => setState(prev => ({
              ...prev ?? DEFAULT_STATE,
              type: type as 'all' | 'image' | 'video'
            }))}
          >
            <SelectTrigger className="w-full sm:w-[120px] my-1 sm:my-2">
              <SelectValue placeholder="媒体类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="image">图片</SelectItem>
                <SelectItem value="video">视频</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto text-sm text-muted-foreground">
          <div>共 {total} 个媒体文件</div>
          <div className="sm:ml-auto">
            已爬取 {stats?.uploaded ?? 0} 帖子 · 待爬取 {stats?.pending ?? 0} 帖子
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={() => setDialogOpen(true)}
          className="w-full sm:w-auto sm:ml-auto"
        >
          管理生产者
        </Button>
      </div>

      <PhotoProvider>
        <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }} spacing={1}>
          {(images ?? []).map((image: MediaWithRelations, index: number) => (
            <GalleryItem
              key={image.id}
              image={image}
              index={index}
              selectedProducer={state?.producer ?? null}
            />
          ))}
        </Masonry>
      </PhotoProvider>

      <div ref={loadingRef} className="py-4 text-center">
        {loading && <p className="text-muted-foreground">加载中...</p>}
        {!loading && images.length > 0 && (
          <p className="text-muted-foreground">
            ---- 已加载 {images.length} / {total} 个媒体文件 ----
          </p>
        )}
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