import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export const cleanDatabase = async () => {
  await prisma.producer.deleteMany({})
  await prisma.media.deleteMany({})
}

export const createTestProducer = async (name: string) => {
  return await prisma.producer.create({
    data: { name }
  })
}
