'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useCallback, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"

interface ImageItem {
  id: string
  url: string
  name: string
  width: number
  height: number
  placeholder: string
}

export default function ImagePage() {
  const [images, setImages] = useState<ImageItem[]>([])

  // 生成占位图片URL
  const getPlaceholder = (width: number, height: number) => {
    return `https://placehold.co/${width}x${height}/F4F4F5/A1A1AA?text=Loading...&font=roboto`
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const objectUrl = URL.createObjectURL(file)
      
      const img = new Image()
      img.onload = () => {
        setImages((prev) => [...prev, {
          id: Math.random().toString(36).substring(7),
          url: objectUrl,
          name: file.name,
          width: img.width,
          height: img.height,
          placeholder: getPlaceholder(img.width, img.height)
        }])
      }
      img.src = objectUrl
    })
  }

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file)
        
        const img = new Image()
        img.onload = () => {
          setImages((prev) => [...prev, {
            id: Math.random().toString(36).substring(7),
            url: objectUrl,
            name: file.name,
            width: img.width,
            height: img.height,
            placeholder: getPlaceholder(img.width, img.height)
          }])
        }
        img.src = objectUrl
      }
    })
  }, [])

  // 初始化时添加一些示例图片
  useEffect(() => {
    const demoImages = [
      { width: 800, height: 600 },
      { width: 600, height: 800 },
      { width: 800, height: 800 },
      { width: 1200, height: 600 },
    ].map((size) => ({
      id: Math.random().toString(36).substring(7),
      url: `https://placehold.co/${size.width}x${size.height}/2563EB/FFFFFF?text=Demo+Image`,
      name: `Demo ${size.width}x${size.height}`,
      width: size.width,
      height: size.height,
      placeholder: getPlaceholder(size.width, size.height)
    }))

    setImages(demoImages)
  }, [])

  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url)
        }
      })
    }
  }, [images])

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

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

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <Dialog key={image.id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-2">
                    <div className="relative w-full h-48">
                      <Image
                        src={image.url}
                        alt={image.name}
                        fill
                        className="object-cover rounded-md"
                        unoptimized
                        placeholder="blur"
                        blurDataURL={image.placeholder}
                      />
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <div className="relative w-full" style={{ height: '70vh' }}>
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-contain"
                    unoptimized
                    placeholder="blur"
                    blurDataURL={image.placeholder}
                  />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 