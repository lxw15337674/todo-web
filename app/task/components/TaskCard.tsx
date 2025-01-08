'use client'
import React, { useState, useEffect } from 'react';
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
import { Priority } from '@prisma/client';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TaskCardProps {
  task: AggregatedTask;
  setTasks: (value?: SetState<AggregatedTask[]> | undefined) => void;
  tags: TaskTag[];
}

// 优先级颜色和文本映射
const priorityConfig = {
    [Priority.IMPORTANT_URGENT]: {
        label: "重要且紧急",
        color: "bg-red-500/10 text-red-500"
    },
    [Priority.IMPORTANT_NOT_URGENT]: {
        label: "重要不紧急",
        color: "bg-orange-500/10 text-orange-500"
    },
    [Priority.URGENT_NOT_IMPORTANT]: {
        label: "紧急不重要",
        color: "bg-yellow-500/10 text-yellow-500"
    },
    [Priority.NOT_IMPORTANT_NOT_URGENT]: {
        label: "不重要不紧急",
        color: "bg-gray-500/10 text-gray-500"
    }
};

export function TaskCard({ task, setTasks, tags }: TaskCardProps) {
  const [taskName, setTaskName] = useState(task.name);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handlePriorityChange = async (value: Priority) => {
    try {
        const updatedTask = await updateTask(task.id, {
            ...task,
            priority: value,
            type: task.type
        });
        
        setTasks((prevTasks = []) =>
            prevTasks.map((t): AggregatedTask => 
                t.id === task.id ? { ...updatedTask, type: task.type } as AggregatedTask : t
            )
        );
    } catch (error) {
        console.error('Failed to update priority:', error);
    }
  };

  const checked = task.status === '1';

  return (
    <div className="flex-1 " suppressHydrationWarning={true}>
      <div>
        <div className="flex flex-wrap items-center gap-2 px-2 py-1 hover:bg-accent border-b">
          {isClient && (
            <>
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleTask(task.id)}
                className="focus:outline-none focus-visible:outline-none shrink-0"
              />
              <AutosizeTextarea
                minHeight={24}
                value={taskName}
                readOnly={!isEditing}
                onDoubleClick={() => setIsEditing(true)}
                onChange={(e) => setTaskName(e.target.value)}
                onBlur={renameTask}
                className={cn(
                  'min-w-[200px] flex-1 break-words p-1 border-0 resize-none outline-none text-base',
                  checked && 'line-through text-muted-foreground',
                )}
              />
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {task?.countItems && (
                  <div className="flex items-center gap-0.5" title="总打卡">
                    <FlagTriangleRight className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-sm">{task.countItems.length}天</span>
                  </div>
                )}
                {task.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map(tag => (
                      <Badge key={tag.id} className={cn("text-xs font-normal", getTagColor(tag.name))} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <Select value={task.priority || Priority.NOT_IMPORTANT_NOT_URGENT} onValueChange={handlePriorityChange}>
                  <SelectTrigger className={cn("h-7 w-[140px] text-xs", task.priority && priorityConfig[task.priority]?.color)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value} className={cn("text-xs", config.color)}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {dayjs(task.updateTime).format('MM/DD HH:mm')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
