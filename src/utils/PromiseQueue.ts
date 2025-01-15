import { randomSleep } from "./sleep";

export class PromiseQueue {
    private queue: (() => Promise<any>)[] = [];
    private isRunning: boolean = false;

    /**
     * 添加任务到队列
     * @param task 返回 Promise 的任务函数
     */
    addTask(task: () => Promise<any>): void {
        this.queue.push(task);
        this.run();
    }

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    /**
     * 运行队列
     */
    private async run(): Promise<void> {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        await randomSleep(1000, 3000);

        while (this.queue.length > 0) {
            const task = this.queue[0]
            try {
                await task(); // 执行任务并等待其完成
                await randomSleep(1000, 3000);
            } catch (error) {
                console.error("任务执行出错:", error.message);
            }
            this.queue.shift(); // 从队列中移除已完成的任务
        }

        this.isRunning = false;
    }
}