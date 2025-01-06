export interface Media {
  width?: number;
  height?: number;
  // 图片所在文章链接
  originSrc: string;
  userId?: string;
  // 图片所在文章创建时间
  createTime?: Date;
  // 图床链接
  galleryMediaUrl?: string;
  // 原始链接
  originMediaUrl?: string;
  postId?: string;
}