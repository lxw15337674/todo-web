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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { Priority, Task } from '@prisma/client';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AutosizeTextarea } from '../../../src/components/ui/AutosizeTextarea';

interface TaskCardProps {
  task: Task & { tags: TaskTag[] };
  setTasks: (value?: SetState<AggregatedTask[]> | undefined) => void;
  tags: TaskTag[];
}

// 优先级颜色和文本映射
export const priorityConfig = { // 添加 export
    [Priority.IMPORTANT_URGENT]: {
        label: "重要且紧急",
        color: "bg-red-500/10 text-red-500",
        border: "border-red-500"
    },
    [Priority.IMPORTANT_NOT_URGENT]: {
        label: "重要不紧急",
        color: "bg-orange-500/10 text-orange-500",
        border: "border-orange-500"
    },
    [Priority.URGENT_NOT_IMPORTANT]: {
        label: "紧急不重要",
        color: "bg-yellow-500/10 text-yellow-500",
        border: "border-yellow-500"
    },
    [Priority.NOT_IMPORTANT_NOT_URGENT]: {
        label: "不重要不紧急",
        color: "bg-gray-500/10 text-gray-500",
        border: "border-gray-500"
    }
};

export function TaskCard({ task, setTasks }: TaskCardProps) {
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
      status: task.status === '0' ? '1' : '0'
    });
  };

  const renameTask = async () => {
    if (taskName !== task.name) {
      await updateTask(task.id, { name: taskName });
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
            priority: value
        });
        
        setTasks((prevTasks) =>
            (Array.isArray(prevTasks) ? prevTasks : []).map((t) => ({
                ...t,
                ...(t.id === task.id ? updatedTask : {})
            }))
        );
    } catch (error) {
        console.error('Failed to update priority:', error);
    }
  };

  const checked = task.status === '1';

  return (
      // 修改样式：移除 border 和 shadow-sm，添加 border-b-2 使下划线更明显
      <div className={cn(
        "bg-card  border-b",
        'border-border' // 默认下边框颜色
      )} suppressHydrationWarning={true}>
          {/* 保持内部布局不变 */}
          <div className="flex flex-col gap-2 px-2 py-1 hover:bg-accent h-full rounded-lg">
              {isClient && (
                  <>
                      <div className="flex items-start gap-2">
                          <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleTask(task.id)}
                              className="focus:outline-none focus-visible:outline-none shrink-0 mt-1.5"
                          />
                          <AutosizeTextarea
                              value={taskName}
                              minHeight={24}
                              readOnly={!isEditing}
                              onDoubleClick={() => setIsEditing(true)}
                              onChange={(e) => setTaskName(e.target.value)}
                              onBlur={renameTask}
                              className={cn(
                                  'flex-1 resize-none p-1',
                                  checked && 'line-through text-muted-foreground',
                                  !isEditing && 'bg-transparent border-none focus-visible:ring-0 hover:bg-transparent'
                              )}
                          />
                      </div>
                      <div className="flex items-center gap-2 pl-7">
                          {task.tags && task.tags.length > 0 && (
                              <div className="flex-1 flex flex-wrap gap-1">
                                  {task.tags.map((tag) => (
                                      <Badge
                                          key={tag.id}
                                          variant="outline"
                                          className={cn(
                                              "text-xs border",
                                              getTagColor(tag.name)
                                          )}
                                      >
                                          {tag.name}
                                      </Badge>
                                  ))}
                              </div>
                          )}
                          <div className="flex items-center gap-2 shrink-0">
                              <Select value={task.priority || Priority.NOT_IMPORTANT_NOT_URGENT} onValueChange={handlePriorityChange}>
                                  <SelectTrigger className={cn("h-7 w-[120px] text-xs", task.priority && priorityConfig[task.priority]?.color)}>
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
                      </div>
                  </>
              )}
          </div>
      </div>
  );
}

export default TaskCard;
