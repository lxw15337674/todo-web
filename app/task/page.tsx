'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown, Plus, Tag, X } from 'lucide-react'
import TaskCard, { priorityConfig } from './components/TaskCard'; // 从 TaskCard 导入
import { Priority, Task } from '@prisma/client'; // 确保 Priority 已导入
import { useMemo } from 'react'; // 导入 useMemo
import { AggregatedTask } from '../../src/api/task/taskActions'; // 导入 AggregatedTask 类型
import { TaskTag } from '../../src/api/task/tagActions'; // 导入 TaskTag 类型
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
import { createTask, fetchAggregatedTask, NewTask } from '../../src/api/task/taskActions'
import { fetchTaskTags, createTaskTag, deleteTaskTag } from '../../src/api/task/tagActions'
import { useToast } from '../../src/hooks/use-toast'
import { AutosizeTextarea } from '../../src/components/ui/AutosizeTextarea';

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

// 更新 filteredTasks 的类型声明，使用 AggregatedTask
interface GroupedUncompletedTasks {
    [key: string]: AggregatedTask[]; // 使用 Priority 枚举值作为键，值为 AggregatedTask 数组
}

interface FilteredTasks {
    uncompletedGrouped: GroupedUncompletedTasks;
    completed: AggregatedTask[]; // 使用 AggregatedTask 数组
}

export default function Page() {
    const { data: tasks = [], mutate, refresh: refreshTasks } = useLocalStorageRequest<AggregatedTask[]>(fetchAggregatedTask, {
        cacheKey: 'AggregatedTask',
    });
    const { data: tags = [], refresh: refreshTags } = useLocalStorageRequest<TaskTag[]>(fetchTaskTags, {
        cacheKey: 'TaskTags',
    });

    const { toast } = useToast()
    const [newTask, setNewTask] = useImmer<NewTask>(DEFAULT_NEW_TASK);
    const [newTagName, setNewTagName] = useState('');
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

    useEffect(() => {
        refreshTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 修改 filteredTasks 的计算逻辑，并使用 useMemo 优化性能
    const filteredTasks: FilteredTasks = useMemo(() => {
        const uncompleted = tasks
            .filter(task => task.status === TASK_STATUS.UNCOMPLETED && task.type === 'task')
            .sort((a, b) => PRIORITY_WEIGHTS[b.priority || Priority.NOT_IMPORTANT_NOT_URGENT] -
                PRIORITY_WEIGHTS[a.priority || Priority.NOT_IMPORTANT_NOT_URGENT]);

        const uncompletedGrouped = uncompleted.reduce((acc, task) => {
            const priorityKey = task.priority || Priority.NOT_IMPORTANT_NOT_URGENT;
            if (!acc[priorityKey]) {
                acc[priorityKey] = [];
            }
            acc[priorityKey].push(task);
            return acc;
        }, {} as GroupedUncompletedTasks);

        // 对分组后的任务按优先级排序（确保高优先级在前）
        const sortedPriorityKeys = Object.keys(uncompletedGrouped).sort((a, b) =>
            PRIORITY_WEIGHTS[b as Priority] - PRIORITY_WEIGHTS[a as Priority]
        );

        const sortedUncompletedGrouped: GroupedUncompletedTasks = {};
        sortedPriorityKeys.forEach(key => {
            sortedUncompletedGrouped[key] = uncompletedGrouped[key as Priority];
        });

        const completed = tasks
            .filter(task => task.status === TASK_STATUS.COMPLETED)
            .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()) // 使用 updateTime 排序
            .slice(0, COMPLETED_TASKS_LIMIT);

        return { uncompletedGrouped: sortedUncompletedGrouped, completed };
    }, [tasks]); // 添加 tasks 作为依赖项

    const handleDeleteTag = async (tagId: string) => {
        try {
            await deleteTaskTag(tagId);
            await refreshTags();
            toast({ title: "成功", description: "标签删除成功。" }) // 添加成功提示
        } catch (error) {
            console.error('Failed to delete tag:', error);
            toast({ title: "错误", description: "标签删除失败。", variant: "destructive" }) // 添加失败提示
        }
    };

    // 优化任务处理逻辑
    const handleAddTask = useThrottleFn(async () => {
        const trimmedName = newTask.name?.trim();
        if (!trimmedName) return;

        setNewTask(draft => { draft.name = ''; }); // 清空输入框在请求前
        try {
            await createTask({ ...newTask, name: trimmedName });
            await refreshTasks()
            toast({
                title: "成功",
                description: "任务添加成功。",
            })
        } catch (error) {
            toast({
                title: "错误",
                description: "任务添加失败。",
                variant: "destructive",
            })
            // 如果失败，可能需要恢复输入框内容，或者让用户重试
            // setNewTask(draft => { draft.name = trimmedName; }); 
        }

    }, { wait: 1000 }).run;

    // 优化标签处理逻辑
    const handleAddTag = useThrottleFn(async () => {
        const trimmedTagName = newTagName.trim();
        if (!trimmedTagName) return;

        try {
            await createTaskTag({ name: trimmedTagName });
            setNewTagName('');
            await refreshTags();
            toast({ title: "成功", description: "标签添加成功。" }) // 添加成功提示
        } catch (error) {
            console.error('Failed to create tag:', error);
            toast({ title: "错误", description: "标签添加失败。", variant: "destructive" }) // 添加失败提示
        }
    }, { wait: 1000 }).run;


    // 更新 JSX 以渲染分组后的未完成任务
    return (
        // 减少垂直内边距 p-4 -> p-2
        <div className="flex-1 p-2 " suppressHydrationWarning >
            {/* 减少输入区域的垂直间距 space-y-2 -> space-y-1 */}
            <div className="space-y-1 mb-2"> {/* 增加底部外边距 */} 
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
                    minHeight={36} // 稍微减小最小高度
                />
                {/* 减少按钮行的垂直内边距 */}
                <div className="flex items-center justify-between gap-2 pt-1"> {/* 增加顶部内边距 */} 
                    <Select
                        value={newTask.priority || Priority.NOT_IMPORTANT_NOT_URGENT}
                        onValueChange={(value: Priority) =>
                            setNewTask(draft => {
                                draft.priority = value;
                            })
                        }
                    >
                        {/* 减小 SelectTrigger 的高度 h-9 -> h-8 */}
                        <SelectTrigger className="w-[140px] h-8"> 
                            <SelectValue placeholder="优先级" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* 使用 priorityConfig 动态生成选项，并明确类型 */} 
                            {Object.entries(priorityConfig).map(([value, config]: [string, { label: string; color: string }]) => (
                                <SelectItem key={value} value={value} className={cn("text-xs", config.color)}>
                                    {config.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* ... 添加任务和标签管理按钮 ... */} 
                    <div className="flex items-center gap-2">
                        {/* 减小 Button 的尺寸 size="icon" -> size="sm" */}
                        <Button size="sm" onClick={handleAddTask} disabled={!newTask.name?.trim()}> {/* 禁用条件 */} 
                            <Plus className="w-4 h-4" />
                        </Button>
                        <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                            <DialogTrigger asChild>
                                {/* 减小 Button 的尺寸 size="icon" -> size="sm" */}
                                <Button variant="outline" size="sm">
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
                                        <Button onClick={handleAddTag} disabled={!newTagName.trim()}>添加</Button> {/* 禁用条件 */}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant="secondary"
                                                className={cn(
                                                    "flex items-center gap-1 cursor-pointer",
                                                    getTagColor(tag.name)
                                                )}
                                            >
                                                {tag.name}
                                                <button
                                                    onClick={() => handleDeleteTag(tag.id)}
                                                    className="ml-1 rounded-full hover:bg-destructive/80 hover:text-destructive-foreground p-0.5 transition-colors" // 改进删除按钮样式和交互
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
            {/* 减少任务列表区域的垂直间距 space-y-4 -> space-y-2 */}
            <div className="space-y-2">
                {/* 渲染未完成任务，按优先级分组 */} 
                {Object.entries(filteredTasks.uncompletedGrouped).map(([priority, tasksInGroup]) => (
                    <Collapsible key={priority} defaultOpen>
                        {/* 减小 CollapsibleTrigger 的垂直内边距 p-2 -> py-1 px-2 */}
                        <CollapsibleTrigger className='flex w-full items-center text-sm py-1 px-2 font-medium rounded-md hover:bg-accent transition-colors'>
                            <ChevronsUpDown className="h-4 w-4 mr-2 flex-shrink-0" /> 
                            <div className="sr-only">Toggle</div>
                            <span className={cn("font-semibold truncate", priorityConfig[priority as Priority]?.color)}> 
                                {priorityConfig[priority as Priority]?.label || '未知优先级'}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">({tasksInGroup.length})</span> 
                        </CollapsibleTrigger>
                        {/* 移除 CollapsibleContent 的上边距 pt-1 */}
                        <CollapsibleContent>
                            {/* 减小网格间距 gap-4 -> gap-2, 减小垂直内边距 pb-2 -> pb-1 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 pb-1"> 
                                {tasksInGroup.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task} 
                                        setTasks={mutate}
                                        tags={tags}
                                    />
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}

                {/* 渲染已完成任务 */} 
                {filteredTasks.completed.length > 0 && ( 
                    <Collapsible defaultOpen>
                        {/* 减小 CollapsibleTrigger 的垂直内边距 p-2 -> py-1 px-2 */}
                        <CollapsibleTrigger className='flex w-full items-center text-sm py-1 px-2 font-medium rounded-md hover:bg-accent transition-colors'>
                            <ChevronsUpDown className="h-4 w-4 mr-2 flex-shrink-0" /> 
                            <div className="sr-only">Toggle</div>
                            已完成
                            <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">({filteredTasks.completed.length})</span> 
                        </CollapsibleTrigger>
                        {/* 移除 CollapsibleContent 的上边距 pt-1 */}
                        <CollapsibleContent>
                            {/* 减小网格间距 gap-4 -> gap-2, 减小垂直内边距 pb-2 -> pb-1 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 pb-1"> 
                                {filteredTasks.completed.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task} 
                                        setTasks={mutate}
                                        tags={tags}
                                    />
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
        </div>
    );
}

