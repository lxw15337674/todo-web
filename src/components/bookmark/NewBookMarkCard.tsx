
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useState } from "react"
import { Bookmark } from "@prisma/client"
import { Input } from "../ui/input"
import { useImmer } from "use-immer"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { MultiSelect } from "../ui/multi-select"
import { useToast } from "../../hooks/use-toast"
import { fetchTitle } from "@/api/bookmark/requestActions"
import Loader from "../loader"
import { useRequest } from "ahooks"
import Link from "next/link"
import { createBookmarkTag } from "@/api/bookmark"

const frameworksList = [
    { value: "react", label: "React", },
    { value: "angular", label: "Angular" },
    { value: "vue", label: "Vue" },
    { value: "svelte", label: "Svelte" },
    { value: "ember", label: "Ember" },
];

interface BookmarkCardProps {
    createBookmark: (bookmark: Bookmark) => void
}
interface NewBookmarkCard {
    name: string;
    url: string;
    tags: string[];
}
export function NewBookmarkCard({ createBookmark }: BookmarkCardProps) {
    const { toast } = useToast()
    const [newBookmark, setNewBookmark] = useImmer({
        name: "",
        url: "https://web.okjike.com/originalPost/674810ae53ab99f7fd0b6ada",
        tags: []
    })
    const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["react", "angular"]);
    const { run, loading } = useRequest(() => fetchTitle(newBookmark.url), {
        onSuccess: (title) => {
            setNewBookmark(draft => { draft.name = title })
        },
        manual: true
    })
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createBookmark(newBookmark)
    }
    const { run: createTag } = useRequest(createBookmarkTag, {
        manual: true,
        onSuccess: (tag) => {
            toast({
                title: '标签创建成功',
                description: `标签 ${tag.name} 创建成功`
            })
        }
    })
    return (
        <Card >
            <CardContent className="pt-4 space-y-4">
                {
                    loading ? <Loader /> : <Link
                        href={newBookmark.url}
                        className="font-semibold text-lg">{newBookmark.name}</Link>
                }
                <div className="flex w-full items-center space-x-2">
                    <Input value={newBookmark.url}
                        placeholder="链接"
                        onChange={(e) => setNewBookmark(draft => { draft.url = e.target.value })}
                        onBlur={run}
                    />

                </div>
                <div className="my-1">
                </div>
                <MultiSelect
                    options={frameworksList}
                    onValueChange={setSelectedFrameworks}
                    onCreateNewOption={createTag}
                    defaultValue={selectedFrameworks}
                    placeholder="标签"
                    variant="inverted"
                    animation={0}
                    maxCount={10}
                />
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" onClick={handleSubmit} >创建书签</Button>
            </CardFooter>
        </Card>
    )
}

