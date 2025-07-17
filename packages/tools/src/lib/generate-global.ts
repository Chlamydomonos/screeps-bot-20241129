/**
 * 全局声明文件生成模块
 *
 * 这个模块负责根据代码分析结果生成全局类型声明文件。
 * 主要生成两个文件：
 * 1. global.d.ts - 全局类型声明文件
 * 2. manualReset.ts - 手动重置功能实现文件
 *
 * 功能：
 * - 根据exportGlobal标签生成全局变量声明
 * - 为每个全局变量添加__manualReset方法
 * - 生成manualReset函数用于批量重置全局变量
 *
 * 生成的文件用于：
 * - 提供全局变量的TypeScript类型支持
 * - 实现全局重置功能，模拟Screeps的全局重置行为
 */

import fs from 'fs';
import { GENERATED_PATH } from './paths';
import path from 'path';

/**
 * 全局项接口定义
 */
interface GlobalItem {
    key: string; // 全局变量名
    value: string; // 导出的类名
    file: string; // 源文件路径
}

/**
 * 根据全局缓存数据生成声明文件
 *
 * @param globalCache 全局变量信息数组
 */
export const generateFiles = (globalCache: GlobalItem[]) => {
    // 确保生成目录存在
    if (!fs.existsSync(GENERATED_PATH)) {
        fs.mkdirSync(GENERATED_PATH, { recursive: true });
    }

    // 生成global.d.ts文件内容
    const globalDTS =
        '/* eslint-disable @typescript-eslint/consistent-type-imports */\n/* eslint-disable no-var */\n\n' +
        globalCache
            .map((item) => `declare var ${item.key}: import('${item.file}').${item.value} & { __manualReset(): void };`)
            .join('\n');

    // 生成manualReset.ts文件的导入部分
    const manualResetTS1 = globalCache.map((item) => `import '${item.file}';`).join('\n');

    // 生成manualReset.ts文件的重置函数调用部分
    const manualResetTS2 = globalCache.map((item) => `    ${item.key}.__manualReset();`).join('\n');

    // 组合完整的manualReset.ts文件内容
    const manualResetTS = `${manualResetTS1}\n\nexport const manualReset = () => {\n${manualResetTS2}\n};`;

    // 写入生成的文件
    fs.writeFileSync(path.resolve(GENERATED_PATH, 'global.d.ts'), globalDTS);
    fs.writeFileSync(path.resolve(GENERATED_PATH, 'manual-reset.ts'), manualResetTS);
};
