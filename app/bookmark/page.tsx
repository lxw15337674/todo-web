"use client"

import { useState } from "react"
import { Plus, Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { BookmarkCard } from "../../src/components/bookmark/BookmarkCard"
import NewBookmarkCard from "../../src/components/bookmark/NewBookMarkCard"
import { useMemoizedFn, useRequest } from "ahooks"
import { BookmarkTagWithCount, getAllBookmarks, getSingleBookmark } from "../../src/api/bookmark"
import { Bookmark } from "@prisma/client"
import { produce } from "immer"
import BookmarkSidebar from "./bookmark-sidebar"
import { useSidebar } from "../../src/components/ui/sidebar"
import { Label } from "../../src/components/ui/label"
import { Button } from "../../src/components/ui/button"

export default function BookmarkManager() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTag, setSelectedTag] = useState<BookmarkTagWithCount | null>(null)
    const { data: bookmarks = [], mutate } = useRequest(() => getAllBookmarks(
        {
            keyword: searchQuery,
            tagId: selectedTag?.id
        }
    ), {
        debounceWait: 500,
        cacheKey: 'bookmarks',
        refreshDeps: [searchQuery, selectedTag],
    });
    const {
        state,
    } = useSidebar()
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
        <div className="relative  w-full ">
            {/* <Sidebar
                    categories={mockCategories}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                /> */}
            <BookmarkSidebar selectedTag={selectedTag} onSelectTag={setSelectedTag} />
            <div className={`h-full p-4 ${state === 'expanded' ? 'md:ml-64' : ''} duration-200 space-y-4`} >
                <div className="flex items-center gap-4 ">
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
                {(searchQuery || selectedTag) && (
                    <div className="flex items-center gap-2">
                        {searchQuery && (
                            <>
                                <Label className="text-muted-foreground">搜索关键字：</Label>
                                <Button
                                    size="sm"
                                    className="h-6"
                                    onClick={() => setSearchQuery('')}
                                >{searchQuery}
                                    <X className="w-4 h-4 ml-1" />
                                </Button>
                            </>
                        )}
                        {selectedTag && (
                            <>
                                <Label className="text-muted-foreground">筛选标签：</Label>
                                <Button
                                    size="sm"
                                    className="h-6"
                                    onClick={() => setSelectedTag(null)}
                                >
                                    {selectedTag.name}
                                    <X className="w-4 h-4 ml-1" />
                                </Button>
                            </>
                        )}
                    </div>
                )}
                <div className="grid md:grid-cols-4 gap-4">
                    <NewBookmarkCard onSubmit={onSubmit} />
                    {bookmarks.map((bookmark) => (
                        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                    ))}
                </div>
            </div>
        </div>
    )
}