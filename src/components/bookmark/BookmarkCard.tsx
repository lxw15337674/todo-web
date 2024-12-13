import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CompleteBookmark, deleteBookmark } from "../../api/bookmark"

import { Ellipsis } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import dayjs from "dayjs";

interface BookmarkCardProps {
    bookmark: CompleteBookmark
    setBookmarks: (bookmarks?: CompleteBookmark[]|((bookmarks?: CompleteBookmark[]) => CompleteBookmark[])) => void
}

export function BookmarkCard({ bookmark, setBookmarks }: BookmarkCardProps) {
    const { toast } = useToast()
    const handleDelete = async () => {
        await deleteBookmark(bookmark.id)
        toast({
            title: '删除成功',
            description: `书签 ${bookmark.title} 删除成功`
        })
        setBookmarks(bookmarks => (bookmarks ? bookmarks.filter(item => item.id !== bookmark.id) : []))
    }
    return (
        <Card className="hover:bg-accent/50 transition-colors "
        >
            <CardHeader className="p-0">
                <div className="w-full">
                    <img
                        src={bookmark?.image || `https://placehold.co/600x400?text=${bookmark.loading ? 'Loading' : bookmark.title}`}
                        alt={bookmark.title ?? 'Bookmark Image'}
                        className="object-cover h-48 w-full  cursor-pointer"
                        onClick={() => window.open(bookmark.url, '_blank')}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-2 space-y-2 relative border-t">
                <h3 className="font-semibold text-lg">{bookmark.title}</h3>
                {bookmark.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {bookmark.tags.map(tag => (
                            <span key={tag.id} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                    <span>{bookmark.url ? new URL(bookmark.url).hostname : 'Invalid URL'}</span>
                    <span className="mx-2">•</span>
                    <span>{dayjs(bookmark.createTime).format('YYYY-MM-DD')}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-auto">
                                <Ellipsis className="w-6 mx-auto " />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <>
                                <DropdownMenuItem
                                    className="cursor-pointer text-red-500 dark:text-red-400"
                                    onClick={handleDelete}
                                >
                                    删除
                                </DropdownMenuItem>
                            </>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    )
}

