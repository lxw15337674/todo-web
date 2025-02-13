'use client'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useImmer } from 'use-immer';
import { startConfettiAnimation } from '../../src/lib/utils'
import { createNewAnniversary, deleteAnniversary, getAnniversary, NewAnniversary } from '../../src/api/anniversary'
import useLocalStorageRequest from '../../src/hooks/useLocalStorageRequest'
import { useToast } from '../../src/hooks/use-toast'
import { ToastAction } from '../../src/components/ui/toast'
import { DatePicker } from '../../src/components/ui/datePicker'
import dayjs from 'dayjs';
import AnniversaryCard from './anniversaryCard';


export default function TaskManagement() {
    const [newAnniversary, setNewAnniversary] = useImmer<Partial<NewAnniversary>>({
        name: '',
        date: undefined
    });
    const { data: anniversaries = [], refresh } = useLocalStorageRequest(getAnniversary, {
        cacheKey: 'anniversary'
    })
    const { toast } = useToast()
    const date = newAnniversary.date
    const handleAddAnniversary = async () => {
        if (!newAnniversary.name?.trim()) {
            toast({
                title: '添加失败',
                description: '请输入事件名称',
                variant: "destructive"
            })
            return
        }
        if (!date) {
            toast({
                title: '添加失败',
                description: '请选择日期',
                variant: "destructive"
            })
            return
        }
        const anniversary = await createNewAnniversary(newAnniversary as NewAnniversary);
        refresh()
        setNewAnniversary(draft => {
            draft.name = '';
            draft.date = undefined
        });
        toast({
            title: '添加成功',
            description: `纪念日 "${anniversary.name}" 已成功添加，日期为 ${dayjs(anniversary.date).format('YYYY年MM月DD日')}`
        });
        startConfettiAnimation();
    };
    return (
        <div className="flex flex-col ">
            <header className=" border-b p-4">
                <div className="flex items-center gap-2 flex-1 max-w-lg ml-auto ">
                    <Input
                        value={newAnniversary.name}
                        onChange={(e) => setNewAnniversary(draft => {
                            draft.name = e.target.value;
                        })}
                        placeholder="输入事件名称"
                    />
                    <DatePicker
                        date={date}
                        setDate={(date) => setNewAnniversary(draft => {
                            draft.date = date
                        })}
                    />
                    <Button onClick={handleAddAnniversary} variant="outline" className=" text-muted-foreground px-2" >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <div className="m-4">
                <div className='grid grid-cols-1 sm:grid-cols-4  gap-x-4  gap-y-2 '
                >
                    {anniversaries.map(anniversary => (
                        <AnniversaryCard
                            key={anniversary.id}
                            anniversary={anniversary}
                            onClick={() => {
                                toast({
                                    title: "删除确认",
                                    description: `是否删除纪念日 ${anniversary.name}`,
                                    variant: "destructive",
                                    action: (
                                        <ToastAction altText="删除"
                                            onClick={() => {
                                                deleteAnniversary(anniversary.id)
                                                toast({
                                                    title: "删除成功",
                                                    description: `纪念日 ${anniversary.name} 删除成功`
                                                });
                                                refresh()
                                            }}>
                                            删除
                                        </ToastAction>
                                    ),
                                })
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

