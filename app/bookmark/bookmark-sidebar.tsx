'use client'
import { useState } from 'react';
import { BookmarkTagWithCount, getAllBookmarkTags } from "../../src/api/bookmark";
import useLocalStorageRequest from '../../src/hooks/useLocalStorageRequest';

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

    const filteredTags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
        <aside className="fixed left-0 top-[53px] h-[calc(100vh-53px)] w-64 bg-background border-r">
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
        </aside>
    );
}