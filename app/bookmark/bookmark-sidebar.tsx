'use client'
import { useState } from 'react';
import { BookmarkTagWithCount, getAllBookmarkTags } from "../../src/api/bookmark";
import useLocalStorageRequest from '../../src/hooks/useLocalStorageRequest';
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface BookmarkSidebarProps {
    selectedTag: BookmarkTagWithCount | null;
    onSelectTag: (tag: BookmarkTagWithCount | null) => void;
}

const cacheKey = 'bookmarkTags'

export default function BookmarkSidebar({ selectedTag, onSelectTag }: BookmarkSidebarProps) {
    const { data: tags = [] } = useLocalStorageRequest(getAllBookmarkTags, {
        cacheKey,
    });

    const [filterText, setFilterText] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredTags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(filterText.toLowerCase())
    );

    const TagList = () => (
        <div className="flex flex-col h-full">
            <div className="p-4">
                <h2 className="font-semibold mb-4">标签</h2>
                <input
                    type="text"
                    placeholder="筛选标签"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full px-3 py-1 text-sm border rounded"
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="px-2">
                    {filteredTags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => {
                                if (tag.id === selectedTag?.id) {
                                    onSelectTag(null);
                                } else {
                                    onSelectTag(tag);
                                }
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md mb-1 hover:bg-accent/50 ${tag.id === selectedTag?.id ? 'bg-accent' : ''
                                }`}
                        >
                            <span>{tag.name}</span>
                            <span className="ml-1 text-muted-foreground">({tag.count})</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );

    return (
        <>
            {/* 移动端显示 */}
            <div className="lg:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                        >
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[80%] sm:w-[385px] p-0">
                        <TagList />
                    </SheetContent>
                </Sheet>
            </div>

            {/* 桌面端显示 */}
            <aside className="fixed left-0 top-[53px] h-[calc(100vh-53px)] w-64 bg-background border-r hidden lg:block">
                <TagList />
            </aside>
        </>
    );
}