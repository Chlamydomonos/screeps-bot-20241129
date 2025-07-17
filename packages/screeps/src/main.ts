/**
 * Screeps Bot 主入口文件
 *
 * 该文件是Screeps机器人的主要入口点，负责：
 * 1. 处理全局重置和WASM模块初始化
 * 2. 管理多tick任务执行
 * 3. 提供全局工具函数
 */

import '@/generated/manual-reset';
import { initGame } from './global/init-game';
import { initWasm } from './init-wasm';

// 将initGame函数导出到全局作用域，供控制台调用
(global as any).initGame = initGame;

/**
 * 清除所有游戏中的旗帜
 * 该函数被导出到全局作用域，可在控制台中调用clearFlags()来清除所有旗帜
 */
(global as any).clearFlags = () => {
    for (const [_, flag] of Object.entries(Game.flags)) {
        flag.remove();
    }
};

/** 标记WASM模块是否已经初始化 */
let wasmInitiated = false;

/**
 * 主循环函数
 *
 * 该函数在每个游戏tick中被调用，负责：
 * 1. 检查并处理全局重置情况
 * 2. 初始化WASM模块（如果需要）
 * 3. 执行多tick任务
 *
 * @returns void
 */
export const loop = () => {
    if (!wasmInitiated) {
        console.log('经历全局重置，尝试重新加载WASM模块');

        // 检查CPU储量是否足够初始化WASM模块
        if (Game.cpu.tickLimit < 450) {
            console.log('CPU储量不足，暂停全部运算以积累CPU……');
            return;
        }

        // 初始化WASM模块
        initWasm();
        wasmInitiated = true;
        console.log('WASM模块成功加载，CPU消耗:', Game.cpu.getUsed());
    }

    // TODO: 在这里添加机器人的主要逻辑

    // 执行多tick任务
    multiTickRunner.tick();
};
