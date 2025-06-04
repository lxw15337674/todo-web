import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateProducer, createProducer, deleteProducer, getProducerTags, createProducerTag, deleteProducerTag, updateProducerTags } from "@/api/gallery/producer"
import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, AlertCircle, Save, X, Loader2 } from "lucide-react"
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
import { toast } from "@/hooks/use-toast"

interface UpdateProducer {
  id: string
  name: string | null
  type: ProducerType
  producerId?: string | null
  tags?: ProducerTag[]
  isValid?: boolean
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
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { data: tags = [], refresh: refreshTags, loading: tagsLoading } = useRequest(getProducerTags, {
    manual: false,
    ready: open
  })

  // 表单验证
  const validateForm = useCallback((producer: UpdateProducer) => {
    const errors: Record<string, string> = {}

    if (!producer.producerId?.trim()) {
      errors.producerId = 'ID不能为空'
    }

    if (!producer.name?.trim()) {
      errors.name = '名称不能为空'
    }

    return { errors, isValid: Object.keys(errors).length === 0 }
  }, [])
  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingProducer) return

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleEdit(editingProducer)
      }

      if (e.key === 'Escape') {
        setEditingProducer(null)
        setValidationErrors({})
      }

      // Tab 键导航到下一个制作者
      if (e.key === 'Tab' && e.shiftKey === false && e.ctrlKey) {
        e.preventDefault()
        const currentIndex = producers.findIndex(p => p.id === editingProducer.id)
        if (currentIndex < producers.length - 1) {
          const nextProducer = producers[currentIndex + 1]
          handleRowDoubleClick(nextProducer)
        }
      }

      // Shift+Tab 键导航到上一个制作者
      if (e.key === 'Tab' && e.shiftKey && e.ctrlKey) {
        e.preventDefault()
        const currentIndex = producers.findIndex(p => p.id === editingProducer.id)
        if (currentIndex > 0) {
          const prevProducer = producers[currentIndex - 1]
          handleRowDoubleClick(prevProducer)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editingProducer, producers])

  // 实时表单验证
  useEffect(() => {
    if (editingProducer) {
      const { errors } = validateForm(editingProducer)
      setValidationErrors(errors)
    }
  }, [editingProducer, validateForm])
  const handleCreateNewTag = useCallback(async (tagName: string) => {
    if (!tagName.trim() || isCreatingTag) return

    setIsCreatingTag(true)
    try {
      const newTag = await createProducerTag({
        name: tagName.trim(),
        remark: undefined
      })

      // 等待标签列表刷新完成
      await refreshTags()

      // 自动添加到当前编辑的制作者
      if (editingProducer) {
        const updatedTags = [...(editingProducer.tags || []), newTag]
        setEditingProducer(prev => prev ? ({ ...prev, tags: updatedTags }) : null)
      }

      toast({
        title: "标签创建成功",
        description: `标签 "${tagName}" 已创建并添加到当前选择中`,
      })

      return newTag
    } catch (error) {
      console.error('创建标签失败:', error)
      toast({
        title: "创建标签失败",
        description: "请重试",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsCreatingTag(false)
    }
  }, [editingProducer, refreshTags, isCreatingTag])
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
        toast({
          title: "标签添加成功",
          description: `标签 "${newTagName.trim()}" 已添加`,
        })
      } catch (error) {
        console.error('添加标签失败:', error)
        toast({
          title: "添加标签失败",
          description: "请重试",
          variant: "destructive"
        })
      }
    },
    { wait: 500 }
  )

  const { run: handleDeleteTag } = useThrottleFn(
    async (id: string, name: string) => {
      if (!confirm(`确定要删除标签 "${name}" 吗？`)) return
      try {
        await deleteProducerTag(id)
        refreshTags()
        toast({
          title: "标签删除成功",
          description: `标签 "${name}" 已删除`,
        })
      } catch (error) {
        console.error('删除标签失败:', error)
        toast({
          title: "删除标签失败",
          description: "请重试",
          variant: "destructive"
        })
      }
    },
    { wait: 1000 }
  )

  const { run: handleEdit } = useDebounceFn(
    async (producer: UpdateProducer) => {
      const { errors, isValid } = validateForm(producer)
      if (!isValid) {
        setValidationErrors(errors)
        return
      }

      setIsSaving(true)
      try {
        await updateProducer({
          id: producer.id,
          name: producer.name,
          type: producer.type,
          producerId: producer.producerId || null
        })
        if (producer.tags) {
          await updateProducerTags(producer.id, producer.tags.map(t => t.id))
        }
        setEditingProducer(null)
        setValidationErrors({})
        onSuccess?.()
        toast({
          title: "保存成功",
          description: "制作者信息已更新",
        })
      } catch (error) {
        console.error('更新失败:', error)
        toast({
          title: "保存失败",
          description: "请重试",
          variant: "destructive"
        })
      } finally {
        setIsSaving(false)
      }
    },
    { wait: 500 }
  )
  const { run: handleAdd } = useDebounceFn(
    async () => {
      try {
        await createProducer({ 
          name: "新制作者", 
          type: ProducerType.WEIBO_PERSONAL, 
          producerId: "" 
        })
        onSuccess?.()
        toast({
          title: "添加成功",
          description: "新制作者已创建，请编辑完善信息",
        })
      } catch (error) {
        console.error('添加失败:', error)
        toast({
          title: "添加失败",
          description: "请重试",
          variant: "destructive"
        })
      }
    },
    { wait: 500 }
  )

  const { run: handleDelete } = useThrottleFn(
    async (id: string, name: string) => {
      if (!confirm(`确定要删除制作者 "${name || '未命名'}" 吗？`)) return
      try {
        await deleteProducer(id)
        onSuccess?.()
        toast({
          title: "删除成功",
          description: `制作者 "${name || '未命名'}" 已删除`,
        })
      } catch (error) {
        console.error('删除失败:', error)
        toast({
          title: "删除失败",
          description: "请重试",
          variant: "destructive"
        })
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
  const handleTagsChange = useCallback((values: string[]) => {
    const selectedTags = tags.filter(t => values.includes(t.id))
    setEditingProducer(prev => prev ? ({
      ...prev,
      tags: selectedTags
    }) : null)
  }, [tags])

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
    setValidationErrors({})

    // 延迟聚焦到第一个输入框
    setTimeout(() => {
      const firstInput = document.querySelector(`input[value="${producer.name || ''}"]`) as HTMLInputElement
      if (firstInput) {
        firstInput.focus()
        firstInput.select()
      }
    }, 100)
  }

  const handleCancelEdit = () => {
    setEditingProducer(null)
    setValidationErrors({})
  }

  const handleSaveAndContinue = async (producer: UpdateProducer) => {
    const { errors, isValid } = validateForm(producer)
    if (!isValid) {
      setValidationErrors(errors)
      return
    }

    setIsSaving(true)
    try {
      await updateProducer({
        id: producer.id,
        name: producer.name,
        type: producer.type,
        producerId: producer.producerId || null
      })
      if (producer.tags) {
        await updateProducerTags(producer.id, producer.tags.map(t => t.id))
      }
      // 不关闭编辑状态，继续编辑
      onSuccess?.()
      toast({
        title: "保存成功",
        description: "制作者信息已更新，可以继续编辑",
      })
    } catch (error) {
      console.error('保存失败:', error)
      toast({
        title: "保存失败",
        description: "请重试",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
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
          </TabsList>          <TabsContent value="producers" className="mt-4">
            <div className="space-y-4">              <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {producers.length} 个制作者 {editingProducer && '| 正在编辑中...'}
              </div>
              <Button
                onClick={handleAdd}
                size="sm"
                className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
                variant="ghost"
              >
                <Plus className="mr-2 h-4 w-4" />
                添加制作者
              </Button>
            </div>

              <ScrollArea className="h-[60vh] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40px]">状态</TableHead>
                      <TableHead className="w-[150px]">名称</TableHead>
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead className="w-[100px]">类型</TableHead>
                      <TableHead className="w-[200px]">标签</TableHead>
                      <TableHead className="w-[100px] text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {producers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          暂无制作者，请添加新制作者
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortProducersByTags(producers).map((producer) => (
                        <TableRow
                          key={producer.id} 
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            editingProducer?.id === producer.id && "bg-muted/30 border-l-4 border-l-primary"
                          )}
                        >
                          {/* 状态列 */}                          <TableCell>
                            {!producer.producerId ? (
                              <div title="缺少ID，不可用">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </div>
                            ) : (
                              <div title="正常">
                                <div className="h-4 w-4 rounded-full bg-green-500" />
                              </div>
                            )}
                          </TableCell>

                          {/* 名称列 */}
                          <TableCell>
                            {editingProducer?.id === producer.id ? (
                              <div className="space-y-1">
                                <Input
                                  value={editingProducer.name ?? ''}
                                  onChange={handleNameChange}
                                  placeholder="请输入名称"
                                  className={cn(
                                    "h-8 text-sm",
                                    validationErrors.name && "border-destructive"
                                  )}
                                />
                                {validationErrors.name && (
                                  <p className="text-xs text-destructive">{validationErrors.name}</p>
                                )}
                              </div>
                            ) : (
                              <span
                                className={cn(
                                  "cursor-pointer hover:text-primary transition-colors",
                                  !producer.producerId && "text-muted-foreground"
                                )}
                                onClick={() => handleRowDoubleClick(producer)}
                                title="点击编辑"
                              >
                                {producer.name || '未命名'}
                              </span>
                            )}
                          </TableCell>

                          {/* ID列 */}
                          <TableCell>
                            {editingProducer?.id === producer.id ? (
                              <div className="space-y-1">
                                <Input
                                  value={editingProducer.producerId ?? ''}
                                  onChange={handleProducerIdChange}
                                  placeholder="请输入ID"
                                  className={cn(
                                    "h-8 text-sm",
                                    validationErrors.producerId && "border-destructive"
                                  )}
                                />
                                {validationErrors.producerId && (
                                  <p className="text-xs text-destructive">{validationErrors.producerId}</p>
                                )}
                              </div>
                            ) : (
                              <span
                                className={cn(
                                  "cursor-pointer hover:text-primary transition-colors font-mono text-sm",
                                  !producer.producerId && "text-destructive"
                                )}
                                onClick={() => handleRowDoubleClick(producer)}
                                title={producer.producerId || "缺少ID"}
                              >
                                {producer.producerId || '未设置'}
                              </span>
                            )}
                          </TableCell>

                          {/* 类型列 */}
                          <TableCell>
                            {editingProducer?.id === producer.id ? (
                              <Select
                                value={editingProducer.type}
                                onValueChange={handleTypeChange}
                              >
                                <SelectTrigger className="h-8 text-sm">
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
                              <span
                                className="cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleRowDoubleClick(producer)}
                                title="点击编辑"
                              >
                                {PRODUCER_TYPE_NAMES[producer.type]}
                              </span>
                            )}
                          </TableCell>

                          {/* 标签列 */}
                          <TableCell>
                            {editingProducer?.id === producer.id ? (
                              <div className="space-y-1">                                <MultiSelect
                                key={`multi-select-${editingProducer.id}-${editingProducer.tags?.length || 0}`}
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
                                defaultValue={editingProducer.tags?.map(t => t.id) || []}
                                onValueChange={handleTagsChange}
                                onCreateNewOption={handleCreateNewTag}
                                placeholder="选择或创建标签..."
                                maxCount={2}
                                className="h-8 text-sm"
                              />
                                {isCreatingTag && (
                                  <p className="text-xs text-muted-foreground flex items-center">
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    创建中...
                                  </p>
                                )}
                              </div>
                            ) : (
                                <div
                                  className="flex flex-wrap gap-1 cursor-pointer"
                                  onClick={() => handleRowDoubleClick(producer)}
                                  title="点击编辑"
                                >
                                  {producer.tags.slice(0, 2).map((tag) => {
                                  const color = getTagColor(tag.id)
                                  return (
                                    <Badge 
                                      key={tag.id} 
                                      variant="outline"
                                      className={cn(
                                        "text-xs px-1.5 py-0.5",
                                        color.bg,
                                        color.text,
                                        color.border
                                      )}
                                    >
                                      {tag.name}
                                    </Badge>
                                  )
                                })}
                                  {producer.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                      +{producer.tags.length - 2}
                                    </Badge>
                                  )}
                                  {producer.tags.length === 0 && (
                                    <span className="text-xs text-muted-foreground">无标签</span>
                                  )}
                                </div>
                            )}
                          </TableCell>

                          {/* 操作列 */}
                          <TableCell className="text-center">
                            {editingProducer?.id === producer.id ? (
                              <div className="flex justify-center gap-1">
                                <Button
                                  onClick={() => handleEdit(editingProducer)}
                                  size="sm"
                                  variant="default"
                                  className="h-7 px-2 text-xs"
                                  disabled={isSaving || Object.keys(validationErrors).length > 0}
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Save className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  disabled={isSaving}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <Button
                                    onClick={() => handleRowDoubleClick(producer)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs hover:bg-background/80"
                                    title="编辑制作者"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDelete(producer.id, producer.name || '')}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs hover:bg-destructive/10 text-destructive hover:text-destructive"
                                    title="删除制作者"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              {editingProducer && (
                <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-4">
                    <span>💡 快捷键：</span>
                    <span><kbd className="px-1 py-0.5 bg-background rounded border text-xs">Ctrl+S</kbd> 保存</span>
                    <span><kbd className="px-1 py-0.5 bg-background rounded border text-xs">Esc</kbd> 取消编辑</span>
                    <span><kbd className="px-1 py-0.5 bg-background rounded border text-xs">Ctrl+Tab</kbd> 下一个</span>
                    <span><kbd className="px-1 py-0.5 bg-background rounded border text-xs">Ctrl+Shift+Tab</kbd> 上一个</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>          <TabsContent value="tags" className="mt-4">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-3 bg-muted/50 p-4 rounded-lg">
                <div className="w-full md:flex-1 space-y-2 md:space-y-0 md:space-x-3 flex flex-col md:flex-row">
                  <div className="w-full md:w-auto">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">
                      标签名称 <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="请输入标签名称"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full transition-shadow focus:ring-2 focus:ring-primary/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTagName.trim()) {
                          handleAddTag()
                        }
                      }}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">备注</label>
                    <Input
                      placeholder="可选备注信息"
                      value={newTagRemark}
                      onChange={(e) => setNewTagRemark(e.target.value)}
                      className="w-full transition-shadow focus:ring-2 focus:ring-primary/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTagName.trim()) {
                          handleAddTag()
                        }
                      }}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddTag}
                  className="w-full md:w-auto min-w-[100px]"
                  disabled={!newTagName.trim()}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  添加标签
                </Button>
              </div>

              <ScrollArea className="h-[60vh] w-full rounded-md border">
                <div className="min-w-[480px] md:min-w-0">
                  {tagsLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2 text-muted-foreground">加载中...</span>
                    </div>
                  ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[160px] md:w-[30%] font-semibold">标签名称</TableHead>
                            <TableHead className="w-[220px] md:w-[50%] font-semibold">备注</TableHead>
                            <TableHead className="w-[100px] md:w-[20%] text-left font-semibold">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tags.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                暂无标签，请添加新标签
                              </TableCell>
                            </TableRow>
                          ) : (
                            tags.map((tag) => (
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
                                <TableCell className="text-muted-foreground">
                                  {tag.remark || '-'}
                                </TableCell>
                                <TableCell className="text-left">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    删除
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
