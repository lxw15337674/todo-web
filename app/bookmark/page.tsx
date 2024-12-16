'use client'
import { useState } from "react"
import { Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { BookmarkCard } from "../../src/components/bookmark/BookmarkCard"
import NewBookmarkCard from "../../src/components/bookmark/NewBookMarkCard"
import { useMemoizedFn } from "ahooks"
import { BookmarkTagWithCount, getAllBookmarks, getSingleBookmark } from "../../src/api/bookmark"
import { Bookmark } from "@prisma/client"
import { produce } from "immer"
import BookmarkSidebar from "./bookmark-sidebar"
import { useSidebar } from "../../src/components/ui/sidebar"
import { Label } from "../../src/components/ui/label"
import { Button } from "../../src/components/ui/button"
import { isBrowser } from "@/lib/utils"
import useLocalStorageRequest from "../../src/hooks/useLocalStorageRequest"
import { useToast } from "../../src/hooks/use-toast"
const cacheKey = 'bookmarks'

export default function BookmarkManager() {
    const [searchQuery, setSearchQuery] = useState("")
    const { toast } = useToast()
    const [selectedTag, setSelectedTag] = useState<BookmarkTagWithCount | null>(null)
    const { data: bookmarks = [], mutate } = useLocalStorageRequest(() => getAllBookmarks(
        {
            keyword: searchQuery,
            tagId: selectedTag?.id
        }
    ), {
        debounceWait: 500,
        cacheKey,
        setCache: (data) => localStorage.setItem(cacheKey, JSON.stringify(data)),
        getCache: () => JSON.parse(isBrowser() && localStorage.getItem(cacheKey) || '{}'),
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
            toast({
                title: 'AI摘要生成成功',
                description: `书签 ${updatedBookmark!.url} AI摘要生成成功,标题为${updatedBookmark!.title}，标签为${updatedBookmark!.tags.map(tag => tag.name).join(', ')}`
            })
        }
    })

    return (
        <div className="relative  w-full ">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-4">
                    <NewBookmarkCard onSubmit={onSubmit} />
                    {bookmarks.map((bookmark) => (
                        <BookmarkCard key={bookmark.id} bookmark={bookmark}
                            setBookmarks={mutate}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}