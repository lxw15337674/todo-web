'use server';

import { cookies } from 'next/headers';

export async function validateEditCode(password?: string) {
  // If no password configured, always allow
  if (!process.env.EDIT_CODE) {
    return true;
  }

  // Verify password
  if (password === process.env.EDIT_CODE) {
    const cookieStore = await cookies();
    // Set auth cookie valid for 30 days
    cookieStore.set('auth_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    return true;
  }
  
  return false;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
