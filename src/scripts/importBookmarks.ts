import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { createBookmark } from '../api/bookmark';

const prisma = new PrismaClient();

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const dataPath = path.join(__dirname, '../src/data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const bookmarks = data.bookmarks;

  for (let i = bookmarks.length - 1; i >= 0; i--) {
    const bookmark = bookmarks[i];
    console.log(`正在处理书签：${bookmark.title}`);
    const { title, content } = bookmark;
    const { url } = content;

    if (!url) {
      console.warn(`书签 "${title}" 缺少 URL，已跳过`);
      continue;
    }    // 创建书签
    try {
      const newBookmark = await createBookmark({
        url: url,
        remark: ''
      });
      if (!newBookmark) {
        console.warn(`创建书签 "${title}" 失败`);
        continue;
      }
      console.log(`创建书签 "${title}" 成功`);
    } catch (error) {
      console.error(`创建书签 "${title}" 时出错：`, error);
    }

    // 延时 2 秒
    await delay(2000);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
