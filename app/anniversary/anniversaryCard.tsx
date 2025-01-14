'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Anniversary } from '@prisma/client';
import dayjs from 'dayjs';

interface AnniversaryCardProps {
    anniversary: Anniversary;
    onClick: () => void;
}

const AnniversaryCard = ({ anniversary, onClick }: AnniversaryCardProps) => {
    const day = dayjs(anniversary.date)
    const gapDay = dayjs(day).diff(dayjs(), 'day');
    return (
        <Card className="overflow-hidden" onClick={() => {
            onClick()
        }}>
            <CardContent className="flex py-2">
                <div className="flex-1 ">
                    <h3 className="text">{anniversary.name}</h3>
                    <h2 className="text-muted-foreground text-sm">{day.format('YYYY年MM月DD日')}</h2>
                </div>
                <div className={`  flex items-center justify-center `}>
                    <h2 className="text-muted-foreground ">   {gapDay < 0 ? (
                        <>
                            已过<span className="text-2xl font-bold mx-2 text-white">{-gapDay}</span>天
                        </>
                    ) : (
                        <>
                            剩余<span className="text-2xl font-bold mx-2 text-white">{gapDay}</span>天
                        </>
                    )}</h2>
                </div>
            </CardContent>
        </Card>
    )
};
AnniversaryCard.displayName = 'AnniversaryCard';
export default AnniversaryCard;
