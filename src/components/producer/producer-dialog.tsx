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
  producers: (Producer & { weiboId?: string })[]
  onSuccess?: () => void
}

export function ProducerDialog({ open, onOpenChange, producers, onSuccess }: ProducerDialogProps) {
  const [editingProducer, setEditingProducer] = useState<UpdateProducer | null>(null)

  const handleEdit = async ({ id, name, weiboId }: UpdateProducer) => {
    weiboId = weiboId || null
    try {
      await updateProducer({ id, name, weiboId })
      setEditingProducer(null)
      onSuccess?.()
    } catch (error) {
      debugger
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
    setEditingProducer(prev => prev ? ({ ...prev, weiboId: parseInt(e.target.value) || 0 }) : null)
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
              <TableHead className="w-1/2">名称</TableHead>
              <TableHead className="w-1/3">微博ID</TableHead>
              <TableHead className="w-1/6">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {producers.map((producer) => (
              <TableRow
                key={producer.id}
                onClick={() => setEditingProducer({ id: producer.id, name: producer.name, weiboId: producer.weiboId || "" })}
                className="cursor-pointer hover:bg-muted"
              >
                <TableCell>
                  {editingProducer?.id === producer.id ? (
                    <Input
                      value={editingProducer?.name ?? ''}
                      onChange={handleNameChange}
                      onBlur={() => handleEdit(editingProducer)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleEdit(editingProducer)
                        }
                      }}
                      autoFocus
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
                      value={editingProducer?.weiboId?.toString() ?? ''}
                      onChange={handleWeiboIdChange}
                      onBlur={() => handleEdit(editingProducer)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleEdit(editingProducer)
                        }
                      }}
                    />
                  ) : (
                    <div className="px-2 py-1 rounded">
                      {producer.weiboId}
                    </div>
                  )}
                </TableCell>
                <TableCell>
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
