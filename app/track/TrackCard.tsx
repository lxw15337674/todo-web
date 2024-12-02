import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CheckCircle2, Circle, CircleCheck, CircleCheckBig, FlagTriangleRight } from 'lucide-react';
import { Dispatch, SetStateAction, useMemo } from "react";
import { createTrackItem } from "../../src/api/trackActions";
import { Track } from "./page";
import { Updater } from "use-immer";

interface TrackCardProps {
    task: Track,
    setTasks: Updater<Track[]>
}

const TrackCard = ({ task, setTasks }: TrackCardProps) => {
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
        const task = await createTrackItem(id);
        setTasks(draft => {
            const index = draft.findIndex(item => item.id === id);
            draft[index].countItems.push(task);
        })
    }
    return (
        <Card
            key={task.id}
            className={`p-4 transition-transform transform   ${isTaskCompletedToday ? 'border-green-400 ' : 'cursor-pointer hover:bg-accent'}  p-0`}
            onClick={() => completeTodayTrack(task.id)}
        >
            <CardHeader className="px-4 py-2">
                <CardTitle className="truncate text-[#fffff5db] text-lg" title={task.name}>{task.name}</CardTitle>
                {/* <CardDescription>Card Description</CardDescription> */}
            </CardHeader>
            <CardContent className="p-2  flex align-middle">
                <div className="inline-flex items-center gap-0.5 px-2 py-0.5  rounded-full w-fit" title="总打卡">
                    <FlagTriangleRight className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-sm">{task.countItems.length}天</span>
                </div>
                <div className="inline-flex items-center gap-0.5 px-2 py-0.5  rounded-full w-fit" title="最近打卡时间">
                    <Check className="w-4 h-4 text-red-400" />
                    <span className="text-gray-400 text-sm">{lastTrackDate || '无'}</span>
                </div>
                {isTaskCompletedToday ? <CircleCheckBig className="text-green-400 ml-auto w-6 h-6" /> :
                    <Circle className=" ml-auto w-6 h-6 text-[#fffff5db]" />
                }
            </CardContent>
        </Card>
    );
};

export default TrackCard;