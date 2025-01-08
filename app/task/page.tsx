'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown, Plus, Tag, X } from 'lucide-react'
import TaskCard from './components/TaskCard'
import { createTask, fetchAggregatedTask, NewTask } from '../../src/api/task/taskActions'
import { fetchTaskTags, createTaskTag, deleteTaskTag } from '../../src/api/task/tagActions'
import { useImmer } from 'use-immer'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useEffect, useState } from 'react'
import useLocalStorageRequest from '../../src/hooks/useLocalStorageRequest'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn, getTagColor } from '../../src/lib/utils'
import { useThrottleFn } from 'ahooks'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Priority } from '@prisma/client'
import { Textarea } from '@/components/ui/textarea'
import { AutosizeTextarea } from '../../src/components/ui/AutosizeTextarea'

// 新增常量定义
const TASK_STATUS = {
    UNCOMPLETED: '0',
    COMPLETED: '1'
} as const

const PRIORITY_WEIGHTS: Record<Priority, number> = {
    [Priority.IMPORTANT_URGENT]: 4,
    [Priority.IMPORTANT_NOT_URGENT]: 3,
    [Priority.URGENT_NOT_IMPORTANT]: 2,
    [Priority.NOT_IMPORTANT_NOT_URGENT]: 1
}

const DEFAULT_NEW_TASK: NewTask = {
    name: '',
    remark: '',
    status: TASK_STATUS.UNCOMPLETED,
    priority: Priority.NOT_IMPORTANT_NOT_URGENT,
}

const COMPLETED_TASKS_LIMIT = 50

export default function Page() {
    const { data: tasks = [], mutate, refresh: refreshTasks } = useLocalStorageRequest(fetchAggregatedTask, {
        cacheKey: 'AggregatedTask',
    });
    const { data: tags = [], refresh: refreshTags } = useLocalStorageRequest(fetchTaskTags, {
        cacheKey: 'TaskTags',
    });
    
    const [newTask, setNewTask] = useImmer<NewTask>(DEFAULT_NEW_TASK);
    const [newTagName, setNewTagName] = useState('');
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

    useEffect(() => {
        refreshTasks();
    }, []);

    // 优化任务处理逻辑
    const handleAddTask = useThrottleFn(async () => {
        const trimmedName = newTask.name?.trim();
        if (!trimmedName) return;

        setNewTask(draft => { draft.name = ''; });
        await createTask({ ...newTask, name: trimmedName });
        await Promise.all([refreshTasks(), refreshTags()]);
    }, { wait: 1000 }).run;

    // 优化标签处理逻辑
    const handleAddTag = useThrottleFn(async () => {
        const trimmedTagName = newTagName.trim();
        if (!trimmedTagName) return;

        try {
            await createTaskTag({ name: trimmedTagName });
            setNewTagName('');
            await refreshTags();
        } catch (error) {
            console.error('Failed to create tag:', error);
        }
    }, { wait: 1000 }).run;

    // 简化任务过滤和排序逻辑
    const filteredTasks = {
        uncompleted: tasks
            .filter(task => task.status === TASK_STATUS.UNCOMPLETED && task.type === 'task')
            .sort((a, b) => PRIORITY_WEIGHTS[b.priority || Priority.NOT_IMPORTANT_NOT_URGENT] - 
                           PRIORITY_WEIGHTS[a.priority || Priority.NOT_IMPORTANT_NOT_URGENT]),
        tracks: tasks.filter(task => task.status === TASK_STATUS.UNCOMPLETED && task.type === 'track'),
        completed: tasks
            .filter(task => task.status === TASK_STATUS.COMPLETED)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, COMPLETED_TASKS_LIMIT)
    };

    // JSX 部分保持基本不变，但使用 filteredTasks 替换原来的过滤逻辑
    return (
        <div className="flex-1 p-4 space-y-4" suppressHydrationWarning >
            <div className="space-y-2">
                <AutosizeTextarea
                    placeholder="添加任务 (AI自动生成标签)"
                    value={newTask.name}
                    onChange={(e) => setNewTask(draft => { draft.name = e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddTask();
                        }
                    }}
                    className="w-full resize-none"
                />
                <div className="flex items-center justify-between gap-2">
                    <Select
                        value={newTask.priority || Priority.NOT_IMPORTANT_NOT_URGENT}
                        onValueChange={(value: Priority) => 
                            setNewTask(draft => {
                                draft.priority = value;
                            })
                        }
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="优先级" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={Priority.IMPORTANT_URGENT}>重要且紧急</SelectItem>
                            <SelectItem value={Priority.IMPORTANT_NOT_URGENT}>重要不紧急</SelectItem>
                            <SelectItem value={Priority.URGENT_NOT_IMPORTANT}>紧急不重要</SelectItem>
                            <SelectItem value={Priority.NOT_IMPORTANT_NOT_URGENT}>不重要不紧急</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Button size="icon" onClick={handleAddTask}>
                            <Plus className="w-4 h-4" />
                        </Button>
                        <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Tag className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>管理标签</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="新标签名称"
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddTag()
                                                }
                                            }}
                                        />
                                        <Button onClick={handleAddTag}>添加</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant="secondary"
                                                className={cn(
                                                    "flex items-center gap-1",
                                                    getTagColor(tag.name)
                                                )}
                                            >
                                                {tag.name}
                                                <button
                                                    onClick={() => handleDeleteTag(tag.id)}
                                                    className="hover:text-destructive"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <TaskList 
                    title="未完成" 
                    tasks={filteredTasks.uncompleted}
                    mutate={mutate}
                    tags={tags}
                />
                <TaskList 
                    title="打卡" 
                    tasks={filteredTasks.tracks}
                    mutate={mutate}
                    tags={tags}
                />
                <TaskList 
                    title="已完成" 
                    tasks={filteredTasks.completed}
                    mutate={mutate}
                    tags={tags}
                />
            </div>
        </div>
    )
}

// 新增 TaskList 组件
function TaskList({ title, tasks, mutate, tags }) {
    return (
        <Collapsible defaultOpen>
            <CollapsibleTrigger className='flex w-full items-center text-sm p-2'>
                <ChevronsUpDown className="h-4 w-4 mr-1" />
                <div className="sr-only">Toggle</div>
                {title}
            </CollapsibleTrigger>
            <CollapsibleContent>
                {tasks.map((task) => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        setTasks={mutate} 
                        tags={tags} 
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
}

