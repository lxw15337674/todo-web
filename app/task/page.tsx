'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown, Plus, Tag, X } from 'lucide-react'
import TaskCard from './task/TaskCard'
import { createTask, fetchAggregatedTask, NewTask } from '../../src/api/task/taskActions'
import { fetchTaskTags, createTaskTag, deleteTaskTag, TaskTag } from '../../src/api/task/tagActions'
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

const cacheKey = 'AggregatedTask'
export default function Page() {
    const { data: tasks = [], mutate } = useLocalStorageRequest(fetchAggregatedTask, {
        cacheKey,
    });
    const [newTask, setNewTask] = useImmer<NewTask>({
        name: '',
        remark: '',
        status: '0',
    });
    const [tags, setTags] = useState<TaskTag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const fetchedTags = await fetchTaskTags();
            setTags(fetchedTags);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const parseTaskAndTags = (taskInput: string) => {
        // 解析输入中的标签
        const tagPattern = /#([^\s]+)/g;  // 修改正则表达式，匹配 # 后面的非空白字符
        const matches = Array.from(taskInput.matchAll(tagPattern));
        const tagNames = matches.map(match => match[1]);
        
        // 从输入中移除标签标记
        const cleanName = taskInput.replace(tagPattern, '').trim();
        
        // 分离已存在的标签和新标签
        const existingTags = tags.filter(tag => tagNames.includes(tag.name));
        const newTagNames = tagNames.filter(name => !tags.find(tag => tag.name === name));

        return { 
            name: cleanName, 
            existingTagIds: existingTags.map(tag => tag.id),
            newTagNames 
        };
    };

    const { run: handleAddTask } = useThrottleFn(async () => {
        if (newTask.name?.trim()) {
            const { name, existingTagIds, newTagNames } = parseTaskAndTags(newTask.name);
            
            // 创建新标签
            const newTags = await Promise.all(
                newTagNames.map(name => createTaskTag({ name }))
            );
            
            // 合并已有标签ID和新标签ID
            const allTagIds = [...existingTagIds, ...newTags.map(tag => tag.id)];

            const taskToCreate = {
                ...newTask,
                name,
                tagIds: allTagIds,
            };
            
            const task = await createTask(taskToCreate);
            mutate((tasks = []) => [{ ...task, type: 'task', tags: task.tags || [] }, ...tasks]);
            setNewTask(draft => {
                draft.name = '';
            });
            
            // 更新标签列表
            await loadTags();
        }
    }, { wait: 1000 });

    const { run: handleAddTag } = useThrottleFn(async () => {
        if (newTagName.trim()) {
            try {
                await createTaskTag({ name: newTagName });
                setNewTagName('');
                await loadTags();
            } catch (error) {
                console.error('Failed to create tag:', error);
            }
        }
    }, { wait: 1000 });

    const handleDeleteTag = async (tagId: string) => {
        try {
            await deleteTaskTag(tagId);
            await loadTags();
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    };

    // 未完成任务
    const uncompletedTasks = tasks.filter(task => task.status === '0' && task.type === 'task');
    const uncompletedTracks = tasks.filter(task => task.status === '0' && task.type === 'track');
    // 已完成任务
    const completedTasks = tasks.filter(task => task.status === '1');

    return (
        <div className="flex-1 p-4 space-y-4" suppressHydrationWarning >
            <div className="flex items-center gap-2">
                <Input
                    placeholder="添加任务 (使用 #标签名 添加标签)"  // 更新提示文本
                    value={newTask.name}
                    onChange={(e) => setNewTask(draft => {
                        draft.name = e.target.value;
                    })}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleAddTask()
                        }
                    }}
                    className="flex-1"
                />
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
            <div className="space-y-2">
                <Collapsible defaultOpen>
                    <CollapsibleTrigger className='flex w-full items-center text-sm p-2'>
                        <ChevronsUpDown className="h-4 w-4 mr-1" />
                        <div className="sr-only">Toggle</div>
                        未完成
                    </CollapsibleTrigger>
                    <CollapsibleContent >
                        <div >
                            {uncompletedTasks.map((task) => (
                                <TaskCard key={task.id} task={task} setTasks={mutate} tags={tags} />
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                <Collapsible defaultOpen>
                    <CollapsibleTrigger className='flex w-full items-center text-sm p-2'>
                        <ChevronsUpDown className="h-4 w-4 mr-1" />
                        <div className="sr-only">Toggle</div>
                        打卡
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        {uncompletedTracks.map((task) => (
                            <TaskCard key={task.id} task={task} setTasks={mutate} tags={tags} />
                        ))}
                    </CollapsibleContent>
                </Collapsible>
                <Collapsible defaultOpen>
                    <CollapsibleTrigger className='flex w-full items-center text-sm p-2'>
                        <ChevronsUpDown className="h-4 w-4 mr-1" />
                        <div className="sr-only">Toggle</div>
                        已完成
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        {completedTasks.map((task) => (
                            <TaskCard key={task.id} task={task} setTasks={mutate} tags={tags} />
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    )
}

