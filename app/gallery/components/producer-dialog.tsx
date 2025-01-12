import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateProducer, createProducer, deleteProducer, getProducerTags, createProducerTag, deleteProducerTag, updateProducerTags } from "@/api/gallery/producer"
import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import { Producer, ProducerType, ProducerTag } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PRODUCER_TYPE_NAMES } from "@/api/gallery/type"

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
  const [tags, setTags] = useState<ProducerTag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [editingTags, setEditingTags] = useState(false)

  useEffect(() => {
    if (open) {
      loadTags()
    }
  }, [open])

  const loadTags = async () => {
    const tags = await getProducerTags()
    setTags(tags)
  }

  const handleEdit = async ({ id, name, type, producerId, tags }: UpdateProducer) => {
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
      setEditingTags(false)
      onSuccess?.()
    } catch (error) {
      alert('更新失败,请重试')
    }
  }

  const handleAdd = async () => {
    try {
      await createProducer({ name: "新爬取方", type: ProducerType.WEIBO_PERSONAL, producerId: "新ID" })
      onSuccess?.()
    } catch (error) {
      alert('添加失败,请重试')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除吗？")) {
      await deleteProducer(id)
      onSuccess?.()
    }
  }

  const handleAddTag = async () => {
    if (!newTagName.trim()) return
    try {
      await createProducerTag({ name: newTagName.trim() })
      setNewTagName('')
      await loadTags()
    } catch (error) {
      alert('添加标签失败,请重试')
    }
  }

  const handleTagSelect = (tagId: string) => {
    if (!editingProducer) return
    const tag = tags.find(t => t.id === tagId)
    if (!tag) return
    
    const currentTags = editingProducer.tags || []
    if (currentTags.some(t => t.id === tagId)) {
      setEditingProducer(prev => prev ? ({
        ...prev,
        tags: currentTags.filter(t => t.id !== tagId)
      }) : null)
    } else {
      setEditingProducer(prev => prev ? ({
        ...prev,
        tags: [...currentTags, tag]
      }) : null)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingProducer(prev => prev ? ({ ...prev, name: e.target.value }) : null)
  }

  const handleTypeChange = (value: ProducerType) => {
    setEditingProducer(prev => prev ? ({ ...prev, type: value }) : null)
  }

  const handleProducerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingProducer(prev => prev ? ({ ...prev, producerId: e.target.value }) : null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}  >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>制作者管理</DialogTitle>
        </DialogHeader>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/6">名称</TableHead>
              <TableHead className="w-1/6">ID</TableHead>
              <TableHead className="w-1/6">类型</TableHead>
              <TableHead className="w-1/3">标签</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {producers.map((producer) => (
              <TableRow
                key={producer.id}
                className="cursor-pointer hover:bg-muted"
              >
                <TableCell>
                  {editingProducer?.id === producer.id ? (
                    <Input
                      value={editingProducer?.name ?? ''}
                      onChange={handleNameChange}
                    />
                  ) : (
                    <div className="px-2 py-1 rounded">
                      {producer.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingProducer?.id === producer.id ? (
                    <Input
                      value={editingProducer?.producerId ?? ''}
                      onChange={handleProducerIdChange}
                      placeholder="请输入ID（必填）"
                      required
                    />
                  ) : (
                    <div className="px-2 py-1 rounded">
                      {producer.producerId}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingProducer?.id === producer.id ? (
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
                  ) : (
                    <div className="px-2 py-1 rounded">
                      {PRODUCER_TYPE_NAMES[producer.type]}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingProducer?.id === producer.id ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant={editingProducer.tags?.some(t => t.id === tag.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleTagSelect(tag.id)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                      {editingTags ? (
                        <div className="flex items-center gap-2">
                          <Input
                            className="h-8 text-sm"
                            placeholder="新标签名称"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTag()
                              }
                            }}
                          />
                          <Button size="sm" onClick={handleAddTag}>添加</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTags(false)}>完成</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingTags(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          添加标签
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {producer.tags.map((tag) => (
                        <Badge key={tag.id}>
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="flex space-x-2">
                  {editingProducer?.id === producer.id ? (
                    <Button
                      onClick={() => handleEdit(editingProducer)}
                      size="sm"
                      variant="default"
                    >
                      提交
                    </Button>
                  ) : (
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
                      size="sm"
                      variant="outline"
                    >
                      编辑
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(producer.id)}
                  >
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button
          onClick={handleAdd}
          className="mt-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          添加
        </Button>
      </DialogContent>
    </Dialog>
  )
}
