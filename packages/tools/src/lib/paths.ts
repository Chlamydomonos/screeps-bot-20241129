/**
 * 路径常量定义模块
 *
 * 这个模块定义了项目中使用的各种路径常量。
 * 所有路径都基于工具包的位置进行计算，确保在不同环境下都能正确找到相关目录。
 *
 * 路径结构：
 * - ROOT_PATH: 项目根目录
 * - SCREEPS_SRC_PATH: Screeps源码目录
 * - GENERATED_PATH: 生成文件目录
 *
 * 这些路径常量在整个工具包中被广泛使用，用于：
 * - 文件监听和分析
 * - 生成文件的输出
 * - 数据库路径转换
 */

import path from 'path';

// 项目根目录路径（相对于当前工具包位置）
export const ROOT_PATH = path.resolve(__dirname, '../../../..');

// Screeps源码目录路径
export const SCREEPS_SRC_PATH = path.resolve(ROOT_PATH, 'packages/screeps/src');

// 生成文件目录路径
export const GENERATED_PATH = path.resolve(ROOT_PATH, 'packages/screeps/src/generated');
