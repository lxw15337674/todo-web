import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateProducer, createProducer, deleteProducer, getProducerTags, createProducerTag, deleteProducerTag, updateProducerTags } from "@/api/gallery/producer"
import { useState } from "react"
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
import { Producer, ProducerType, ProducerTag } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PRODUCER_TYPE_NAMES } from "@/api/gallery/type"
import { useRequest, useDebounceFn, useThrottleFn } from "ahooks"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface UpdateProducer {
  id: string
  name: string | null
  type: ProducerType
  producerId?: string | null
  tags?: ProducerTag[]
}

interface ProducerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producers: (Producer & { tags: ProducerTag[] })[]
  onSuccess?: () => void
}

const TAG_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800" },
  { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800" },
  { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
]

const getTagColor = (tagId: string) => {
  const index = [...tagId].reduce((acc, char) => acc + char.charCodeAt(0), 0) % TAG_COLORS.length
  return TAG_COLORS[index]
}

const calculateTagSimilarity = (tags1: ProducerTag[], tags2: ProducerTag[]) => {
  const set1 = new Set(tags1.map(t => t.id))
  const set2 = new Set(tags2.map(t => t.id))
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return intersection.size / union.size // Jaccard similarity
}

const sortProducersByTags = (producers: (Producer & { tags: ProducerTag[] })[]) => {
  // First sort by name to ensure consistent ordering for items with same tag similarity
  const sortedProducers = [...producers].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  
  // If no producers have tags, return alphabetically sorted array
  if (!sortedProducers.some(p => p.tags.length > 0)) {
    return sortedProducers
  }

  const result: (Producer & { tags: ProducerTag[] })[] = []
  const used = new Set<string>()

  // Start with producers that have tags
  for (let i = 0; i < sortedProducers.length; i++) {
    if (used.has(sortedProducers[i].id) || sortedProducers[i].tags.length === 0) continue
    
    const current = sortedProducers[i]
    result.push(current)
    used.add(current.id)

    // Find similar producers
    const similar = sortedProducers
      .filter(p => !used.has(p.id) && p.tags.length > 0)
      .map(p => ({
        producer: p,
        similarity: calculateTagSimilarity(current.tags, p.tags)
      }))
      .filter(({ similarity }) => similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)

    // Add similar producers
    for (const { producer } of similar) {
      result.push(producer)
      used.add(producer.id)
    }
  }

  // Add remaining producers (those without tags)
  sortedProducers
    .filter(p => !used.has(p.id))
    .forEach(p => result.push(p))

  return result
}

export function ProducerDialog({ open, onOpenChange, producers=[], onSuccess }: ProducerDialogProps) {
  const [editingProducer, setEditingProducer] = useState<UpdateProducer | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagRemark, setNewTagRemark] = useState('')

  const { data: tags=[], refresh: refreshTags } = useRequest(getProducerTags, {
    manual: false,
    ready: open
  })

  const { run: handleAddTag } = useDebounceFn(
    async () => {
      if (!newTagName.trim()) return
      try {
        await createProducerTag({ 
          name: newTagName.trim(),
          remark: newTagRemark.trim() || undefined
        })
        setNewTagName('')
        setNewTagRemark('')
        refreshTags()
      } catch (error) {
        alert('添加标签失败,请重试')
      }
    },
    { wait: 500 }
  )

  const { run: handleDeleteTag } = useThrottleFn(
    async (id: string, name: string) => {
      if (!confirm('确定要删除这个标签吗？')) return
      try {
        await deleteProducerTag(id)
        refreshTags()
      } catch (error) {
        alert('删除标签失败,请重试')
      }
    },
    { wait: 1000 }
  )

  const { run: handleEdit } = useDebounceFn(
    async ({ id, name, type, producerId, tags }: UpdateProducer) => {
      try {
        if (!producerId?.trim()) {
          alert('请输入ID')
          return
        }
        await updateProducer({ id, name, type, producerId })
        if (tags) {
          await updateProducerTags(id, tags.map(t => t.id))
        }
        setEditingProducer(null)
        onSuccess?.()
      } catch (error) {
        alert('更新失败,请重试')
      }
    },
    { wait: 500 }
  )

  const { run: handleAdd } = useDebounceFn(
    async () => {
      try {
        await createProducer({ 
          name: "", 
          type: ProducerType.WEIBO_PERSONAL, 
          producerId: "" 
        })
        onSuccess?.()
      } catch (error) {
        alert('添加失败,请重试')
      }
    },
    { wait: 500 }
  )

  const { run: handleDelete } = useThrottleFn(
    async (id: string, name: string) => {
      if (confirm("确定要删除吗？")) {
        try {
          await deleteProducer(id)
          onSuccess?.()
        } catch (error) {
          alert('删除失败,请重试')
        }
      }
    },
    { wait: 1000 }
  )

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingProducer(prev => prev ? ({ ...prev, name: e.target.value }) : null)
  }

  const handleProducerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingProducer(prev => prev ? ({ ...prev, producerId: e.target.value }) : null)
  }

  const handleTagsChange = (values: string[]) => {
    const selectedTags = tags.filter(t => values.includes(t.id))
    setEditingProducer(prev => prev ? ({
      ...prev,
      tags: selectedTags
    }) : null)
  }

  const handleTypeChange = (value: ProducerType) => {
    setEditingProducer(prev => prev ? ({ ...prev, type: value }) : null)
  }

  const handleRowDoubleClick = (producer: Producer & { tags: ProducerTag[] }) => {
    setEditingProducer({
      id: producer.id,
      name: producer.name,
      type: producer.type,
      producerId: producer.producerId || '',
      tags: producer.tags
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[90vw] max-h-[90vh] md:h-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">制作者与标签管理</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="producers">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="producers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">制作者管理</TabsTrigger>
            <TabsTrigger value="tags" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">标签管理</TabsTrigger>
          </TabsList>

          <TabsContent value="producers" className="mt-4">
            <div className="relative">
              <ScrollArea className="h-[60vh] w-full rounded-md border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
                  {sortProducersByTags(producers).map((producer) => (
                    <div
                      key={producer.id}
                      className="group border rounded-lg p-3 hover:bg-muted/50 cursor-pointer relative transition-colors duration-200"
                      onDoubleClick={() => handleRowDoubleClick(producer)}
                    >
                      {editingProducer?.id === producer.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">名称</label>
                            <Input
                              value={editingProducer?.name ?? ''}
                              onChange={handleNameChange}
                              className="transition-shadow focus:ring-2 focus:ring-primary/20 h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">ID</label>
                            <Input
                              value={editingProducer?.producerId ?? ''}
                              onChange={handleProducerIdChange}
                              placeholder="请输入ID（必填）"
                              required
                              className="transition-shadow focus:ring-2 focus:ring-primary/20 h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">类型</label>
                            <Select
                              value={editingProducer.type}
                              onValueChange={handleTypeChange}
                            >
                              <SelectTrigger className="w-full transition-shadow focus:ring-2 focus:ring-primary/20 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(ProducerType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {PRODUCER_TYPE_NAMES[type]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">标签</label>
                            <MultiSelect
                              animation={0}
                              options={tags.map(tag => {
                                const color = getTagColor(tag.id)
                                return {
                                  label: tag.name,
                                  value: tag.id,
                                  className: cn(
                                    "rounded border px-1.5 py-0.5 text-xs font-medium",
                                    color.bg,
                                    color.text,
                                    color.border
                                  )
                                }
                              })}
                              defaultValue={editingProducer.tags?.map(t => t.id)}
                              onValueChange={handleTagsChange}
                              placeholder="选择标签..."
                              maxCount={3}
                              className="transition-shadow focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button
                              onClick={() => setEditingProducer(null)}
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-xs"
                            >
                              取消
                            </Button>
                            <Button
                              onClick={() => handleEdit(editingProducer)}
                              size="sm"
                              variant="default"
                              className="h-7 px-3 text-xs"
                            >
                              提交
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {!producer.producerId && (
                              <div className="absolute top-2 right-2 text-destructive" title="缺少ID，不可用">
                                <AlertCircle className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="text-xs text-muted-foreground font-medium">名称</div>
                              <div className={cn(
                                "text-sm font-medium truncate flex-1 text-left",
                                !producer.producerId && "text-muted-foreground"
                              )}>
                                {producer.name || '-'}
                              </div>
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="text-xs text-muted-foreground font-medium">ID</div>
                              <div className={cn(
                                "text-sm font-medium truncate flex-1 text-left",
                                !producer.producerId && "text-destructive"
                              )} title={producer?.producerId ?? ''}>
                                {producer.producerId || '未设置'}
                              </div>
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="text-xs text-muted-foreground font-medium">类型</div>
                              <div className="text-sm font-medium truncate flex-1 text-left">
                                {PRODUCER_TYPE_NAMES[producer.type]}
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex flex-wrap gap-1">
                                {producer.tags.map((tag) => {
                                  const color = getTagColor(tag.id)
                                  return (
                                    <Badge 
                                      key={tag.id} 
                                      variant="outline"
                                      className={cn(
                                        "rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                                        color.bg,
                                        color.text,
                                        color.border
                                      )}
                                    >
                                      {tag.name}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              onClick={() =>
                                setEditingProducer({
                                  id: producer.id,
                                  name: producer.name,
                                  type: producer.type,
                                  producerId: producer.producerId || '',
                                  tags: producer.tags
                                })
                              }
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-background/80"
                              title="双击卡片也可以编辑"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-destructive/10 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(producer.id, producer.name || '')
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                onClick={handleAdd}
                className="mt-4 w-full bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
                variant="ghost"
              >
                <Plus className="mr-2 h-4 w-4" />
                添加新制作者
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tags" className="mt-4">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-3 bg-muted/50 p-4 rounded-lg">
                <div className="w-full md:flex-1 space-y-2 md:space-y-0 md:space-x-3 flex flex-col md:flex-row">
                  <Input
                    placeholder="标签名称"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full md:w-auto transition-shadow focus:ring-2 focus:ring-primary/20"
                  />
                  <Input
                    placeholder="备注（可选）"
                    value={newTagRemark}
                    onChange={(e) => setNewTagRemark(e.target.value)}
                    className="w-full md:w-auto transition-shadow focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button onClick={handleAddTag} className="w-full md:w-auto min-w-[100px]">
                  <Plus className="h-4 w-4 mr-1.5" />
                  添加标签
                </Button>
              </div>

              <ScrollArea className="h-[60vh] w-full rounded-md border">
                <div className="min-w-[480px] md:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[160px] md:w-[30%] font-semibold">标签名称</TableHead>
                        <TableHead className="w-[220px] md:w-[50%] font-semibold">备注</TableHead>
                        <TableHead className="w-[100px] md:w-[20%] text-left font-semibold">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.map((tag) => (
                        <TableRow key={tag.id} className="group">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{tag.name}</span>
                              <Badge 
                                variant="outline"
                                className={cn(
                                  "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                                  getTagColor(tag.id).bg,
                                  getTagColor(tag.id).text,
                                  getTagColor(tag.id).border
                                )}
                              >
                                预览
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{tag.remark}</TableCell>
                          <TableCell className="text-left">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTag(tag.id, tag.name)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
