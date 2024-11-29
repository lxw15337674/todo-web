'use client'
import { useState, useEffect } from 'react';
import { Bell, Calendar, CheckCircle2, ChevronDown, MoreHorizontal, Plus, Search, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createTrackItem, deleteTrackItem, getTrackItems, getTrackMetas, updateTrackItem } from '../../src/api/trackActions';
import { TrackItem, TrackMeta } from '@prisma/client';
import { useMount } from 'ahooks';


export default function TaskManagement() {
    const [tasks, setTasks] = useState<TrackMeta[]>([]);
    const [newTask, setNewTask] = useState<Partial<TrackMeta>>({
        name: '',
        type: ''
    });
    async function fetchTasks() {
        const items = await getTrackMetas();
        setTasks(items);
    }


    const handleAddTask = async () => {
        if (newTask.name?.trim()) {
            const task = await createTrackItem(newTask);
            setTasks([...tasks, task]);
            setNewTask('');
        }
    };

    const handleUpdateTask = async (id, remark) => {
        const updatedTask = await updateTrackItem(id, remark);
        setTasks(tasks.map(task => task.id === id ? updatedTask : task));
    };

    const handleDeleteTask = async (id) => {
        await deleteTrackItem(id);
        setTasks(tasks.filter(task => task.id !== id));
    };
    useMount(() => {
        fetchTasks();
    });
    return (
        <div className="grid h-screen grid-cols-[240px_1fr_300px]">
            {/* Sidebar */}
            <div className="border-r bg-gray-50/40 p-4">
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-500" />
                    <span className="text-sm font-medium">Task Manager</span>
                </div>
                <nav className="mt-4 space-y-1">
                    <Button variant="ghost" className="w-full justify-start gap-2">
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
            </div>

            {/* Main Content */}
            <div className="flex flex-col">
                <header className="flex items-center justify-between border-b p-4">
                    <h1 className="text-lg font-semibold">收集箱</h1>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </header>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="输入内容或使用/快捷输入"
                            />
                            <Button onClick={handleAddTask} variant="ghost" className="gap-2 text-muted-foreground">
                                <Plus className="h-4 w-4" />
                                添加任务
                            </Button>
                        </div>
                        {tasks.map(task => (
                            <Card key={task.id} className="p-4">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            className="mt-1"
                                            checked={task.completed}
                                            onChange={() => handleUpdateTask(task.id, { ...task, completed: !task.completed })}
                                        />
                                        <div className="flex-1">
                                            <div className={`font-medium ${task.completed ? 'line-through opacity-50' : ''}`}>
                                                {task.remark}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{task.date}</div>
                                        </div>
                                        <Button onClick={() => handleDeleteTask(task.id)} variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Separator />
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Panel */}
            <div className="border-l p-4">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">一个打卡记录</h2>
                    <Input placeholder="输入内容或使用/快捷输入" />
                </div>
            </div>
        </div>
    )
}

