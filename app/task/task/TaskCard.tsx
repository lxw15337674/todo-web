'use client'
import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, startConfettiAnimation, getTagColor } from '../../../src/lib/utils';
import { AggregatedTask, updateTask } from '../../../src/api/task/taskActions';
import { TaskTag } from '../../../src/api/task/tagActions';
import { FlagTriangleRight } from 'lucide-react';
import dayjs from 'dayjs';
import { SetState } from 'ahooks/lib/createUseStorageState';
import { useToast } from '../../../src/hooks/use-toast';
import { AutosizeTextarea } from '@/components/ui/AutosizeTextarea';
import { Badge } from '@/components/ui/badge';

interface TaskCardProps {
  task: AggregatedTask;
  setTasks: (value?: SetState<AggregatedTask[]> | undefined) => void;
  tags: TaskTag[];
}

const TaskCard = ({ task, setTasks, tags }: TaskCardProps) => {
  const [taskName, setTaskName] = useState(task.name);
  const [isEditing, setIsEditing] = useState(false);
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
    setIsEditing(false);
  };

  const checked = task.status === '1';
  return (
    <div
      key={task.id}
      className="flex gap-2 px-2 py-1 hover:bg-accent border-b items-center"
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
        onDoubleClick={() => setIsEditing(true)}
        onChange={(e) => setTaskName(e.target.value)}
        onBlur={renameTask}
        className={cn(
          'flex-1 break-words w-full p-1 border-0 resize-none outline-none text-base',
          checked && 'line-through text-muted-foreground',
        )}
      />
      <div className='flex items-center gap-2'>
        {task?.countItems && (
          <div
            className="flex items-center gap-0.5 py-0.5 rounded-full w-fit"
            title="总打卡"
          >
            <FlagTriangleRight className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">
              {task.countItems.length}天
            </span>
          </div>
        )}
        {task.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <Badge 
                key={tag.id} 
                className={cn(
                  "text-xs font-normal",
                  getTagColor(tag.name)
                )}
                variant="secondary"
              >
                {tag.name}
              </Badge>
            ))}
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
