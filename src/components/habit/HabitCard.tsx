'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Check,
  CircleCheckBig,
  FlagTriangleRight,
  History,
  Ellipsis,
  XCircle,
  Eraser,
  CalendarOff,
} from 'lucide-react';
import { use, useMemo, useState } from 'react';
import {
  createTrackItem,
  deleteTrackItem,
  deleteTrackMeta,
  updateTrackMeta,
} from '../../api/habitActions';
import { Track } from '../../../app/habit/page';
import { Updater } from 'use-immer';
import { useCountUp } from 'use-count-up';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useMemoizedFn } from 'ahooks';
import { Calendar } from '../ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import dayjs from 'dayjs';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator,
} from '@mui/lab';
import { ScrollArea } from '../ui/scroll-area';
import { zhCN } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { TimePicker } from '../ui/TimePicker';
import { startConfettiAnimation } from '../../lib/utils';

interface HabitCardProps {
  task: Track;
  setTasks: Updater<Track[]>;
}

const HabitCard = ({ task, setTasks }: HabitCardProps) => {
  const [open, setOpen] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [taskName, setTaskName] = useState(task.name);
  const trackItems = task.countItems;
  const { toast } = useToast();
  const { value: animationWidth, reset } = useCountUp({
    isCounting: pressing,
    start: 0,
    end: 100,
    duration: 1,
    onComplete: () => {
      completeTodayTrack(task.id);
    },
  });

  const isTaskCompletedToday = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return task.countItems.some(
      (item) => dayjs(item.createTime).format('YYYY-MM-DD') === today,
    );
  }, [task.countItems]);

  const lastTrackDate = useMemo(() => {
    if (task.countItems.length === 0) return null;
    const lastItem = task.countItems[task.countItems.length - 1].createTime;
    return dayjs(lastItem).format('YYYY-MM-DD HH:mm');
  }, [task.countItems]);

  const markedDates = useMemo(() => {
    return trackItems.map((item) => ({
      date: dayjs(item.createTime).toDate(),
      className: 'bg-green-500',
      datetime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
    }));
  }, [trackItems]);

  const monthlyTrackCount = useMemo(() => {
    return task.countItems.filter((item) =>
      dayjs(item.createTime).isSame(new Date(), 'month'),
    ).length;
  }, [task.countItems]);

  const totalTrackCount = useMemo(() => {
    return task.countItems.length;
  }, [task.countItems]);

  const completeTodayTrack = async (
    id: string,
    createTime: Date = new Date(),
  ) => {
    setTasks((draft) => {
      const index = draft.findIndex((item) => item.id === id);
      draft[index].countItems.push({
        createTime,
        id: Math.random().toString(36),
        countMetaId: id,
        remark: '',
        updateTime: new Date(),
        deletedAt: null,
      });
    });
    const track = await createTrackItem(id, createTime);
    startConfettiAnimation();
    setTasks((draft) => {
      const index = draft.findIndex((item) => item.id === id);
      draft[index] = { ...draft[index], ...track };
    });
  };

  const startPressing = useMemoizedFn(() => {
    if (!isTaskCompletedToday) {
      setPressing(true);
      reset();
    }
  });

  const endPressing = useMemoizedFn(() => {
    if (!isTaskCompletedToday) {
      setPressing(false);
      reset();
    }
  });

  const handleDelete = useMemoizedFn(async () => {
    setTasks((draft) => {
      const index = draft.findIndex((item) => item.id === task.id);
      draft.splice(index, 1);
    });
    await deleteTrackMeta(task.id);
    toast({
      title: '删除成功',
      description: '已成功删除打卡任务',
    });
  });
  const handleDeleteItem = useMemoizedFn(async (id: string) => {
    setTasks((draft) => {
      const index = draft.findIndex((item) => item.id === task.id);
      draft[index].countItems = draft[index].countItems.filter(
        (item) => item.id !== id,
      );
    });
    await deleteTrackItem(id);
    toast({
      title: '删除成功',
      description: '已成功删除打卡记录',
    });
  })
  const onDayClick = useMemoizedFn((day: Date) => {
    if (dayjs(day).isAfter(dayjs(), 'day')) return;
    if (task.countItems.some((item) => dayjs(item.createTime).isSame(day, 'day'))) return;
    setDate(day);
    setDialogOpen(true);
  });

  const renameTask = useMemoizedFn(async () => {
    if (taskName === task.name) return;
    setTasks((draft) => {
      const index = draft.findIndex((item) => item.id === task.id);
      draft[index].name = taskName;
    });
    await updateTrackMeta({
      id: task.id,
      name: taskName,
    });
    toast({
      title: '修改成功',
      description: '已成功修改打卡任务',
    });
  });

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>补卡</DialogTitle>
          </DialogHeader>
          <TimePicker date={date} setDate={setDate} />
          <DialogFooter>
            <Button
              type="submit"
              onClick={() => {
                setDialogOpen(false);
                completeTodayTrack(task.id, date);
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-5/6 px-4 ">
          <SheetHeader className="mb-2">
            <SheetTitle className="flex justify-between items-center ">
              {task.name}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-4">
                    <Ellipsis className="w-4 h-4 mx-auto " />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer text-red-500 dark:text-red-400"
                      onClick={handleDelete}
                    >
                      删除
                    </DropdownMenuItem>
                  </>
                </DropdownMenuContent>
              </DropdownMenu>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-90px)] rounded-md ">
            <div className="space-y-4 mr-4">
              <div className="grid grid-cols-2 gap-4 ">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">总打卡</div>
                    <div className="text-2xl font-bold mt-1">
                      {totalTrackCount}
                      <span className="text-sm font-normal ml-1">天</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      当月打卡
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {monthlyTrackCount}
                      <span className="text-sm font-normal ml-1">天</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Calendar
                mode="multiple"
                disabled={(date) => {
                  return date > new Date();
                }}
                locale={zhCN}
                selected={markedDates.map((item) => item.date)}
                onDayClick={(day) => {
                  onDayClick(day);
                }}
                className="rounded-md border w-full "
              />

              <Card className="px-4 py-4">
                <Timeline
                  position="right"
                  sx={{
                    [`& .${timelineItemClasses.root}:before`]: {
                      flex: 0,
                      padding: 0,
                    },
                  }}
                >
                  {trackItems.map((count, index) => (
                    <TimelineItem key={count.id} className='relative'>
                      <TimelineSeparator>
                        <TimelineDot color="primary" />
                        {index < trackItems.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <div className="text-sm text-muted-foreground mb-2 ">
                          第{trackItems.length - index}次

                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dayjs(count.createTime).format(
                            'YYYY-MM-DD HH:mm:ss',
                          )}
                        </div>
                        {/* 撤回 */}
                        <Button variant="outline" size="icon" className="absolute right-0 top-0 text-muted-foreground h-8 w-8" onClick={() => handleDeleteItem(count.id)}>
                          <CalendarOff className='h-4' />
                        </Button>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Card>
            </div>
          </ScrollArea>
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
                    ${isTaskCompletedToday ? 'border-green-400 ' : ''} p-0 ${pressing && !isTaskCompletedToday ? 'scale-95' : ''
          }`}
      >
        <CardHeader className="px-4 py-2   radius ">
          <CardTitle
            className="truncate text-[#fffff5db] text-lg flex items-center"
            title={task.name}
          >
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onBlur={renameTask}
              className="bg-transparent border-none outline-none text-[#fffff5db] text-lg"
            />
            <Button
              variant="outline"
              size="icon"
              className="ml-auto"
              onClick={(e) => {
                setOpen(true);
              }}
            >
              <History />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2  flex items-end rounded-lg">
          <div
            className="flex items-center gap-0.5  py-0.5  rounded-full w-fit mr-2"
            title="总打卡"
          >
            <FlagTriangleRight className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">
              {task.countItems.length}天
            </span>
          </div>
          <div
            className="flex items-center gap-0.5  py-0.5  rounded-full w-fit"
            title="最近打卡时间"
          >
            <Check className="w-4 h-4 text-red-400" />
            <span className="text-gray-400 text-sm">
              {lastTrackDate || '无'}
            </span>
          </div>
          {isTaskCompletedToday ? (
            <CircleCheckBig className="text-green-400 ml-auto w-6 h-6 mr-2" />
          ) : null}
        </CardContent>
        {Number(animationWidth) ? (
          <Progress
            value={animationWidth as number}
            className="absolute bottom-1 left-2 h-0.5 w-[95%]"
          />
        ) : (
          ''
        )}
      </Card>
    </>
  );
};
HabitCard.displayName = 'HabitCard';
export default HabitCard;
