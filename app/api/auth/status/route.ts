import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminCode = process.env.EDIT_CODE;
  const galleryCode = process.env.GALLERY_EDIT_CODE;

  if (!adminCode && !galleryCode) {
    return NextResponse.json({ role: 'admin' });
  }

  const allowedRoles = new Set<string>();
  if (adminCode) allowedRoles.add('admin');
  if (galleryCode) allowedRoles.add('gallery');

  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;

  if (role && allowedRoles.has(role)) {
    return NextResponse.json({ role });
  }

  // Backward compatibility for legacy auth token
  if (cookieStore.has('auth_token') && allowedRoles.has('admin')) {
    return NextResponse.json({ role: 'admin' });
  }

  return NextResponse.json({ role: 'none' });
}
