'use server';
import { PrismaClient, Producer, ProducerTag } from '@prisma/client';
import { NewProducer, UpdateProducer } from './type';


const prisma = new PrismaClient();

export const createProducer = async (data: NewProducer): Promise<Producer> => {
  return await prisma.producer.create({
    data
  });
};

export const getProducers = async (): Promise<(Producer & { tags: ProducerTag[] })[]> => {
  return await prisma.producer.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'desc'
    },
    include: {
      tags: true
    }
  });
};

export const getProducersWithCount = async (): Promise<(Producer & { tags: ProducerTag[], mediaCount: number })[]> => {
  return await prisma.producer.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'desc'
    },
    include: {
      tags: true,
      _count: {
        select: {
          medias: {
            where: {
              deletedAt: null
            }
          }
        }
      }
    }
  }).then(producers => 
    producers.map(({ _count, ...producer }) => ({
      ...producer,
      mediaCount: _count.medias
    }))
  );
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
    },
    include: {
      tags: true
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

export const getProducerTags = async () => {
  return await prisma.producerTag.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'desc'
    }
  });
};

export const createProducerTag = async (data: { name: string, remark?: string }) => {
  return await prisma.producerTag.create({
    data
  });
};

export const deleteProducerTag = async (id: string) => {
  return await prisma.producerTag.update({
    where: { id },
    data: {
      deletedAt: new Date()
    }
  });
};

export const updateProducerTags = async (producerId: string, tagIds: string[]) => {
  return await prisma.producer.update({
    where: { id: producerId },
    data: {
      tags: {
        set: tagIds.map(id => ({ id }))
      }
    },
    include: {
      tags: true
    }
  });
};

