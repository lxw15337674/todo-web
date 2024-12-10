'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown, Plus } from 'lucide-react'
import TaskCard from '../../src/components/task/TaskCard'
import { AggregatedTask, createTask, fetchAggregatedTask, NewTask } from '../../src/api/taskActions'
import { useImmer } from 'use-immer'
import useConfigStore from '../../store/config'
import { useLocalStorageState, useMount } from 'ahooks'
import { redirect } from 'next/navigation'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function Page() {
    const { validateEditCode } = useConfigStore();
    const [tasks = [], setTasks] = useLocalStorageState<AggregatedTask[]>('task', {
        defaultValue: [],
    });
    const [newTask, setNewTask] = useImmer<NewTask>({
        name: '',
        remark: '',
        status: '0',
    });
    async function fetchTasks() {
        const items = await fetchAggregatedTask();
        setTasks(items);
    }
    const handleAddTask = async () => {
        if (newTask.name?.trim()) {
            const task = await createTask(newTask);
            setTasks((tasks = []) => [{ ...task, type: 'task' }, ...tasks]);
            setNewTask(draft => {
                draft.name = '';
            });
        }
    };
    // 未完成任务
    const uncompletedTasks = tasks.filter(task => task.status === '0' && task.type === 'task');
    const uncompletedTracks = tasks.filter(task => task.status === '0' && task.type === 'track');
    // 已完成任务
    const completedTasks = tasks.filter(task => task.status === '1');

    useMount(() => {
        validateEditCode().then((hasEditCodePermission) => {
            if (!hasEditCodePermission) {
                redirect('/login')
            }
        });
        fetchTasks();
    });
    return (
        <div className="flex-1 p-4 space-y-4 ">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="添加任务"
                    value={newTask.name}
                    onChange={(e) => setNewTask(draft => {
                        draft.name = e.target.value
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
                                <TaskCard key={task.id} task={task} setTasks={setTasks} />
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
                            <TaskCard key={task.id} task={task} setTasks={setTasks} />
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
                            <TaskCard key={task.id} task={task} setTasks={setTasks} />
                        ))}
                    </CollapsibleContent>
                </Collapsible>

            </div>
        </div>
    )
}

