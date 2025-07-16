/**
 * 数据库连接和配置模块
 *
 * 这个模块负责创建和配置SQLite数据库连接，用于存储代码分析结果。
 * 数据库用于保存类、方法、标签等元数据信息，支持ESLint插件的查询需求。
 *
 * 功能：
 * - 创建SQLite数据库连接
 * - 注册所有数据模型
 * - 同步数据库表结构
 * - 可选的数据库清理功能
 *
 * 数据模型：
 * - ClassMeta: 类元数据
 * - MethodMeta: 方法元数据
 * - GlobalStatement: 全局语句
 * - 各种Tag和TagData模型用于存储标签信息
 *
 * 数据库位置：
 * - 位于项目根目录的.cache/db.sqlite
 */

import { Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';
import fs from 'fs';
import path from 'path';
import { ROOT_PATH } from '../paths';
import { rimraf } from 'rimraf';
import { ClassMeta } from './models/ClassMeta';
import { MethodMeta } from './models/MethodMeta';
import { ClassTag } from './models/ClassTag';
import { ClassTagData } from './models/ClassTagData';
import { MethodTag } from './models/MethodTag';
import { MethodTagData } from './models/MethodTagData';
import { GlobalStatement } from './models/GlobalStatement';
import { GlobalStatementTag } from './models/GlobalStatementTag';
import { GlobalStatementTagData } from './models/GlobalStatementTagData';

/**
 * 创建数据库连接
 *
 * @param clear 是否清空现有数据库（可选）
 * @returns Sequelize数据库实例
 */
export const createDB = async (clear?: boolean) => {
    const dbPath = path.resolve(ROOT_PATH, '.cache');

    // 可选的数据库清理
    if (clear) {
        await rimraf(dbPath);
    }

    // 确保缓存目录存在
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }

    // 创建Sequelize实例
    const db = new Sequelize({
        dialect: SqliteDialect,
        storage: path.resolve(dbPath, 'db.sqlite'),
        models: [
            ClassMeta,
            ClassTag,
            ClassTagData,
            MethodMeta,
            MethodTag,
            MethodTagData,
            GlobalStatement,
            GlobalStatementTag,
            GlobalStatementTagData,
        ],
    });

    // 同步数据库表结构
    await db.sync();
    return db;
};

// 导出数据库类型定义
export type DB = ReturnType<typeof createDB> extends Promise<infer R> ? R : never;
