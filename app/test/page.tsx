interface Post {
  id: string;
  title: string;
  content: string;
}

// Next.js 将在请求进来时使缓存失效，
// 最多每 60 秒一次。
export const revalidate = 60;

// 我们只会在构建时预渲染来自 `generateStaticParams` 的参数。
// 如果收到一个尚未生成的路径的请求，
// Next.js 将按需服务器渲染该页面。
export const dynamicParams = true; // 或 false，对未知路径返回 404

export async function generateStaticParams() {
  const posts: Post[] = await fetch('https://api.vercel.app/blog').then((res) =>
    res.json(),
  );
  return posts.map((post) => ({
    id: String(post.id),
  }));
}

export default async function Page({ params }: { params: { id: string } }) {
  const post: Post = await fetch(
    `https://api.vercel.app/blog/${params.id}`,
  ).then((res) => res.json());
  console.log(post);
  return (
    <main>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </main>
  );
}
