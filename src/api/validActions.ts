'use server';

export async function validateEditCode(password?: string) {
  if (!process.env.EDIT_CODE) {
    return true;
  }
  return password === process.env.EDIT_CODE;
}
