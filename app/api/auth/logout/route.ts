import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: 'auth_role', path: '/' });
  cookieStore.delete({ name: 'auth_token', path: '/' });
  return NextResponse.json({ ok: true });
}
