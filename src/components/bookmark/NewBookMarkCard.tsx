'use client'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useState } from "react"
import { Bookmark } from "@prisma/client"
import { Button } from "../ui/button"
import { useToast } from "../../hooks/use-toast"
import { createBookmark } from "@/api/bookmark"
import { Textarea } from "../ui/textarea"
import { useEventListener, useInterval, useMount } from "ahooks"
import { startConfettiAnimation } from "../../lib/utils"

interface BookmarkCardProps {
    onSubmit: (bookmark: Bookmark) => void
}

const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export default function NewBookmarkCard({ onSubmit }: BookmarkCardProps) {
    const { toast } = useToast();
    const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
    const insertClipboardUrl = () => {
        navigator.clipboard.readText().then((text) => {
            if (isValidUrl(text) && text !== newBookmarkUrl) {
                setNewBookmarkUrl(text);
            }
        });
    }
    
    useMount(() => {
        insertClipboardUrl();
    });
    // Handle form submission
    const handleSubmit = async () => {
        if (!isValidUrl(newBookmarkUrl)) {
            toast({
                title: '无效的URL',
                description: '请输入一个有效的URL'
            });
            return;
        }

        try {
            const data = await createBookmark(newBookmarkUrl);
            onSubmit(data);
            toast({
                title: '书签创建成功',
                description: `书签 ${newBookmarkUrl} 创建成功`
            });
            setNewBookmarkUrl('');
            startConfettiAnimation();
        } catch (error) {
            toast({
                title: '创建书签失败',
                description: '请稍后再试',
                variant: 'destructive'
            });
        }
    };

    // Handle Enter key press for submission
    useEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && newBookmarkUrl) {
            handleSubmit();
        }
        if (e.ctrlKey && e.key === 'v') {
            insertClipboardUrl()
            toast({
                title: '检测到剪切板中的URL',
                description: `已自动填入URL: ${newBookmarkUrl}`
            });
        }
    });

    return (
        <Card className="min-h-72">
            <CardContent className="pt-4 space-y-4 h-[80%]">
                <Textarea
                    value={newBookmarkUrl}
                    className="resize-none w-full h-full"
                    placeholder="链接"
                    onChange={(e) => setNewBookmarkUrl(e.target.value)}
                />
            </CardContent>
            <CardFooter className="space-x-2">
                <Button variant="outline"
                    onClick={insertClipboardUrl}
                >
                    粘贴剪切板中的URL(Ctrl+V)
                </Button>
                <Button type="submit" className="w-full" onClick={handleSubmit}>创建书签(Enter)</Button>
            </CardFooter>
        </Card>
    )
}