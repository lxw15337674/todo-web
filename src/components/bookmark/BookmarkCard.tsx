import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
export interface Bookmark {
    id: string
    title: string
    url: string
    description?: string
    image?: string
    category?: string
    createdAt: Date
    isStarred: boolean
}

export interface Category {
    id: string
    name: string
    count: number
    icon?: React.ReactNode
}


interface BookmarkCardProps {
    bookmark: Bookmark
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
    return (
        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <CardHeader className="p-4">
                <div className="flex items-start gap-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{bookmark.title}</h3>
                        <p className="text-sm text-muted-foreground">{bookmark.description}</p>
                    </div>
                    {bookmark.image && (
                        <div className="flex-shrink-0">
                            <Image
                                src={bookmark.image}
                                alt={bookmark.title}
                                width={80}
                                height={80}
                                className="rounded-md object-cover"
                            />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-center text-xs text-muted-foreground">
                    <span>{new URL(bookmark.url).hostname}</span>
                    <span className="mx-2">•</span>
                    <span>{bookmark.createdAt.toLocaleDateString()}</span>
                </div>
            </CardContent>
        </Card>
    )
}

