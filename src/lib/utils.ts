import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hashString(str: string): number {
  let hash = 0;

  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash &= hash;
  }

  return Math.abs(hash);
}

export function getTagColor(tagName: string) {
  const colors = {
    工作: 'border-blue-500 text-blue-500',
    学习: 'border-green-500 text-green-500',
    生活: 'border-yellow-500 text-yellow-500',
    default: 'border-gray-500 text-gray-500',
  };

  return colors[tagName as keyof typeof colors] || colors.default;
}

export function startConfettiAnimation() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

export const isBrowser = () => typeof window !== 'undefined';

export const safeLocalStorage = {
  getItem: (key: string) => {
    if (!isBrowser()) return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (!isBrowser()) return;
    localStorage.setItem(key, value);
  },
};

export const safeSessionStorage = {
  getItem: (key: string) => {
    if (!isBrowser()) return null;
    return sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (!isBrowser()) return;
    sessionStorage.setItem(key, value);
  },
};
