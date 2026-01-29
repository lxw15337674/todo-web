import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 定义需要管理员权限的路由
const ADMIN_ROUTES = [
  '/task',
  '/habit',
  '/fund',
  '/bookmark',
  '/anniversary',
];

export function proxy(request: NextRequest) {
  // 1. 如果没有设置 EDIT_CODE 环境变量，直接放行
  if (!process.env.EDIT_CODE && !process.env.GALLERY_EDIT_CODE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // 2. 检查当前路径是否在受保护名单中
  const isAdminRoute = ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isAdminRoute) {
    const role = request.cookies.get('auth_role')?.value;
    const isAdmin = role === 'admin' || (!role && request.cookies.has('auth_token'));

    if (isAdminRoute && !isAdmin) {
      // 未登录或无管理员权限，跳转到登录页
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. 如果是登录页且已经有 Cookie，自动跳转到首页
  if (pathname === '/login' && (request.cookies.has('auth_role') || request.cookies.has('auth_token'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了静态资源和 API
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo/|icons/).*)',
  ],
};
