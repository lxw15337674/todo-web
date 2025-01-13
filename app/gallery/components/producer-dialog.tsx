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
          <DialogTitle>管理</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="producers">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="producers">制作者管理</TabsTrigger>
            <TabsTrigger value="tags">标签管理</TabsTrigger>
          </TabsList>

          <TabsContent value="producers" className="mt-4">
            <div className="relative">
              <ScrollArea className="h-[60vh] w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
                  {[...producers]
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map((producer) => (
                      <div
                        key={producer.id}
                        className="group border rounded-lg p-4 hover:bg-muted/50 cursor-pointer relative"
                        onDoubleClick={() => handleRowDoubleClick(producer)}
                      >
                        {editingProducer?.id === producer.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">名称</label>
                              <Input
                                value={editingProducer?.name ?? ''}
                                onChange={handleNameChange}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">ID</label>
                              <Input
                                value={editingProducer?.producerId ?? ''}
                                onChange={handleProducerIdChange}
                                placeholder="请输入ID（必填）"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">类型</label>
                              <Select
                                value={editingProducer.type}
                                onValueChange={handleTypeChange}
                              >
                                <SelectTrigger>
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
                              <label className="text-sm font-medium mb-1 block">标签</label>
                              <MultiSelect
                                animation={0}
                                options={tags.map(tag => ({
                                  label: tag.name,
                                  value: tag.id
                                }))}
                                defaultValue={editingProducer.tags?.map(t => t.id)}
                                onValueChange={handleTagsChange}
                                placeholder="选择标签..."
                                maxCount={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                              <Button
                                onClick={() => setEditingProducer(null)}
                                size="sm"
                                variant="outline"
                              >
                                取消
                              </Button>
                              <Button
                                onClick={() => handleEdit(editingProducer)}
                                size="sm"
                                variant="default"
                              >
                                提交
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              {!producer.producerId && (
                                <div className="absolute top-2 left-2 text-destructive" title="缺少ID，不可用">
                                  <AlertCircle className="h-4 w-4" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm text-muted-foreground">名称</div>
                                <div className={cn(
                                  "font-medium",
                                  !producer.producerId && "text-muted-foreground"
                                )}>
                                  {producer.name || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">ID</div>
                                <div className={cn(
                                  "font-medium truncate",
                                  !producer.producerId && "text-destructive"
                                )} title={producer?.producerId ?? ''}>
                                  {producer.producerId || '未设置'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">类型</div>
                                <div className="font-medium">
                                  {PRODUCER_TYPE_NAMES[producer.type]}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">标签</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {producer.tags.map((tag) => (
                                    <Badge key={tag.id} variant="secondary">
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                className="h-8 w-8"
                                title="双击卡片也可以编辑"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(producer.id, producer.name || '')
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
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
                className="mt-4 w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                添加新制作者
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tags" className="mt-4">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-2">
                <div className="w-full md:flex-1 space-y-2 md:space-y-0 md:space-x-2">
                  <Input
                    placeholder="标签名称"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full md:w-auto"
                  />
                  <Input
                    placeholder="备注（可选）"
                    value={newTagRemark}
                    onChange={(e) => setNewTagRemark(e.target.value)}
                    className="w-full md:w-auto"
                  />
                </div>
                <Button onClick={handleAddTag} className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              </div>

              <ScrollArea className="h-[60vh] w-full">
                <div className="min-w-[480px] md:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px] md:w-[30%]">标签名称</TableHead>
                        <TableHead className="w-[220px] md:w-[50%]">备注</TableHead>
                        <TableHead className="w-[100px] md:w-[20%] text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell>{tag.name}</TableCell>
                          <TableCell>{tag.remark}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTag(tag.id, tag.name)}
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
