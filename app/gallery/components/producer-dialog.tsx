import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateProducer, createProducer, deleteProducer, getProducerTags, createProducerTag, deleteProducerTag, updateProducerTags } from "@/api/gallery/producer"
import { useState } from "react"
import { Plus } from "lucide-react"
import { Producer, ProducerType, ProducerTag } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PRODUCER_TYPE_NAMES } from "@/api/gallery/type"
import { useRequest } from "ahooks"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

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

  const handleAddTag = async () => {
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
  }

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm('确定要删除这个标签吗？')) return
    try {
      await deleteProducerTag(id)
      refreshTags()
    } catch (error) {
      alert('删除标签失败,请重试')
    }
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

  const handleDelete = async (id: string, name: string) => {
    if (confirm("确定要删除吗？")) {
      try {
        await deleteProducer(id)
        onSuccess?.()
      } catch (error) {
        alert('删除失败,请重试')
      }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>管理</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="producers">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="producers">制作者管理</TabsTrigger>
            <TabsTrigger value="tags">标签管理</TabsTrigger>
          </TabsList>

          <TabsContent value="producers" className="mt-4">
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
                        <MultiSelect
                          options={tags.map(tag => ({
                            label: tag.name,
                            value: tag.id
                          }))}
                          defaultValue={editingProducer.tags?.map(t => t.id)}
                          onValueChange={(values) => {
                            const selectedTags = tags.filter(t => values.includes(t.id))
                            setEditingProducer(prev => prev ? ({
                              ...prev,
                              tags: selectedTags
                            }) : null)
                          }}
                          placeholder="选择标签..."
                          maxCount={3}
                          animation={0.2}
                        />
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
                        onClick={() => handleDelete(producer.id, producer.name||'')}
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
          </TabsContent>

          <TabsContent value="tags" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="标签名称"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <Input
                    placeholder="备注（可选）"
                    value={newTagRemark}
                    onChange={(e) => setNewTagRemark(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddTag}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标签名称</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead className="w-24">操作</TableHead>
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
