import * as React from "react"
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { zhCN } from "date-fns/locale"

interface DatePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
}

export function DatePicker({ date, setDate }: DatePickerProps) {
    const [month, setMonth] = React.useState<number>(date ? date.getMonth() : new Date().getMonth())
    const [year, setYear] = React.useState<number>(date ? date.getFullYear() : new Date().getFullYear())

    const years = React.useMemo(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i)
    }, [])

    const months = React.useMemo(() => {
        if (year) {
            return eachMonthOfInterval({
                start: startOfYear(new Date(year, 0, 1)),
                end: endOfYear(new Date(year, 0, 1))
            })
        }
        return []
    }, [year])

    React.useEffect(() => {
        if (date) {
            setMonth(date.getMonth())
            setYear(date.getFullYear())
        }
    }, [date])

    const handleYearChange = (selectedYear: string) => {
        const newYear = parseInt(selectedYear, 10)
        setYear(newYear)
        if (date) {
            const newDate = new Date(date)
            newDate.setFullYear(newYear)
            setDate(newDate)
        }
    }

    const handleMonthChange = (selectedMonth: string) => {
        const newMonth = parseInt(selectedMonth, 10)
        setMonth(newMonth)
        if (date) {
            const newDate = new Date(date)
            newDate.setMonth(newMonth)
            setDate(newDate)
        } else {
            setDate(new Date(year, newMonth, 1))
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: zhCN }) : <span>选择日期</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex justify-between p-2 space-x-1">
                    <Select onValueChange={handleYearChange} value={year.toString()}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="年份" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}年
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={handleMonthChange} value={month.toString()}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="月份" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                    {format(m, "MMMM", { locale: zhCN })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Calendar
                    captionLayout="dropdown-buttons"
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={zhCN}
                    month={new Date(year, month)}
                    onMonthChange={(newMonth) => {
                        setMonth(newMonth.getMonth())
                        setYear(newMonth.getFullYear())
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}