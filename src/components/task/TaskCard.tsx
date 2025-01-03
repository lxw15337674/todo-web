'use client'
import React, { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { cn, startConfettiAnimation } from '../../lib/utils';
import { AggregatedTask, updateTask } from '../../api/task/taskActions';
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
  const [isEditing, setIsEditing] = useState(false); // 添加编辑状态
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
    setIsEditing(false); // 退出编辑模式
  };

  const checked = task.status === '1';
  return (
    <div
      key={task.id}
      className="flex  gap-2 px-2 py-1 hover:bg-accent border-b items-center"
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => toggleTask(task.id)}
        className="focus:outline-none focus-visible:outline-none"
      />
      <AutosizeTextarea
        minHeight={24}
        value={taskName}
        readOnly={!isEditing}
        onDoubleClick={() => setIsEditing(true)} // 双击进入编辑模式
        onChange={(e) => setTaskName(e.target.value)}
        onBlur={renameTask}
        className={cn(
          'flex-1 break-words w-36 p-1 m-1 border-0 resize-none   outline-none text-base', // 添加 resize-none 样式
          checked && 'line-through text-muted-foreground',
        )}
      />
      <div className='flex items-center'>
        {task?.countItems && (
          <div
            className="flex items-center gap-0.5 py-0.5 rounded-full w-fit mr-2"
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
