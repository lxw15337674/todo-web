'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useCallback, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { getImages, uploadImage, deleteImage, ImageItem } from "@/api/gallery"
import { englishToday } from "@/api/fishingTime"
import { usePromise } from "wwhooks"

export default function ImagePage() {
  const { data: images, mutate: setImages } = usePromise(getImages, {
      manual: false,
      initialData: [],
    });
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)

  // 添加删除图片的函数
  const handleDelete = (id: string) => {
    deleteImage(id)
      .then(() => {
        setImages(prev => prev.filter(image => image.id !== id))
      })
      .catch(() => {
        // 处理错误
      })
  }

  // 修改 handleFileChange 使用 API 上传
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      uploadImage(file)
        .then((newImage: ImageItem) => {
          setImages((prev) => [...prev, newImage])
        })
        .catch(() => {
          // 处理错误
        })
    })
  }

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        uploadImage(file)
          .then((newImage: ImageItem) => {
            setImages((prev) => [...prev, newImage])
          })
          .catch(() => {
            // 处理错误
          })
      }
    })
  }, [])

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }
  console.log(images)
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              id="image-upload"
              onChange={handleFileChange}
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  拖放图片到此处，或点击上传
                </p>
                <Button variant="outline">
                  选择图片
                </Button>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(images ?? [])?.map((image) => (
            <Dialog key={image.id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-2">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-auto"
                />
                <Button onClick={() => handleDelete(image.id)}>删除</Button>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </ScrollArea> */}
    </div>
  )
}
