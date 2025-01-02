'use client'
import { getGalleryCategories, getImagesByUid, Image } from "@/api/gallery"
import { usePromise } from "wwhooks"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry from 'react-masonry-component'

export default function ImagePage() {
  const { data: categories } = usePromise(getGalleryCategories, {
    initialData: [],
    manual: false
  })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [images, setImages] = useState<Image[]>([])
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
    const newImages = await getImagesByUid(category || '', 20, page * 20)
    setImages(prevImages => [...prevImages, ...newImages])
    setPage(prevPage => prevPage + 1)
    setLoading(false)
  }
  console.log(images)

  const masonryOptions = {
    transitionDuration: 0,
    gutter: 16,
    fitWidth: false,
    columnWidth: '.grid-sizer',
    percentPosition: true
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Select onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-[180px]">
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
        hasMore={!loading && images.length > 0}
        loader={<div className="text-center py-4">加载中...</div>}
        endMessage={<div className="text-center py-4">没有更多图片了</div>}
      >
        <Masonry
          className="w-full"
          options={masonryOptions}
          enableResizableChildren
        >
          <div className="grid-sizer w-1/4" />
          {(images ?? []).map((image) => (
            <div key={image.pic_id} className="w-1/4 p-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-2">
                      <img
                        src={image.pic_info.large.url}
                        alt={image.pic_id}
                        className="w-full h-auto"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <img
                    src={image.pic_info.original.url}
                    alt={image.pic_id}
                    className="w-full h-auto"
                  />
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </Masonry>
      </InfiniteScroll>
    </div>
  )
}