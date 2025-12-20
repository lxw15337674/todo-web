'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRequest } from 'ahooks'
import { Masonry } from '@mui/lab'
import { PhotoProvider } from 'react-photo-view'
import { getPics } from '@/api/gallery/media'
import { MediaType } from '@/api/gallery/type'
import { GalleryItem } from './gallery-Item'
import { Skeleton } from '@/components/ui/skeleton'
import 'react-photo-view/dist/react-photo-view.css'

interface GalleryClientProps {
  initialImages: any[]
  initialState: {
    producer: string | null
    sort: 'asc' | 'desc' | 'random'
    type: MediaType
    tags: string[] | null
  }
  total: number
  pageSize: number
}

export function GalleryClient({ 
  initialImages, 
  initialState, 
  total, 
  pageSize 
}: GalleryClientProps) {
  const searchParams = useSearchParams()
  const [images, setImages] = useState(initialImages)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialImages.length < total)
  const isLoadingMoreRef = useRef(false)
  const observerRef = useRef<HTMLDivElement>(null)

  // 当URL参数变化时重置数据
  useEffect(() => {
    const currentProducer = searchParams.get('producer')
    const currentSort = searchParams.get('sort') || 'desc'
    const currentType = searchParams.get('type') || MediaType.image
    const currentTags = searchParams.get('tags')

    // 检查参数是否发生变化
    const paramsChanged = 
      currentProducer !== initialState.producer ||
      currentSort !== initialState.sort ||
      currentType !== initialState.type ||
      (currentTags || null) !== (initialState.tags?.[0] || null)

    if (paramsChanged) {
      // 参数变化时，重新加载数据将由服务端处理
      // 这里只需要重置客户端状态
      setImages(initialImages)
      setPage(1)
      setHasMore(initialImages.length < total)
      isLoadingMoreRef.current = false
    }
  }, [searchParams, initialImages, initialState, total])

  // 加载更多数据的请求
  const { run: loadMore, loading: loadingMore } = useRequest(
    async () => {
      if (isLoadingMoreRef.current || !hasMore) return []
      
      isLoadingMoreRef.current = true
      const nextPage = page + 1
      
      const producer = searchParams.get('producer')
      const sort = (searchParams.get('sort') || 'desc') as 'asc' | 'desc' | 'random'
      const type = (searchParams.get('type') || MediaType.image) as MediaType
      const tags = searchParams.get('tags') ? [searchParams.get('tags')!] : null
      
      const newImages = await getPics(nextPage, pageSize, producer, sort, type, tags)
      
      setImages(prev => [...prev, ...newImages])
      setPage(nextPage)
      setHasMore(newImages.length === pageSize)
      isLoadingMoreRef.current = false
      
      return newImages
    },
    {
      manual: true,
      onError: () => {
        isLoadingMoreRef.current = false
      }
    }
  )

  // 无限滚动观察器
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !loadingMore && !isLoadingMoreRef.current) {
          loadMore()
        }
      },
      {
        rootMargin: '200px'
      }
    )

    const currentRef = observerRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, loadingMore, loadMore])

  // 生成唯一的key
  const generateKey = useCallback((image: any, index: number) => {
    const producer = searchParams.get('producer') || 'all'
    const sort = searchParams.get('sort') || 'desc'
    const type = searchParams.get('type') || MediaType.image
    return `${image.id}-${producer}-${sort}-${type}-${index}`
  }, [searchParams])

  return (
    <div className="flex-1 p-2">
      <PhotoProvider
        speed={() => 300}
        easing={(type) => (type === 2 ? 'cubic-bezier(0.36, 0, 0.66, -0.56)' : 'cubic-bezier(0.34, 1.56, 0.64, 1)')}
      >
        <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={1} sequential>
          {images.map((image, index) => (
            <GalleryItem
              key={generateKey(image, index)}
              image={image}
              index={index}
            />
          ))}
        </Masonry>
      </PhotoProvider>

      {/* 加载更多的触发器和加载状态 */}
      {hasMore && (
        <div ref={observerRef} className="mt-4">
          {loadingMore && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 没有更多数据时的提示 */}
      {!hasMore && images.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          已加载全部 {images.length} 项内容
        </div>
      )}

      {/* 没有数据时的提示 */}
      {images.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-lg mb-2">暂无内容</div>
          <div className="text-sm">尝试调整筛选条件或检查数据源</div>
        </div>
      )}
    </div>
  )
}