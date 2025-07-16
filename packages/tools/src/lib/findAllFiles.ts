/**
 * 文件查找工具模块
 *
 * 这个模块提供递归查找目录中所有TypeScript文件的功能。
 * 主要用于初始化阶段，获取所有需要分析的源文件列表。
 *
 * 功能：
 * - 递归遍历指定目录
 * - 筛选出所有.ts文件
 * - 返回文件的完整路径列表
 *
 * 使用场景：
 * - 项目启动时的初始文件扫描
 * - 批量文件处理
 */

import fs from 'fs';
import path from 'path';

/**
 * 递归查找目录中的所有TypeScript文件
 *
 * @param dir 要搜索的目录路径
 * @returns 所有.ts文件的完整路径数组
 */
export const findAllFiles = (dir: string) => {
    let tsFiles: string[] = [];

    // 读取目录内容
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // 递归处理子目录
            tsFiles = tsFiles.concat(findAllFiles(fullPath));
        } else if (entry.isFile() && fullPath.endsWith('.ts')) {
            // 收集.ts文件
            tsFiles.push(fullPath);
        }
    }

    return tsFiles;
};
