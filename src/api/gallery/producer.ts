'use server';
import { Producer, ProducerTag } from '@prisma/client';
import { cookies } from 'next/headers';
import { NewProducer, UpdateProducer } from './type';
import prisma from '../prisma';

// 验证编辑密码
const verifyEditCode = async (editCode?: string): Promise<boolean> => {
  const adminCode = process.env.EDIT_CODE;
  const galleryCode = process.env.GALLERY_EDIT_CODE;
  if (!adminCode && !galleryCode) {
    return true; // 如果没有设置密码要求，则允许所有操作
  }

  if (editCode && (editCode === adminCode || editCode === galleryCode)) {
    return true;
  }

  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;
  if (role === 'admin' || role === 'gallery') {
    return true;
  }

  // Backward compatibility for legacy auth token
  if (!role && cookieStore.has('auth_token') && adminCode) {
    return true;
  }

  return false;
};

// 通用的Producer查询配置
const defaultProducerInclude = {
  ProducerToProducerTag: {
    include: {
      ProducerTag: true,
    },
  },
} as const;

// 通用的转换函数
const mapProducerWithTags = (
  producer: Producer & {
    ProducerToProducerTag: { ProducerTag: ProducerTag }[];
  },
) => ({
  ...producer,
  tags: producer.ProducerToProducerTag.map((p) => p.ProducerTag),
});

export const createProducer = async (data: NewProducer & { editCode?: string }): Promise<Producer> => {
  if (!await verifyEditCode(data.editCode)) {
    throw new Error('无效的访问密码');
  }

  const { editCode, ...producerData } = data;
  return await prisma.producer
    .create({
      data: producerData,
      include: defaultProducerInclude,
    })
    .then(mapProducerWithTags);
};

export const getProducers = async (): Promise<
  (Producer & { tags: ProducerTag[] })[]
> => {
  const producers = await prisma.producer.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'desc',
    },
    include: defaultProducerInclude,
  });

  return producers.map(mapProducerWithTags);
};

export const getProducersWithCount = async (): Promise<
  (Producer & { tags: ProducerTag[]; mediaCount: number; postCount: number })[]
> => {
  const producers = await prisma.producer.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'asc',
    },
    include: {
      ...defaultProducerInclude,
      _count: {
        select: {
          medias: {
            where: {
              deletedAt: null,
            },
          },
          posts: {
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  return producers.map((producer) => ({
    ...mapProducerWithTags(producer),
    mediaCount: producer._count.medias,
    postCount: producer._count.posts,
  }));
};

export const getProducerById = async (id: string) => {
  return await prisma.producer
    .findUnique({
      where: { id },
      include: defaultProducerInclude,
    })
    .then((producer) => (producer ? mapProducerWithTags(producer) : null));
};

export const updateProducer = async (data: UpdateProducer & { editCode?: string }) => {
  if (!await verifyEditCode(data.editCode)) {
    throw new Error('无效的访问密码');
  }

  const { id, editCode, ...updateData } = data;
  return await prisma.producer
    .update({
      where: { id },
      data: {
        ...updateData,
        updateTime: new Date(),
      },
      include: defaultProducerInclude,
    })
    .then(mapProducerWithTags);
};

export const deleteProducer = async (id: string, editCode?: string) => {
  if (!await verifyEditCode(editCode)) {
    throw new Error('无效的访问密码');
  }

  return await prisma.producer.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};

export const getProducerTags = async () => {
  return await prisma.producerTag.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createTime: 'desc',
    },
  });
};

export const createProducerTag = async (data: {
  name: string;
  remark?: string;
  editCode?: string;
}) => {
  if (!await verifyEditCode(data.editCode)) {
    throw new Error('无效的访问密码');
  }

  const { editCode, ...tagData } = data;
  return await prisma.producerTag.create({
    data: tagData,
  });
};

export const deleteProducerTag = async (id: string, editCode?: string) => {
  if (!await verifyEditCode(editCode)) {
    throw new Error('无效的访问密码');
  }

  return await prisma.producerTag.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};

export const updateProducerTags = async (
  producerId: string,
  tagIds: string[],
  editCode?: string,
) => {
  if (!await verifyEditCode(editCode)) {
    throw new Error('无效的访问密码');
  }

  return await prisma.$transaction(async (tx) => {
    // 删除现有关联
    await tx.producerToProducerTag.deleteMany({
      where: {
        A: producerId,
      },
    });

    // 创建新关联并返回更新后的结果
    const producer = await tx.producer.update({
      where: { id: producerId },
      data: {
        ProducerToProducerTag: {
          create: tagIds.map((tagId) => ({
            B: tagId,
          })),
        },
      },
      include: defaultProducerInclude,
    });

    return mapProducerWithTags(producer);
  });
};
