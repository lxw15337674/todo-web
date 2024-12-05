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
  const count: number = 300;
  const defaults = {
    origin: { y: 0.7 },
  };

  /**
   * 触发一次散花动画。
   * @param particleRatio - 粒子数量比例
   * @param opts - 其他配置选项
   */
  function fire(particleRatio: number, opts: confetti.Options): void {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // 触发多次散花动画
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
