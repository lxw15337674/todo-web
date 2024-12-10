
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useState } from "react"
import { Bookmark } from "@prisma/client"
import { Input } from "../ui/input"
import { useImmer } from "use-immer"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { MultiSelect } from "../ui/multi-select"
import { useToast } from "../../hooks/use-toast"

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

export function NewBookmarkCard({ createBookmark }: BookmarkCardProps) {
    const toast = useToast()
    const [newBookmark, setNewBookmark] = useImmer<Bookmark>({
        name: "",
        url: "",
        tags: []
    })
    const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["react", "angular"]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createBookmark(newBookmark)
    }

    return (
        <Card >
            <CardContent className="pt-4 space-y-4">
                <Input value={newBookmark.name}
                    placeholder="链接"
                    onChange={(e) => setNewBookmark(draft => { draft.name = e.target.value })} />
                <MultiSelect
                    options={frameworksList}
                    onValueChange={setSelectedFrameworks}
                    defaultValue={selectedFrameworks}
                    placeholder="标签"
                    variant="inverted"
                    animation={0}
                    maxCount={10}
                />
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" >创建书签</Button>
            </CardFooter>
        </Card>
    )
}

