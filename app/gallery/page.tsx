'use client'
import { getGalleryCategories, getImagesByUid, Image as GalleryImage } from "@/api/gallery"
import { usePromise } from "wwhooks"
import { useEffect, useRef, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Masonry } from "@mui/lab"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

const Count = 6 * 12
const imageLoader = ({ src }: { src: string }) => {
  return src
}

// const getPlaceholder = (width: number, height: number) => {
//   return `https://placehold.co/${width}x${height}?text=loading`
// }

export default function ImagePage() {
  const { data: categories } = usePromise(getGalleryCategories, {
    initialData: [],
    manual: false
  })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>()

  useEffect(() => {
    setPage(0)
    setImages([])
    loadImages(selectedCategory, 0)
  }, [selectedCategory])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadImages(selectedCategory, page)
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
  }, [selectedCategory, page, loading])

  const loadImages = async (category: string | null, page: number) => {
    if (loading) return
    setLoading(true)
    try {
      const newImages = await getImagesByUid(category || '', Count, page * Count)
      setImages(prevImages => [...prevImages, ...newImages])
      setPage(prevPage => prevPage + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2 p-2">
      <Select onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-[180px] my-2">
          <SelectValue placeholder="默认全部分类" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {(categories ?? []).map((category) => (
              <SelectItem key={category.uid} value={category.uid}>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 6 }} spacing={2}>
        {(images ?? []).map((image, index) => (
          <div className="relative group overflow-hidden" key={index}>
            <div className="transform transition-transform duration-300 group-hover:scale-105">
              <Image
                src={image.pic_info.large.url}
                alt={image.pic_id}
                loader={imageLoader}
                width={image.pic_info.large.width}
                height={image.pic_info.large.height}
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(image.wb_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Masonry>

      <div ref={loadingRef} className="py-4 text-center">
        {loading && <p className="text-muted-foreground">加载中...</p>}
        {!loading && images.length > 0 && (
          <p className="text-muted-foreground">---- 已加载 {images.length} 张图片 ----</p>
        )}
      </div>
    </div>
  )
}