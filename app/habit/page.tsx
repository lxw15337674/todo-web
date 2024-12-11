'use client'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createTrackMeta, fetchTrackMetaByToday, fetchTrackMetas } from '../../src/api/habitActions1';
import { TrackItem, TrackMeta } from '@prisma/client';
import { useMount } from 'ahooks';
import { useImmer } from 'use-immer';
import HabitCard from '../../src/components/habit/HabitCard';
import useConfigStore from '../../store/config'
import  { redirect } from 'next/navigation'


export interface Track extends TrackMeta {
    countItems: TrackItem[];
}

export default function TaskManagement() {
    const { validateEditCode } = useConfigStore();
    useMount(() => {
        validateEditCode().then((hasEditCodePermission) => {
            if (!hasEditCodePermission) {
               redirect('/login')
            }
        });
    });
    const [tasks, setTasks] = useImmer<Track[]>([]);
    const [newTask, setNewTask] = useImmer<{ name: string, type: string }>({
        name: '',
        type: ''
    });
    async function fetchTasks() {
        const items = await fetchTrackMetas();
        setTasks(draft => {
            draft.push(...items);
        });
    }
  
    const handleAddTask = async () => {
        if (newTask.name?.trim()) {
            const task = await createTrackMeta(newTask);
            setTasks(draft => {
                draft.push({ ...task, countItems: [] });
            });
            setNewTask(draft => {
                draft.name = '';
                draft.type = '';
            });
        }
    };

    useMount(() => {
        fetchTasks();
    });

    return (
        <div className=" h-screen ">
            {/* <div className="border-r  p-4">
                <nav className="mt-4 space-y-1">
                    <Button variant="ghost className="w-full justify-start gap-2">
                        <Calendar className="h-4 w-4" />
                        今天
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <Calendar className="h-4 w-4" />
                        最近7天
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        收集箱
                        <span className="ml-auto text-xs text-muted-foreground">2</span>
                    </Button>
                </nav>
            </div> */}
            <div className="flex flex-col ">
                <header className=" border-b p-4">
                    <div className="flex items-center gap-2 flex-1 max-w-lg ml-auto ">
                        <Input
                            value={newTask.name}
                            onChange={(e) => setNewTask(draft => {
                                draft.name = e.target.value;
                            })}
                            placeholder="输入内容"
                        />
                        <Button onClick={handleAddTask} variant="ghost" className=" text-muted-foreground px-2" >
                            <Plus className="h-4 w-4" />
                            添加打卡
                        </Button>
                    </div>
                </header>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        <div className='grid grid-cols-1 sm:grid-cols-2  gap-4'>
                            {tasks.map(task => (
                                <HabitCard
                                    key={task.id}
                                    task={task}
                                    setTasks={setTasks}
                                />
                            ))}
                            
                        </div>
                    </div>
                    
                </ScrollArea>
            </div>
        </div>
    )
}

