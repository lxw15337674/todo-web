import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 启动一个从上往下散花的动画。
 */
export function startConfettiAnimation(): void {
  confetti({
    particleCount:100,
    angle: 60,
    spread: 55,
    startVelocity:50,
    origin: { x: 0 ,y: 0.8},
  });
  confetti({
    particleCount:100,
    angle: 120,
    spread: 55,
    startVelocity: 50,
    origin: { x: 1 ,y: 0.8},
  });
}


export function isBrowser() {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}