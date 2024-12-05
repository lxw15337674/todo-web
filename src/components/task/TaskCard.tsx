import React from 'react';
import { Checkbox } from '../ui/checkbox';
import { cn, startConfettiAnimation } from '../../lib/utils';
import { AggregatedTask, updateTask } from '../../api/taskActions';
import { FlagTriangleRight } from 'lucide-react';
import dayjs from 'dayjs';

interface TaskCardProps {
    task: AggregatedTask;
    setTasks: React.Dispatch<React.SetStateAction<AggregatedTask[]>>;
}

const TaskCard = ({ task, setTasks }: TaskCardProps) => {
    const toggleTask = async (id: string) => {
        startConfettiAnimation();
        setTasks((tasks) => tasks.map((t) => {
            if (t.id === id) {
                return { ...t, status: t.status === '0' ? '1' : '0' };
            }
            return t;
        }));
        await updateTask(id, { status: task.status === '0' ? '1' : '0', type: task.type });
    }
    const checked = task.status === '1'
    return (
        <div key={task.id} className="flex items-center gap-2 p-2  hover:bg-accent border-b">
            <Checkbox
                checked={checked}
                onCheckedChange={() => toggleTask(task.id)}
            />
            <span className={cn('flex-1', checked && 'line-through text-muted-foreground')}>
                {task.name}
            </span>
            {task?.countItems &&
                <div className="flex items-center gap-0.5  py-0.5  rounded-full w-fit mr-2" title="总打卡">
                    <FlagTriangleRight className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-sm">{task.countItems.length}天</span>
                </div>
            }
            <span className="text-sm text-muted-foreground">
                {dayjs(task.updateTime).format('MM/DD')}
            </span>
        </div>
    );
};

export default TaskCard;