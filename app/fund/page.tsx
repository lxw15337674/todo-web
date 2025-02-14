"use client"

import { useEffect, useState } from "react"
import { Chart } from "./Chart"
import { DataTable } from "./components/data-table"
import { createAsset, deleteAsset, getAssets, updateAsset } from "../../src/api/assets/assetsActions"
import { Asset } from "@prisma/client"
import { AssetFormData } from "../../src/api/assets/types"

export default function AssetAllocation() {
    const [assets = [], setAssets] = useState<Asset[]>([])
    useEffect(() => {
        // 初始加载数据
        getAssets().then(setAssets)
    }, [])

    const addAsset = async (asset: AssetFormData) => {
        const newAsset = await createAsset(asset)
        setAssets([...assets, newAsset])
    }

    const handleDeleteAsset = async (id: string) => {
        await deleteAsset(id)
        setAssets(assets.filter(asset => asset.id !== id))
    }

    const handleEditAsset = async (id: string, updatedAsset: AssetFormData) => {
        const asset = await updateAsset(id, updatedAsset)
        setAssets(assets.map(item =>
            item.id === id ? asset : item
        ))
    }

    return (
        <div className="p-4 space-y-8 max-w-2xl mx-auto">
            <DataTable
                assets={assets}
                onAdd={addAsset}
                onDelete={handleDeleteAsset}
                onEdit={handleEditAsset}
            />
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">资产分布</h3>
                <div className="h-[400px]">
                    <Chart assets={assets} />
                </div>
            </div>
        </div>
    )
}

