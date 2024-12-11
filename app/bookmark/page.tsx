"use client"

import { useState } from "react"
import { Plus, Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BookmarkCard } from "../../src/components/bookmark/BookmarkCard"
import { Sidebar } from "../../src/components/bookmark/Sidebar"
import NewBookmarkCard from "../../src/components/bookmark/NewBookMarkCard"
import { useMemoizedFn, useRequest } from "ahooks"
import { getAllBookmarks, getSingleBookmark } from "../../src/api/bookmark"
import { Bookmark } from "@prisma/client"
import { produce } from "immer"

export default function BookmarkManager() {
    const [searchQuery, setSearchQuery] = useState("")
    const { data: bookmarks = [], mutate } = useRequest(getAllBookmarks, {
        cacheKey: 'bookmarks',
    });

    const onSubmit = useMemoizedFn(async (newBookmark: Bookmark) => {
        mutate(produce(bookmarks, draft => {
            draft.unshift({ ...newBookmark, tags: [] });
        }));
        const updatedBookmark = await getSingleBookmark(newBookmark.id);
        if (updatedBookmark) {
            mutate(bookmarks => {
                return bookmarks?.map(bookmark => {
                    if (bookmark.id === updatedBookmark.id) {
                        return updatedBookmark;
                    }
                    return bookmark;
                });
            });
        }
    })

    return (
        <div className="border-t">
            <div>
                {/* <Sidebar
                    categories={mockCategories}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                /> */}
                <div className="border-l">
                    <div className="h-full px-4 py-6 lg:px-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="搜索"
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4">
                            <NewBookmarkCard onSubmit={onSubmit} />
                            {bookmarks.map((bookmark) => (
                                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}