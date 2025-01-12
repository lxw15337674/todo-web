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
import { Media, UploadStatus } from "@prisma/client"
import { GalleryItem } from './components/GalleryItem'
import { useMemoizedFn, useRequest, useSessionStorageState } from "ahooks"

const PAGE_SIZE = 6 * 6

type SortOrder = 'asc' | 'desc'

interface SortOption {
  value: SortOrder
  label: string
}

interface GalleryState {
  producer: string | null
  sort: SortOrder
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'desc', label: '最新优先' },
  { value: 'asc', label: '最早优先' },
]

const DEFAULT_GALLERY_STATE: GalleryState = {
  producer: null,
  sort: 'desc'
}

export default function ImagePage() {
  const { data: producers=[], refresh: refreshProducers } = useRequest(getProducers, {
    manual: false
  })
  const [galleryState, setGalleryState] = useSessionStorageState<GalleryState>(
    'gallery-state',
    { defaultValue: DEFAULT_GALLERY_STATE }
  )
  const selectedProducer = galleryState?.producer ?? null
  const sortOrder = galleryState?.sort ?? 'desc'
  const [images, setImages] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>()
  const [producerDialogOpen, setProducerDialogOpen] = useState(false)
  const [total, setTotal] = useState(0)
  const [unUploadedCount, setUnUploadedCount] = useState(0)

  const fetchTotal = useMemoizedFn(async () => {
    const weiboIds = selectedProducer === 'all' ? null : producers.find(p => p.id === selectedProducer)?.weiboIds;
    const total = await getPicsCount(weiboIds);
    const unUploadedCount = await getPicsCount(weiboIds, UploadStatus.PENDING);
    setTotal(total);
    setUnUploadedCount(unUploadedCount);
    setHasMore(PAGE_SIZE * page < total);
  })

  useEffect(() => {
    fetchTotal();
    setPage(1);
    setImages([]);
  }, [selectedProducer, sortOrder]);

  useEffect(() => {
    if (!loading && page > 0) {
      loadImages(page);
    }
  }, [page, selectedProducer, sortOrder]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage(prev => prev + 1)
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
  }, [loading, hasMore])

  const loadImages = useMemoizedFn(async (currentPage: number) => {
    if (loading) return
    setLoading(true)
    try {
      const weiboIds = selectedProducer === 'all' ? null : producers.find(p => p.id === selectedProducer)?.weiboIds
      const result = await getPics(currentPage, PAGE_SIZE, weiboIds, sortOrder)
      setImages(prev => currentPage === 1 ? result.items : [...prev, ...result.items])
      setHasMore(PAGE_SIZE * currentPage < total)
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    console.log(galleryState?.sort,sortOrder)
  }, [galleryState?.sort,sortOrder])

  const updateSelectedProducer = useMemoizedFn((value: string) => {
    const newValue = value === 'all' ? null : value
    setGalleryState({ ...DEFAULT_GALLERY_STATE, producer: newValue })
  })

  const updateSortOrder = useMemoizedFn((value: string) => {
    setGalleryState({ ...DEFAULT_GALLERY_STATE, sort: value as SortOrder })
  })

  const handleProducerDialogChange = useMemoizedFn((open: boolean) => {
    setProducerDialogOpen(open)
  })

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center gap-2">
        <Select value={selectedProducer ?? 'all'} onValueChange={updateSelectedProducer}>
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

        <Select value={sortOrder} onValueChange={updateSortOrder}>
          <SelectTrigger className="w-[120px] my-2">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>


        
        <div className="ml-auto text-sm text-muted-foreground">
          共 {total} 张图片 / {unUploadedCount} 张未上传
        </div>
        <Button
          variant="outline"
          onClick={() => handleProducerDialogChange(true)}
        >
          管理生产者
        </Button>
      </div>

      <PhotoProvider>
        <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 6 }} spacing={1}>
          {(images ?? []).map((image, index) => (
            <GalleryItem 
              key={image.id}
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
      <ProducerDialog
        open={producerDialogOpen}
        onOpenChange={handleProducerDialogChange}
        producers={producers}
        onSuccess={refreshProducers}
      />
    </div>
  )
}