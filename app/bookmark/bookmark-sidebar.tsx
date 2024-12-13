import { useState } from 'react';
import { BookmarkTagWithCount, getAllBookmarkTags } from "../../src/api/bookmark";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import useLocalStorageRequest from '../../src/hooks/useLocalStorageRequest';

interface BookmarkSidebarProps {
    selectedTag: BookmarkTagWithCount | null;
    onSelectTag: (tag: BookmarkTagWithCount | null) => void;
}
const cacheKey= 'bookmarkTags'

export default function BookmarkSidebar({ selectedTag, onSelectTag }: BookmarkSidebarProps) {
    const { data: tags = [] } = useLocalStorageRequest(getAllBookmarkTags, {
        cacheKey,
    });

    // 添加筛选输入框的状态
    const [filterText, setFilterText] = useState('');

    // 根据输入的筛选文本过滤标签列表
    const filteredTags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
        <Sidebar collapsible="offcanvas" className="block top-[53px]">
            <SidebarHeader />
            <SidebarContent className="px-2">
                <SidebarGroupLabel>标签</SidebarGroupLabel>
                {/* 添加筛选输入框 */}
                <div className="px-2 mb-2">
                    <input
                        type="text"
                        placeholder="筛选标签"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                    />
                </div>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {filteredTags.map((tag) => (
                            <SidebarMenuItem key={tag.id}>
                                <SidebarMenuButton
                                    onClick={() => {
                                        if (tag.id === selectedTag?.id) {
                                            onSelectTag(null);
                                        } else {
                                            onSelectTag(tag);
                                        }
                                    }}
                                    className={tag.id === selectedTag?.id ? 'bg-accent' : ''}
                                >
                                    <span>{tag.name}</span>
                                    <span className="ml-[1px]">({tag.count})</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}