"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LabelList } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '../../src/components/ui/chart'
import { Asset } from '@prisma/client'

interface ChartProps {
    assets: Asset[]
}

// 使用一组固定的颜色
const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6']


export function Chart({ assets }: ChartProps) {
    // 按名称分组并计算总金额
    const groupedData = assets.reduce((acc, curr) => {
        acc[curr.name] = (acc[curr.name] || 0) + curr.amount
        return acc
    }, {} as Record<string, number>)

    const data = Object.entries(groupedData).map(([name, value]) => ({
        name,
        value
    }))
    const config: ChartConfig = assets.length > 0 ? assets.reduce((acc, cur) => {
        acc[cur.name] = {
            label: cur.name,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }
        return acc
    }, {} as ChartConfig) : {}
    return (
        <ChartContainer config={config}>
            <PieChart>
                <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                />
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    dataKey="value"
                    nameKey="name"
                >
                    {
                        data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                    }
                    <LabelList
                        className="fill-background"
                        stroke="none"
                        dataKey="name"
                        position="outside"
                        fontSize={12}
                        formatter={(value: keyof typeof config) =>
                            config[value]?.label || value
                        }
                    />
                </Pie>
                <Legend />
            </PieChart>
        </ChartContainer>
    )
}