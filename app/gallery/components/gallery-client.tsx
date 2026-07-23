'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRequest } from 'ahooks'
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
  initialSeed?: number
  loadMorePageSize?: number
}

export function GalleryClient({ 
  initialImages, 
  initialState, 
  total, 
  pageSize,
  initialSeed,
  loadMorePageSize = 40
}: GalleryClientProps) {
  const searchParams = useSearchParams()
  const [images, setImages] = useState(initialImages)
  // Page state is kept for potential URL syncing but not used for fetching anymore
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialImages.length < total)
  const isLoadingMoreRef = useRef(false)
  const observerRef = useRef<HTMLDivElement>(null)
  
  // 保持 seed 在客户端的持久化，但允许服务端更新它
  const seedRef = useRef(initialSeed)

  // 当服务端返回新的 seed 时（例如刷新页面或参数改变导致 RSC 重运行），更新 ref
  useEffect(() => {
    seedRef.current = initialSeed
  }, [initialSeed])

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
      
      const producer = searchParams.get('producer')
      const sort = (searchParams.get('sort') || 'desc') as 'asc' | 'desc' | 'random'
      const type = (searchParams.get('type') || MediaType.image) as MediaType
      const tags = searchParams.get('tags') ? [searchParams.get('tags')!] : null
      
      // Calculate skip based on current loaded images
      const currentCount = images.length;
      
      // Use explicit skip for pagination to handle mixed page sizes (100 initial -> 40 subsequent)
      const newImages = await getPics(
        1, // page (ignored when skip is present)
        loadMorePageSize, // pageSize for this batch
        producer, 
        sort, 
        type, 
        tags, 
        seedRef.current,
        currentCount // explicitSkip
      )
      
      setImages(prev => [...prev, ...newImages])
      setPage(prev => prev + 1)
      setHasMore(images.length + newImages.length < total)
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
        <div 
          className="masonry-grid"
          style={{
            columnCount: 2,
            columnGap: '0.5rem',
          }}
        >
          <style jsx>{`
            @media (min-width: 640px) {
              .masonry-grid {
                column-count: 3 !important;
              }
            }
            @media (min-width: 768px) {
              .masonry-grid {
                column-count: 4 !important;
              }
            }
            @media (min-width: 1024px) {
              .masonry-grid {
                column-count: 5 !important;
              }
            }
            @media (min-width: 1280px) {
              .masonry-grid {
                column-count: 6 !important;
              }
            }
          `}</style>
          {images.map((image, index) => (
            <div key={generateKey(image, index)} className="mb-2 break-inside-avoid">
              <GalleryItem
                image={image}
                index={index}
              />
            </div>
          ))}
        </div>
      </PhotoProvider>

      {/* 加载更多的触发器和加载状态 */}
      {hasMore && (
        <div ref={observerRef} className="mt-4">
          {loadingMore && (
            <div 
              className="masonry-grid"
              style={{
                columnCount: 2,
                columnGap: '0.5rem',
              }}
            >
              <style jsx>{`
                @media (min-width: 640px) {
                  .masonry-grid {
                    column-count: 3 !important;
                  }
                }
                @media (min-width: 768px) {
                  .masonry-grid {
                    column-count: 4 !important;
                  }
                }
                @media (min-width: 1024px) {
                  .masonry-grid {
                    column-count: 5 !important;
                  }
                }
                @media (min-width: 1280px) {
                  .masonry-grid {
                    column-count: 6 !important;
                  }
                }
              `}</style>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="mb-2 break-inside-avoid">
                  <Skeleton className="aspect-[3/4] rounded-lg w-full" />
                </div>
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