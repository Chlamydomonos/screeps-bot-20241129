/**
 * 代码分析与生成工具的主入口文件
 *
 * 这个文件是代码分析服务器的主要入口点，负责：
 * 1. 文件系统监控 - 使用chokidar监听文件变化
 * 2. 自动代码分析 - 当文件改变时自动分析TypeScript文件
 * 3. 生成全局声明 - 根据分析结果生成全局类型声明文件
 * 4. HTTP服务器 - 提供REST API接口供ESLint插件查询类缓存
 *
 * 主要功能：
 * - 监听packages/screeps/src目录下的文件变化
 * - 自动分析文件中的类、方法和标签信息
 * - 生成global.d.ts和manualReset.ts文件
 * - 提供/cache接口供外部查询类信息
 *
 * 重构后的架构：
 * - export-global-processor.ts: 处理exportGlobal解析和代码生成
 * - web-server.ts: 创建和管理HTTP服务器
 */

import chokidar from 'chokidar';
import path from 'path';
import { analyzeFile } from '../lib/analyze-file';
import { clearItemOfFile } from '../lib/clear-item-of-file';
import { createDB } from '../lib/db/db';
import { findAllFiles } from '../lib/find-all-files';
import { SCREEPS_SRC_PATH } from '../lib/paths';
import { processExportGlobal } from '../lib/export-global-processor';
import { createWebServer } from '../lib/web-server';

/**
 * 主函数 - 启动代码分析服务器
 *
 * 执行流程：
 * 1. 初始化数据库并同步表结构
 * 2. 设置文件监听器，监听源码目录变化
 * 3. 处理文件变化事件（添加、修改、删除）
 * 4. 调用export-global-processor处理exportGlobal标签并生成全局声明文件
 * 5. 启动web-server提供HTTP API接口
 */

const main = async () => {
    // 获取所有需要分析的TypeScript文件
    const files = new Set(findAllFiles(SCREEPS_SRC_PATH));

    // 创建数据库连接并同步表结构
    const db = await createDB(true);
    await db.sync();

    // 设置文件监听器
    chokidar
        .watch(SCREEPS_SRC_PATH, {
            // 忽略generated目录，避免循环生成
            ignored: (p) => path.relative(SCREEPS_SRC_PATH, p).startsWith('generated'),
        })
        .on('all', async (event, filePath) => {
            const fullPath = path.resolve(SCREEPS_SRC_PATH, filePath);

            // 处理文件变化事件
            if (event == 'add' || event == 'change') {
                // 文件添加或修改时，重新分析文件
                await analyzeFile(fullPath);
            } else if (event == 'unlink') {
                // 文件删除时，清理数据库中的相关记录
                await clearItemOfFile(fullPath, true);
            } else {
                return;
            }

            // 如果是初始化文件，跳过生成过程
            if (files.has(fullPath)) {
                files.delete(filePath);
                return;
            }

            // 查询exportGlobal标签并生成全局声明文件
            await processExportGlobal();
        });

    // 启动Web服务器
    createWebServer();
};

main();
