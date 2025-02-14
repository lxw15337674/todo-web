"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { AssetFormData } from "../../../src/api/assets/types"
import { DatePicker } from "../../../src/components/ui/datePicker"

interface AddAssetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdd: (asset: AssetFormData) => void
}

export function AddAssetDialog({ open, onOpenChange, onAdd }: AddAssetDialogProps) {
    const [formData, setFormData] = useState<AssetFormData>({
        name: '',
        amount: 0,
        date: new Date(),
        description: '',
    })

    const handleSubmit = () => {
        onAdd(formData)
        onOpenChange(false)
        setFormData({
            name: '',
            amount: 0,
            date: new Date(),
            description: '',
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>添加资产记录</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>名称</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>金额</Label>
                        <Input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>日期</Label>
                        <DatePicker
                            date={formData.date}
                            setDate={(v) => setFormData({ ...formData, date: v || new Date() })}
                        />
                    </div>
                    <Button className="w-full" onClick={handleSubmit}>添加</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
