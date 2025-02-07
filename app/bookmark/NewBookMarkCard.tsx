'use client'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useState } from "react"
import { Bookmark } from "@prisma/client"
import { Button } from "../../src/components/ui/button"
import { useToast } from "../../src/hooks/use-toast"
import { createBookmark } from "@/api/bookmark"
import { Textarea } from "../../src/components/ui/textarea"
import { useEventListener, useMount } from "ahooks"
import { isBrowser, startConfettiAnimation } from "../../src/lib/utils"
import dayjs from 'dayjs';

interface BookmarkCardProps {
    onSubmit: (bookmark: Bookmark) => void
}

const isValidUrl = (url: string) => {
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + // 协议
        '((([a-zA-Z0-9$-_@.&+!*"(),]|[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,})|' + // 域名
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // 或 IP 地址
        '(\\:\\d+)?(\\/[-a-zA-Z0-9%_.~+]*)*' + // 端口和路径
        '(\\?[;&a-zA-Z0-9%_.~+=-]*)?' + // 查询字符串
        '(\\#[-a-zA-Z0-9_]*)?$', // 片段标识符
        'i'
    );
    return urlPattern.test(url);
};

export default function NewBookmarkCard({ onSubmit }: BookmarkCardProps) {
    const { toast } = useToast();
    const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
    const [remark, setRemark] = useState('');
    const insertClipboardUrl = () => {
        if (!isBrowser()) return;
        navigator?.clipboard?.readText().then((text) => {
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
                description: '请输入一个有效的URL',
                variant: 'destructive'
            });
            return;
        }

        try {
            const data = await createBookmark(newBookmarkUrl, remark);
            if (!data) {
                toast({
                    title: '书签创建失败',
                    description: '请稍后再试',
                    variant: 'destructive'
                });
                return;
            }
            if (!data?.loading) {
                toast({
                    title: '书签已经存在',
                    description: '创建时间：' + dayjs(data.createTime).format('YYYY-MM-DD'),
                    variant: 'destructive'
                });
                return;
            }
            onSubmit(data);
            toast({
                title: '书签创建成功',
                description: `书签 ${newBookmarkUrl} 创建成功`
            });
            setNewBookmarkUrl('');
            setRemark('');
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
    });

    return (
        <Card className="min-h-[200px] flex flex-col space-y-4 p-4">
            <CardContent className="flex flex-col space-y-2 flex-1">
                <Textarea
                    autoFocus
                    value={newBookmarkUrl}
                    className="resize-none flex-1"
                    placeholder="链接"
                    onChange={(e) => setNewBookmarkUrl(e.target.value)}
                />
                <Textarea
                    value={remark}
                    className="resize-none h-20"
                    placeholder="备注"
                    onChange={(e) => setRemark(e.target.value)}
                />
            </CardContent>
            <CardFooter className="flex space-x-2">
                <Button variant="outline" onClick={insertClipboardUrl} className="flex-1">
                    粘贴剪切板
                </Button>
                <Button type="submit" className="flex-1" onClick={handleSubmit}>
                    创建书签(Enter)
                </Button>
            </CardFooter>
        </Card>
    )
}