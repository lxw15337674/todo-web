'use client'

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, FolderIcon, History, Plus, Star } from 'lucide-react'
import { useState } from "react"
import { Category } from "./BookmarkCard"

interface SidebarProps {
    categories: Category[]
    activeCategory: string
    onSelectCategory: (categoryId: string) => void
}

export function Sidebar({ categories, activeCategory, onSelectCategory }: SidebarProps) {
    const [isListExpanded, setIsListExpanded] = useState(true)
    
    return (
        <div className="pb-12 w-60">
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        <Button
                            variant="secondary"
                            className="w-full justify-start gap-2"
                            onClick={() => fetchTitle('https://www.hecaitou.com/2024/11/A-person-with-no-taste.html')}
                        >
                            <FolderIcon className="h-4 w-4" />
                            测试接口
                            <span className="ml-auto text-xs">2</span>
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full justify-start gap-2"
                            onClick={() => onSelectCategory("uncategorized")}
                        >
                            <FolderIcon className="h-4 w-4" />
                            未分类
                            <span className="ml-auto text-xs">2</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => onSelectCategory("all")}
                        >
                            <History className="h-4 w-4" />
                            所有
                            <span className="ml-auto text-xs">3</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => onSelectCategory("starred")}
                        >
                            <Star className="h-4 w-4" />
                            星标
                            <span className="ml-auto text-xs">0</span>
                        </Button>
                    </div>
                </div>
                <div className="px-3 py-2">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="px-4 text-lg font-semibold tracking-tight">
                            智能列表
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => setIsListExpanded(!isListExpanded)}
                        >
                            {isListExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {isListExpanded && (
                        <ScrollArea className="h-[300px] px-1">
                            <div className="space-y-1">
                                {categories.map((category) => (
                                    <Button
                                        key={category.id}
                                        onClick={() => onSelectCategory(category.id)}
                                        variant={activeCategory === category.id ? "secondary" : "ghost"}
                                        className="w-full justify-start gap-2"
                                    >
                                        {category.icon}
                                        {category.name}
                                        <span className="ml-auto text-xs">{category.count}</span>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    )
}

