'use server';
import { PrismaClient, Producer } from '@prisma/client';
import { NewProducer, UpdateProducer } from './type';


const prisma = new PrismaClient();

export const createProducer = async (data: NewProducer): Promise<Producer> => {
  return await prisma.producer.create({
    data
  });
};

export const getProducers = async (): Promise<Producer[]> => {
  return await prisma.producer.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'desc'
    }
  });
};

export const getProducerById = async (id: string) => {
  return await prisma.producer.findUnique({
    where: { id }
  });
};

export const updateProducer = async (data: UpdateProducer) => {
  const { id, ...updateData } = data;
  return await prisma.producer.update({
    where: { id },
    data: {
      ...updateData,
      updateTime: new Date()
    }
  });
};

export const deleteProducer = async (id: string) => {
  return await prisma.producer.update({
    where: { id },
    data: {
      deletedAt: new Date()
    }
  });
};

