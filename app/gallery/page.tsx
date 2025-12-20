import { Suspense } from 'react'
import { getProducersWithCount, getProducerTags } from "@/api/gallery/producer"
import { getPics, getPicsCount } from "@/api/gallery/media"
import { getPostCount } from "@/api/gallery/post"
import { UploadStatus } from "@prisma/client"
import { MediaType } from "@/api/gallery/type"
import { GalleryClient } from './components/gallery-client'
import { GalleryFilters } from './components/gallery-filters'
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = 'force-dynamic';

const INITIAL_PAGE_SIZE = 100
const LOAD_MORE_PAGE_SIZE = 40

interface SearchParams {
  producer?: string
  sort?: 'asc' | 'desc' | 'random'
  type?: MediaType
  tags?: string
}
// ... (imports remain the same)

// ...

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  // 解析查询参数
  const params = await searchParams
  const producer = params.producer || null
  const sort = (params.sort || 'desc') as 'asc' | 'desc' | 'random'
  const type = params.type || MediaType.image
  const tags = params.tags ? [params.tags] : null

  // Generate a random seed for consistent pagination during this session
  // This seed is generated on the server for the initial render and passed to the client
  const seed = sort === 'random' ? Math.floor(Math.random() * 1000000) : undefined

  // 并行获取所有初始数据
  const [
    producers,
    tagsList,
    initialImages,
    total,
    stats
  ] = await Promise.all([
    getProducersWithCount(),
    getProducerTags(),
    getPics(1, INITIAL_PAGE_SIZE, producer, sort, type, tags, seed),
    getPicsCount(producer, type, tags),
    Promise.all([
      getPostCount({ status: UploadStatus.UPLOADED, producerId: producer || undefined }),
      getPostCount({ status: UploadStatus.PENDING, producerId: producer || undefined })
    ]).then(([uploaded, pending]) => ({ uploaded, pending }))
  ])

  const initialState = {
    producer,
    sort,
    type,
    tags
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 服务端渲染的筛选器 */}
      <Suspense fallback={<Skeleton className="h-32 border-b" />}>
        <GalleryFilters 
          producers={producers}
          tags={tagsList}
          stats={stats}
          total={total}
          initialState={initialState}
        />
      </Suspense>

      {/* 客户端渲染的图片网格 */}
      <Suspense fallback={<GalleryLoadingSkeleton />}>
        <GalleryClient 
          initialImages={initialImages}
          initialState={initialState}
          total={total}
          pageSize={LOAD_MORE_PAGE_SIZE}
          initialSeed={seed}
        />
      </Suspense>
    </div>
  )
}



export async function generateStaticParams() {
  try {
    const [producers, tags] = await Promise.all([
      getProducersWithCount(),
      getProducerTags()
    ])
    
    const params = []
    
    // 默认页面
    params.push({})
    
    // 热门生产者的页面
    const topProducers = producers
      .sort((a, b) => b.mediaCount - a.mediaCount)
      .slice(0, 10)
    
    for (const producer of topProducers) {
      params.push({ producer: producer.id })
      params.push({ producer: producer.id, type: 'video' })
    }
    
    // 不同媒体类型的页面
    params.push({ type: 'video' })
    params.push({ type: 'livephoto' })
    
    return params
  } catch (error) {
    console.error('Error generating static params:', error)
    return [{}]
  }
}