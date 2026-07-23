import { MediaType } from "@/api/gallery/type"
import { ProducerTag } from '@prisma/client';
import { Producer } from "@prisma/client"

// 定义ProducerWithCount类型
type ProducerWithCount = Producer & {
  tags: ProducerTag[]
  mediaCount: number
  postCount: number
}
import { FilterControls } from './filter-controls'

interface GalleryFiltersProps {
  producers: ProducerWithCount[]
  tags: ProducerTag[]
  stats: {
    uploaded: number
    pending: number
  }
  total: number
  initialState: {
    producer: string | null
    sort: 'asc' | 'desc' | 'random'
    type: MediaType
    tags: string[] | null
  }
}

export function GalleryFilters({
  producers,
  tags,
  stats,
  total,
  initialState
}: GalleryFiltersProps) {
  return (
    <div className="p-4 border-b bg-background">
      <div className="max-w-screen-2xl mx-auto">
        <FilterControls
          producers={producers}
          tags={tags}
          stats={stats}
          total={total}
          initialState={initialState}
        />
      </div>
    </div>
  )
}