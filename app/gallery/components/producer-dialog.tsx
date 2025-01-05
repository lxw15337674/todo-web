import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateProducer, createProducer, deleteProducer } from "@/api/gallery/producer"
import { useState } from "react"
import { Plus } from "lucide-react"
import { Producer } from '@prisma/client';
import { UpdateProducer } from "@/api/gallery/type"

interface ProducerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producers: Producer[]
  onSuccess?: () => void
}

export function ProducerDialog({ open, onOpenChange, producers, onSuccess }: ProducerDialogProps) {
  const [editingProducer, setEditingProducer] = useState<UpdateProducer | null>(null)

  const handleEdit = async ({ id, name, weiboIds }: UpdateProducer) => {
    try {
      await updateProducer({ id, name, weiboIds })
      setEditingProducer(null)
      onSuccess?.()
    } catch (error) {
      alert('更新失败,请重试')
    }
  }

  const handleAdd = async () => {
    try {
      await createProducer({ name: "新爬取方" })
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

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditingProducer(prev => prev ? ({ ...prev, name: e.target.value }) : null)
  }

  function handleWeiboIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditingProducer(prev => prev ? ({
      ...prev,
      weiboIds: e.target.value ? e.target.value.split(',').map(id => id.trim()) : []
    }) : null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>制作者管理</DialogTitle>
        </DialogHeader>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">名称</TableHead>
              <TableHead className="w-1/4">微博ID</TableHead>
              <TableHead >操作</TableHead>
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
                      value={editingProducer?.weiboIds?.join(', ') ?? ''}
                      onChange={handleWeiboIdChange}
                      placeholder="多个ID用逗号分隔"
                    />
                  ) : (
                    <div className="px-2 py-1 rounded">
                      {Array.isArray(producer.weiboIds) ? producer.weiboIds.join(', ') : ''}
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
                          weiboIds: producer.weiboIds || []
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
