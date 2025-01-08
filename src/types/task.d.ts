import { Priority } from '@prisma/client'

interface Task {
    id: string
    name: string
    status: string
    type: 'task' | 'track'
    priority?: Priority
    remark?: string
    updatedAt: Date
    tags?: TaskTag[]
}

interface NewTask {
    name: string
    remark: string
    status: string
    priority?: Priority
    tagIds?: string[]
}

interface TaskTag {
    id: string
    name: string
} 