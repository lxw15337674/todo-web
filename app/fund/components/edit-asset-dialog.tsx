"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Asset } from "@prisma/client"
import { DatePicker } from "../../../src/components/ui/datePicker"

interface EditAssetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    asset: Asset
    onEdit: (asset: Asset) => void
}

export function EditAssetDialog({ open, onOpenChange, asset, onEdit }: EditAssetDialogProps) {
    const [formData, setFormData] = useState<Asset>(asset)

    useEffect(() => {
        setFormData(asset)
    }, [asset])

    const handleSubmit = () => {
        onEdit(formData)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>编辑资产</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>类型</Label>
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
                    <Button className="w-full" onClick={handleSubmit}>保存</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
