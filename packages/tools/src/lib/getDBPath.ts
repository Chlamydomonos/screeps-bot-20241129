/**
 * 数据库路径工具模块
 *
 * 这个模块提供路径转换功能，将文件系统的绝对路径转换为数据库中使用的相对路径格式。
 * 主要用于统一不同平台下的路径表示，确保数据库中的路径格式一致。
 *
 * 功能：
 * - 将绝对路径转换为相对于源码根目录的相对路径
 * - 移除文件扩展名（.ts）
 * - 处理index.ts文件的特殊情况
 *
 * 转换规则：
 * - /path/to/src/foo/bar.ts -> foo/bar
 * - /path/to/src/foo/index.ts -> foo
 */

import path from 'path';
import { SCREEPS_SRC_PATH } from './paths';

/**
 * 将完整路径转换为数据库中使用的相对路径格式
 *
 * @param fullPath 文件的完整绝对路径
 * @returns 数据库中使用的相对路径格式
 */
export const getDBPath = (fullPath: string) => {
    return path
        .relative(SCREEPS_SRC_PATH, fullPath) // 转换为相对路径
        .replace(/(\/|\\)index\.ts$/, '') // 移除index.ts后缀
        .replace(/\.ts/, ''); // 移除.ts扩展名
};
