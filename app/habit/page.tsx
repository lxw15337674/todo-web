'use client'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrackItem, TrackMeta } from '@prisma/client';
import { useMount } from 'ahooks';
import { useImmer } from 'use-immer';
import HabitCard from './HabitCard';
import { createTrackMeta, fetchTrackMetas } from '@/api/habitActions'


export interface Track extends TrackMeta {
    countItems: TrackItem[];
}

export default function TaskManagement() {
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
        <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6">
            <div className="flex flex-col space-y-4 sm:space-y-6">
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border shadow-sm">
                        <div className="flex-1">
                            <Input
                                value={newTask.name}
                                onChange={(e) => setNewTask(draft => {
                                    draft.name = e.target.value;
                                })}
                                placeholder="输入新习惯名称"
                                className="h-10 sm:h-11"
                            />
                        </div>
                        <Button 
                            onClick={handleAddTask} 
                            size="default"
                            className="w-full sm:w-auto px-4 sm:px-6"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            添加习惯
                        </Button>
                    </div>
                    
                    <ScrollArea className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {tasks.map(task => (
                                <HabitCard
                                    key={task.id}
                                    task={task}
                                    setTasks={setTasks}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}

