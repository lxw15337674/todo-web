'use client'
import { getGalleryCategories, getImagesByUid, Image as GalleryImage } from "@/api/gallery"
import { usePromise } from "wwhooks"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import InfiniteScroll from 'react-infinite-scroll-component'
import { Masonry } from "@mui/lab"
import Image from "next/image"

const Count = 6*12
const imageLoader = ({ src }: { src: string }) => {
  return src
}

const getPlaceholder = (width: number, height: number) => {
  return `https://placehold.co/${width}x${height}?text=loading`
}

export default function ImagePage() {
  const { data: categories } = usePromise(getGalleryCategories, {
    initialData: [],
    manual: false
  })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 重置页数和图片列表，重新加载
    setPage(0)
    setImages([])
    loadImages(selectedCategory, 0)
  }, [selectedCategory])

  const loadImages = async (category: string | null, page: number) => {
    setLoading(true)
    const newImages = await getImagesByUid(category || '', Count, page * Count)
    setImages(prevImages => [...prevImages, ...newImages])
    setPage(prevPage => prevPage + 1)
    setLoading(false)
  }
  console.log(images)

  return (
    <div className="space-y-2">
      <Select onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-[180px] my-2">
          <SelectValue placeholder="默认全部分类" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Category</SelectLabel>
            {(categories ?? []).map((category) => (
              <SelectItem key={category.uid} value={category.uid}>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <InfiniteScroll
        dataLength={images.length}
        next={() => loadImages(selectedCategory, page)}
        hasMore={!loading}
        loader={<div className="text-center py-4">加载中...</div>}
        endMessage={<div className="text-center py-4">没有更多图片了</div>}
      >
        <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 6 }} spacing={2}>
          {(images ?? []).map((image) => (
            <div key={image.pic_id}>
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-2">
                      <div className="relative w-full aspect-square">
                        <Image
                          src={image.pic_info.large.url}
                          alt={image.pic_id}
                          loader={imageLoader}
                          width={image.pic_info.large.width}
                          height={image.pic_info.large.height}
                          loading="lazy"
                          blurDataURL={getPlaceholder(image.pic_info.large.width, image.pic_info.large.height)}
                          placeholder="blur"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="relative w-full aspect-auto">
                    <Image
                      src={image.pic_info.original.url}
                      alt={image.pic_id}
                      loader={imageLoader}
                      width={image.pic_info.large.width}
                      height={image.pic_info.large.height}
                      blurDataURL={getPlaceholder(image.pic_info.large.width, image.pic_info.large.height)}
                      placeholder="blur"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </Masonry>
      </InfiniteScroll>
    </div>
  )
}