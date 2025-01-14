'use server';
import { PrismaClient, Producer, ProducerTag } from '@prisma/client';
import { NewProducer, UpdateProducer } from './type';

// 使用单例模式避免多次创建连接
const prisma = new PrismaClient();

// 通用的Producer查询配置
const defaultProducerInclude = {
  ProducerToProducerTag: {
    include: {
      ProducerTag: true
    }
  }
} as const;

// 通用的转换函数
const mapProducerWithTags = (producer: Producer & { ProducerToProducerTag: { ProducerTag: ProducerTag }[] }) => ({
  ...producer,
  tags: producer.ProducerToProducerTag.map(p => p.ProducerTag)
});

export const createProducer = async (data: NewProducer): Promise<Producer> => {
  return await prisma.producer.create({
    data,
    include: defaultProducerInclude
  }).then(mapProducerWithTags);
};

export const getProducers = async (): Promise<(Producer & { tags: ProducerTag[] })[]> => {
  const producers = await prisma.producer.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'desc'
    },
    include: defaultProducerInclude
  });

  return producers.map(mapProducerWithTags);
};

export const getProducersWithCount = async (): Promise<(Producer & { tags: ProducerTag[], mediaCount: number, postCount: number })[]> => {
  const producers = await prisma.producer.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'asc'
    },
    include: {
      ...defaultProducerInclude,
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
  });

  return producers.map((producer) => ({
    ...mapProducerWithTags(producer),
    mediaCount: producer._count.medias,
    postCount: producer._count.posts
  }));
};

export const getProducerById = async (id: string) => {
  return await prisma.producer.findUnique({
    where: { id },
    include: defaultProducerInclude
  }).then(producer => producer ? mapProducerWithTags(producer) : null);
};

export const updateProducer = async (data: UpdateProducer) => {
  const { id, ...updateData } = data;
  return await prisma.producer.update({
    where: { id },
    data: {
      ...updateData,
      updateTime: new Date()
    },
    include: defaultProducerInclude
  }).then(mapProducerWithTags);
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
  return await prisma.$transaction(async (tx) => {
    // 删除现有关联
    await tx.producerToProducerTag.deleteMany({
      where: {
        A: producerId
      }
    });

    // 创建新关联并返回更新后的结果
    const producer = await tx.producer.update({
      where: { id: producerId },
      data: {
        ProducerToProducerTag: {
          create: tagIds.map(tagId => ({
            B: tagId
          }))
        }
      },
      include: defaultProducerInclude
    });

    return mapProducerWithTags(producer);
  });
};

