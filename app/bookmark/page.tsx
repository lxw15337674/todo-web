"use client"

import { useState } from "react"
import { Plus, Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCard, Category } from "../../src/components/bookmark/BookmarkCard"
import { Sidebar } from "../../src/components/bookmark/Sidebar"
import { NewBookmarkCard } from "../../src/components/bookmark/NewBookMarkCard"

// Mock data
const mockCategories: Category[] = [
    { id: "work", name: "工作", count: 5 },
    { id: "personal", name: "个人", count: 3 },
    { id: "shopping", name: "购物", count: 2 },
]

const mockBookmarks: Bookmark[] = [
    {
        id: "1",
        title: "Settings",
        url: "https://omnivore.app",
        description: "Application settings and configurations",
        createdAt: new Date("2023-11-04"),
        isStarred: false,
    },
    {
        id: "2",
        title: "利民终极视界 360 ARGB 水冷开售",
        url: "https://www.ithome.com",
        description: "0.5mm 宽边框冷头屏，现手价 799 元...",
        image: "/placeholder.svg",
        createdAt: new Date("2023-11-04"),
        isStarred: false,
    },
]

export default function BookmarkManager() {
    const [activeCategory, setActiveCategory] = useState("uncategorized")
    const [searchQuery, setSearchQuery] = useState("")
    const filteredBookmarks = mockBookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="border-t">
            <div className="grid lg:grid-cols-[260px_1fr]">
                <Sidebar
                    categories={mockCategories}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                />
                <div className="border-l">
                    <div className="h-full px-4 py-6 lg:px-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="搜索 (Ctrl B)"
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <NewBookmarkCard createBookmark={()=>{}}  />
                            {filteredBookmarks.map((bookmark) => (
                                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

