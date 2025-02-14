"use client"

import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { AddAssetDialog } from "./add-asset-dialog"
import { EditAssetDialog } from "./edit-asset-dialog"
import { Asset } from "@prisma/client"
import { ArrowUpDown } from "lucide-react"
import { AssetFormData } from "../../../src/api/assets/types"

interface DataTableProps {
    assets: Asset[]
    onAdd: (asset: AssetFormData) => void
    onDelete: (id: string) => void
    onEdit: (id: string, asset: Asset) => void
}

export function DataTable({ assets, onAdd, onDelete, onEdit }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

    const columns: ColumnDef<Asset>[] = [
        {
            accessorKey: "name",
            header: "名称",
        },
        {
            accessorKey: "amount",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        金额
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "date",
            header: "日期",
            cell: ({ row }) => {
                const date = row.getValue("date") as Date
                return date?.toLocaleDateString()
            }
        },
        {
            id: "actions",
            header: "操作",
            cell: ({ row, table }) => {
                const asset = row.original
                return (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            setEditingAsset(asset)
                            setEditOpen(true)
                        }}>
                            编辑
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => {
                            onDelete(asset.id)
                        }}>
                            删除
                        </Button>
                    </div>
                )
            },
        },
    ]

    const total = assets.reduce((sum, asset) => sum + asset.amount, 0)

    const table = useReactTable<Asset>({
        data: assets,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    })

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">资产记录</h3>
                <Button onClick={() => setOpen(true)}>添加记录</Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    暂无记录
                                </TableCell>
                            </TableRow>
                        )}
                        <TableRow className="border-t-2">
                            <TableCell className="font-medium">总计</TableCell>
                            <TableCell className="font-medium">{total}</TableCell>
                            <TableCell />
                            <TableCell />
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <AddAssetDialog open={open} onOpenChange={setOpen} onAdd={onAdd} />
            {editingAsset && (
                <EditAssetDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    asset={editingAsset}
                    onEdit={(updatedAsset) => onEdit(editingAsset.id, updatedAsset)}
                />
            )}
        </div>
    )
}
