'use client'
import { getGalleryCategories, getImagesByUid, Image } from "@/api/gallery"
import { usePromise } from "wwhooks"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const Count = 100
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
    const newImages = await getImagesByUid(category || '', Count, page * Count)
    setImages(prevImages => [...prevImages, ...newImages])
    setPage(prevPage => prevPage + 1)
    setLoading(false)
  }
  console.log(images)
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

      <ScrollArea
        className="h-[calc(100vh-16rem)]"
        onScrollCapture={(e) => {
          const target = e.target as HTMLDivElement;
          const isBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 100;
          console.log(isBottom)
          if (isBottom && !loading) {
            loadImages(selectedCategory, page);
          }
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(images ?? []).map((image) => (
            <Dialog key={image.pic_id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-2">
                    <div className="relative w-full h-[200px]">
                      <img
                        src={image.pic_info.large.url}
                        alt={image.pic_id}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
            </Dialog>
          ))}
        </div>
      </ScrollArea>
      {loading && <div>加载中...</div>}
    </div>
  )
}