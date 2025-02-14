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
import { use, useMemo, useState, useEffect } from 'react';
import {
  createTrackItem,
  deleteTrackItem,
  deleteTrackMeta,
  updateTrackMeta,
} from '../../src/api/habitActions';
import { Track } from './page';
import { Updater } from 'use-immer';
import { useCountUp } from 'use-count-up';
import { Button } from '../../src/components/ui/button';
import { Progress } from '../../src/components/ui/progress';
import { useMemoizedFn } from 'ahooks';
import { Calendar } from '../../src/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../src/components/ui/sheet';
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
import { ScrollArea } from '../../src/components/ui/scroll-area';
import { zhCN } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../src/components/ui/dropdown-menu';
import { useToast } from '../../src/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../src/components/ui/dialog';
import { TimePicker } from '../../src/components/ui/TimePicker';
import { startConfettiAnimation } from '../../src/lib/utils';

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isTaskCompletedToday = useMemo(() => {
    if (!isClient) return false;
    const today = dayjs().format('YYYY-MM-DD');
    return task.countItems.some(
      (item) => dayjs(item.createTime).format('YYYY-MM-DD') === today,
    );
  }, [task.countItems, isClient]);

  const lastTrackDate = useMemo(() => {
    if (!isClient) return null;
    if (task.countItems.length === 0) return null;
    const lastItem = task.countItems[0].createTime;
    return dayjs(lastItem).format('YYYY-MM-DD HH:mm');
  }, [task.countItems, isClient]);

  const markedDates = useMemo(() => {
    if (!isClient) return [];
    return trackItems.map((item) => ({
      date: dayjs(item.createTime).toDate(),
      className: 'bg-green-500',
      datetime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
    }));
  }, [trackItems, isClient]);

  const monthlyTrackCount = useMemo(() => {
    if (!isClient) return 0;
    return task.countItems.filter((item) =>
      dayjs(item.createTime).isSame(new Date(), 'month'),
    ).length;
  }, [task.countItems, isClient]);

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
  const onMakeupClick = useMemoizedFn(() => {
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
    <div suppressHydrationWarning>
      {isClient && (
        <>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">补卡</DialogTitle>
              </DialogHeader>
              <div className="py-6">
                <TimePicker 
                  date={date} 
                  setDate={setDate}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setDialogOpen(false);
                    completeTodayTrack(task.id, date);
                  }}
                >
                  确认补卡
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="w-[90%] sm:w-[540px]">
              <SheetHeader className="mb-4 space-y-2">
                <SheetTitle className="flex justify-between items-center text-2xl">
                  <span className="font-semibold">{task.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-destructive/10">
                        <Ellipsis className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={handleDelete}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        删除任务
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] rounded-md">
                <div className="space-y-4 pr-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-primary/5 border-none shadow-sm hover:bg-primary/10 transition-colors">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground font-medium mb-1">总打卡</div>
                        <div className="text-2xl font-bold text-primary">
                          {totalTrackCount}
                          <span className="text-sm font-normal text-muted-foreground ml-1">天</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-none shadow-sm hover:bg-primary/10 transition-colors">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground font-medium mb-1">当月打卡</div>
                        <div className="text-2xl font-bold text-primary">
                          {monthlyTrackCount}
                          <span className="text-sm font-normal text-muted-foreground ml-1">天</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">打卡记录</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary"
                          onClick={onMakeupClick}
                        >
                          补卡
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base font-medium">打卡记录</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
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
                          <TimelineItem key={count.id} className="relative group">
                            <TimelineSeparator>
                              <TimelineDot className="bg-primary" />
                              {index < trackItems.length - 1 && <TimelineConnector className="bg-primary/30" />}
                            </TimelineSeparator>
                            <TimelineContent>
                              <div className="flex items-center justify-between py-1">
                                <div>
                                  <div className="text-sm font-medium">
                                    第 {trackItems.length - index} 次打卡
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {dayjs(count.createTime).format('YYYY-MM-DD HH:mm:ss')}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleDeleteItem(count.id)}
                                >
                                  <CalendarOff className="h-4 w-4" />
                                </Button>
                              </div>
                            </TimelineContent>
                          </TimelineItem>
                        ))}
                      </Timeline>
                    </CardContent>
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
            className={`relative transition-all duration-200 cursor-pointer p-2
                      hover:bg-accent/50 hover:shadow-lg
                      ${isTaskCompletedToday ? 'border-2 border-green-400/50 bg-green-400/5' : ''} 
                      ${pressing && !isTaskCompletedToday ? 'scale-[0.98] shadow-sm' : 'shadow-md'}`}
          >
            <CardHeader className="px-0 py-0">
              <CardTitle
                className="truncate text-lg flex items-center gap-2 group w-full"
                title={task.name}
              >
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onBlur={renameTask}
                  className="bg-transparent border-none outline-none text-foreground flex-1 
                           hover:bg-accent/30 px-2 py-1 rounded transition-colors
                           focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-70 hover:opacity-100 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                  }}
                >
                  <History className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-1 py-0 flex items-center justify-between rounded-lg">
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center gap-1.5 py-0.5 rounded-full"
                  title="总打卡"
                >
                  <FlagTriangleRight className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground text-sm font-medium">
                    {task.countItems.length}天
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 py-0.5 rounded-full"
                  title="最近打卡时间"
                >
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground text-sm font-medium">
                    {lastTrackDate || '无'}
                  </span>
                </div>
              </div>
              {isTaskCompletedToday ? (
                <CircleCheckBig className="text-green-400 w-6 h-6 animate-in fade-in duration-300" />
              ) : null}
            </CardContent>
            {Number(animationWidth) ? (
              <Progress
                value={animationWidth as number}
                className="absolute bottom-1 left-1  h-1 w-full rounded bg-primary/10 "
              />
            ) : null}
          </Card>
        </>
      )}
    </div>
  );
};
HabitCard.displayName = 'HabitCard';
export default HabitCard;
