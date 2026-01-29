'use server';

import { cookies } from 'next/headers';

export async function validateEditCode(password?: string) {
  const adminCode = process.env.EDIT_CODE;
  const galleryCode = process.env.GALLERY_EDIT_CODE;

  // If no password configured, always allow as admin
  if (!adminCode && !galleryCode) {
    return 'admin';
  }

  let role: 'admin' | 'gallery' | 'none' = 'none';
  if (adminCode && password === adminCode) {
    role = 'admin';
  } else if (galleryCode && password === galleryCode) {
    role = 'gallery';
  }

  if (role !== 'none') {
    const cookieStore = await cookies();
    // Set auth role cookie valid for 30 days
    cookieStore.set('auth_role', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return role;
}
