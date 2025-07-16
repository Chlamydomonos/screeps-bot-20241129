/**
 * 代码分析工具包的主要导出模块
 *
 * 这个文件导出了工具包的主要功能和类型定义：
 * - getDBPath: 用于获取数据库路径的工具函数
 * - FullClass: 完整类信息的类型定义
 * - Tag: 标签信息的类型定义
 *
 * 这些导出主要用于ESLint插件和其他需要访问代码分析结果的模块
 */

export { getDBPath } from './lib/getDBPath';
export type { FullClass, Tag } from './lib/getClassCache';
