import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Circle, CircleCheckBig, FlagTriangleRight, History } from 'lucide-react';
import { useMemo, useState, useCallback } from "react";
import { createTrackItem } from "../../src/api/trackActions";
import { Track } from "./page";
import { Updater } from "use-immer";
import { useCountUp } from 'use-count-up';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../src/components/ui/Sheet'
import { Button } from "../../src/components/ui/button";
import { Progress } from "../../src/components/ui/progress";
import { useMemoizedFn } from "ahooks";

interface TrackCardProps {
    task: Track,
    setTasks: Updater<Track[]>
}

const TrackCard = ({ task, setTasks }: TrackCardProps) => {
    const [open, setOpen] = useState(false)
    const [pressing, setPressing] = useState(false)
    const { value: animationWidth, reset } = useCountUp({
        isCounting: pressing,
        start: 0,
        end: 100,
        duration: 1,
        onComplete: () => {
            completeTodayTrack(task.id)
        },
    })
    const isTaskCompletedToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return task.countItems.some(item => item.createTime.toISOString().split('T')[0] === today);
    }, [task.countItems]);

    const lastTrackDate = useMemo(() => {
        if (task.countItems.length === 0) return null;
        const lastItem = task.countItems[task.countItems.length - 1].createTime;
        return `${lastItem.toISOString().split('T')[0]} ${lastItem.toTimeString().split(' ')[0].slice(0, 5)}`;
    }, [task.countItems]);

    const completeTodayTrack = async (id: string) => {
        if (isTaskCompletedToday) { return }
        setTasks(draft => {
            const index = draft.findIndex(item => item.id === id);
            draft[index].countItems.push({
                createTime: new Date(),
                id: '',
                countMetaId: id,
                remark: '',
                updateTime: new Date(),
                deletedAt: null,
            });
        })
        // const task = await createTrackItem(id);
        // setTasks(draft => {
        //     const index = draft.findIndex(item => item.id === id);
        //     draft[index].countItems.push(task);
        // })
    }

    const startPressing = useMemoizedFn(() => {
        if (!isTaskCompletedToday) {
            setPressing(true)
            reset()
        }
    })

    const endPressing = useMemoizedFn(() => {
        if (!isTaskCompletedToday) {
            setPressing(false)
            reset()
        }
    })

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen} >
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Are you absolutely sure?</SheetTitle>
                        <SheetDescription>This action cannot be undone.</SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
            <Card
                key={task.id}
                onMouseDown={startPressing}
                onMouseUp={endPressing}
                onMouseLeave={endPressing}
                onTouchStart={startPressing}
                onTouchEnd={endPressing}
                className={`relative p-4 transition-transform transform cursor-pointer
                    hover:bg-accent
                    ${isTaskCompletedToday ? 'border-green-600 ' : ''} p-0 ${pressing && !isTaskCompletedToday ? 'scale-95' : ''}`}
            >
                <CardHeader className="px-4 py-2   radius ">
                    <CardTitle className="truncate text-[#fffff5db] text-lg flex items-center" title={task.name}>
                        {task.name}
                        <Button variant="outline" size="icon"
                            className="ml-auto"
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                e.nativeEvent.stopImmediatePropagation()
                                e.nativeEvent.stopPropagation()
                                e.nativeEvent.preventDefault()
                                setOpen(true)
                            }}>
                            <History  />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2  flex items-end rounded-lg">
                    <div>
                    <div className="flex items-center gap-0.5  py-0.5  rounded-full w-fit" title="总打卡">
                        <FlagTriangleRight className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400 text-sm">{task.countItems.length}天</span>
                    </div>
                    <div className="flex items-center gap-0.5  py-0.5  rounded-full w-fit" title="最近打卡时间">
                        <Check className="w-4 h-4 text-red-400" />
                        <span className="text-gray-400 text-sm">{lastTrackDate || '无'}</span>
                    </div>
                    </div>
                    {isTaskCompletedToday ? <CircleCheckBig className="text-green-600 ml-auto w-6 h-6" /> :
                        <Circle className=" ml-auto w-6 h-6 text-[#fffff5db]" />
                    }
                </CardContent>
                {
                    Number(animationWidth) ?
                        <Progress value={animationWidth as number} className="absolute bottom-1 left-2 h-0.5 w-[95%]" /> : ''
                }
            </Card>
        </>
    );
};

export default TrackCard;