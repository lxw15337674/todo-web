'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { TimePickerInput } from './time-picker-input';
import { Input } from './input';

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);
  const dayRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          月
        </Label>
        <Input
          id="month"
          className="w-[40px] text-center font-mono text-base tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none"
          value={date ? date.getMonth() + 1 : ''}
          inputMode="decimal"
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          日
        </Label>
        <Input
          className={
            'w-[48px] text-center font-mono text-base tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none'
          }
          value={date?.getDate()}
          inputMode="decimal"
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          时
        </Label>
        <TimePickerInput
          picker="hours"
          date={date}
          setDate={setDate}
          ref={hourRef}
          onLeftFocus={() => dayRef.current?.focus()}
          onRightFocus={() => minuteRef.current?.focus()}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          分
        </Label>
        <TimePickerInput
          picker="minutes"
          date={date}
          setDate={setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => secondRef.current?.focus()}
        />
      </div>
      {/* <div className="grid gap-1 text-center">
                <Label htmlFor="seconds" className="text-xs">
                    秒
                </Label>
                <TimePickerInput
                    picker="seconds"
                    date={date}
                    setDate={setDate}
                    ref={secondRef}
                    onLeftFocus={() => minuteRef.current?.focus()}
                />
            </div> */}
    </div>
  );
}
