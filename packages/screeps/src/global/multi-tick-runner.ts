/**
 * 多tick任务运行器
 *
 * 该模块提供一个任务队列系统，允许将长时间运行的任务分解为多个tick执行，
 * 避免在单个tick中消耗过多CPU时间。
 */

import { exportGlobal } from '@/base/export-global';

/** 任务函数类型定义 */
type TaskFunc = (nextTick: (n: () => void) => void) => void;

/**
 * 多tick任务运行器类
 *
 * 该类管理一个任务队列，每个tick执行一个任务。任务可以通过nextTick回调
 * 将自己重新加入队列，实现跨tick的连续执行。
 */
export class MultiTickRunner {
    /** 任务队列 */
    private taskQueue: TaskFunc[] = [];

    /**
     * 执行一个tick的任务
     *
     * 如果队列中有任务，取出第一个任务执行。任务可以通过nextTick回调
     * 将继续执行的函数加入队列。
     */
    tick() {
        if (this.taskQueue.length > 0) {
            this.taskQueue.shift()!((n) => this.taskQueue.push(n));
        }
    }

    /**
     * 检查是否有待执行的任务
     *
     * @returns 如果队列中有任务返回true，否则返回false
     */
    get hasTask() {
        return this.taskQueue.length > 0;
    }

    /**
     * 创建并添加一个新任务到队列
     *
     * @param f 要执行的任务函数
     * @returns 返回传入的任务函数
     *
     * @example
     * ```typescript
     * multiTickRunner.createTask((nextTick) => {
     *     // 执行一些操作
     *     console.log('执行任务');
     *
     *     // 如果需要在下一个tick继续执行
     *     nextTick(() => {
     *         console.log('下一个tick的操作');
     *     });
     * });
     * ```
     */
    createTask(f: TaskFunc) {
        this.taskQueue.push(f);
        return f;
    }
}

// #exportGlobal
exportGlobal('multiTickRunner', MultiTickRunner);
