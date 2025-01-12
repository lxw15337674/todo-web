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

export const getProducersWithCount = async (): Promise<(Producer & { tags: ProducerTag[], mediaCount: number, postCount: number })[]> => {
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
          },
          posts: {
            where: {
              deletedAt: null
            }
          }
        }
      }
    }
  }).then(producers => {
    console.log('[getProducersWithCount] Raw producers data:', producers);
    const mapped = producers.map(({ _count, ...producer }) => {
      const result = {
        ...producer,
        mediaCount: _count.medias,
        postCount: _count.posts
      };
      console.log('[getProducersWithCount] Mapped producer:', { id: producer.id, mediaCount: _count.medias, postCount: _count.posts });
      return result;
    });
    console.log(`[getProducersWithCount] Found ${mapped.length} producers with counts`);
    return mapped;
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

