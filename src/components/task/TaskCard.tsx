'use client'
import React, { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { cn, startConfettiAnimation } from '../../lib/utils';
import { AggregatedTask, updateTask } from '../../api/taskActions';
import { FlagTriangleRight } from 'lucide-react';
import dayjs from 'dayjs';
import { SetState } from 'ahooks/lib/createUseStorageState';
import { useToast } from '../../hooks/use-toast';
import { AutosizeTextarea } from '../ui/AutosizeTextarea';

interface TaskCardProps {
  task: AggregatedTask;
  setTasks: (value?: SetState<AggregatedTask[]> | undefined) => void;
}

const TaskCard = ({ task, setTasks }: TaskCardProps) => {
  const [taskName, setTaskName] = useState(task.name);
  const { toast } = useToast();
  const toggleTask = async (id: string) => {
    startConfettiAnimation();
    setTasks((tasks) =>
      (Array.isArray(tasks) ? tasks : []).map((t) => {
        if (t.id === id) {
          return { ...t, status: t.status === '0' ? '1' : '0' };
        }
        return t;
      }),
    );
    await updateTask(id, {
      status: task.status === '0' ? '1' : '0',
      type: task.type,
    });
  };

  const renameTask = async () => {
    if (taskName !== task.name) {
      await updateTask(task.id, { ...task, name: taskName });
      setTasks((tasks) =>
        (Array.isArray(tasks) ? tasks : []).map((t) => {
          if (t.id === task.id) {
            return { ...t, name: taskName };
          }
          return t;
        }),
      );
      toast({
        title: '修改成功',
        description: '任务名称已更新',
      });
    }
  };

  const checked = task.status === '1';
  return (
    <div
      key={task.id}
      className="flex items-center gap-2 p-2  hover:bg-accent border-b "
    >
      <Checkbox checked={checked} onCheckedChange={() => toggleTask(task.id)} />
      <AutosizeTextarea
        minHeight={24}
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        onBlur={renameTask}
        className={cn(
          'flex-1 break-words w-36 border-0 resize-none', // 添加 resize-none 样式
          checked && 'line-through text-muted-foreground ',
        )}
      />
      <div className=' flex '>
        {task?.countItems && (
          <div
            className="flex items-center gap-0.5  py-0.5  rounded-full w-fit mr-2"
            title="总打卡"
          >
            <FlagTriangleRight className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">
              {task.countItems.length}天
            </span>
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          {dayjs(task.updateTime).format('MM/DD HH:mm')}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
