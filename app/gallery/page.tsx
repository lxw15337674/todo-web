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
}

const DEFAULT_STATE: GalleryState = {
  producer: null,
  sort: 'desc'
}
const cacheKey = 'gallery-producers'

export default function ImagePage() {
  const { data: producers = [], refresh: refreshProducers } = useRequest(getProducersWithCount, {
    cacheKey,
    staleTime: 5*60*1000,// 数据保鲜时间5分钟
    cacheTime: 24 * 60 * 60 * 1000, // 缓存24小时
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
      const result = await getPics(page, PAGE_SIZE, state?.producer ?? null, state?.sort ?? 'desc')
      return page === 1 ? result : [...(images ?? []), ...result]
    },
    { 
      manual: true,
      throttleWait: 2000,
    }
  )
  
  const { data: total = 0, run: fetchTotal } = useRequest(
    () => getPicsCount(state?.producer ?? null),
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
  }, [state?.producer, state?.sort, fetchTotal, loadImages])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useSessionStorageState('producer-dialog-open', {
    defaultValue: false
  })

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center gap-2">
        <Select 
          value={state?.producer ?? 'all'} 
          onValueChange={value => setState(prev => ({
            producer: value === 'all' ? null : value,
            sort: (prev ?? DEFAULT_STATE).sort
          }))}
        >
          <SelectTrigger className="w-[180px] my-2">
            <SelectValue placeholder="全部生产者" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部生产者</SelectItem>
              {producers.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.postCount} 帖子 / {p.mediaCount} 图片)
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select 
          value={state?.sort ?? 'desc'} 
          onValueChange={sort => setState(prev => ({
            producer: (prev ?? DEFAULT_STATE).producer,
            sort: sort as 'asc' | 'desc'
          }))}
        >
          <SelectTrigger className="w-[120px] my-2">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="desc">最新优先</SelectItem>
              <SelectItem value="asc">最早优先</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          共 {total} 张图片
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          已爬取 {stats?.uploaded ?? 0} 帖子 · 待爬取 {stats?.pending ?? 0} 帖子
        </div>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          管理生产者
        </Button>
      </div>

      <PhotoProvider>
        <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 6 }} spacing={1}>
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
            ---- 已加载 {images.length} / {total} 张图片 ----
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