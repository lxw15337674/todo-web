import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import confetti from "canvas-confetti";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 预定义一组好看的颜色，支持暗黑模式
const TAG_COLORS = [
  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
];

// 根据字符串生成一个确定的数字
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// 根据标签名称获取颜色
export function getTagColor(tagName: string) {
    const colors = {
        工作: "border-blue-500 text-blue-500",
        学习: "border-green-500 text-green-500",
        生活: "border-yellow-500 text-yellow-500",
        // 可以添加更多标签颜色
        default: "border-gray-500 text-gray-500"
    };

    return colors[tagName as keyof typeof colors] || colors.default;
}

export function startConfettiAnimation() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
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
  }
};