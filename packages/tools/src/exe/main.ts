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
 */

import { sql } from '@sequelize/core';
import chokidar from 'chokidar';
import express from 'express';
import path from 'path';
import { analyzeFile } from '../lib/analyzeFile';
import { clearItemOfFile } from '../lib/clearItemOfFile';
import { createDB } from '../lib/db/db';
import { findAllFiles } from '../lib/findAllFiles';
import { generateFiles } from '../lib/generateGlobal';
import { SCREEPS_SRC_PATH } from '../lib/paths';
import { getClassCache } from '../lib/getClassCache';

// chokidar文件监听事件类型定义
type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir' | 'ready' | 'raw' | 'error';

/**
 * 主函数 - 启动代码分析服务器
 *
 * 执行流程：
 * 1. 初始化数据库并同步表结构
 * 2. 设置文件监听器，监听源码目录变化
 * 3. 处理文件变化事件（添加、修改、删除）
 * 4. 查询exportGlobal标签并生成全局声明文件
 * 5. 启动HTTP服务器提供API接口
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
        .on('all', async (event: ChokidarEvent, filePath: string) => {
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

            // 查询所有带有exportGlobal标签的全局语句
            const globalCache = (
                await db.query(sql`
                    select \`GlobalStatements\`.*
                    from \`GlobalStatements\` join \`GlobalStatementTags\`
                    on \`GlobalStatements\`.\`id\` = \`GlobalStatementTags\`.\`globalStatementId\`
                    where \`GlobalStatementTags\`.\`name\` = "exportGlobal"
            `)
            )[0]
                .map((value) => {
                    const { text, file } = value as { text: string; file: string };
                    // 解析exportGlobal语句，提取全局变量名和对应的类名
                    const match = /exportGlobal\s*\(\s*['"](.+)['"]\s*,\s*(\w+).*\)/.exec(text);
                    if (!match) {
                        return undefined;
                    }

                    return {
                        key: match[1], // 全局变量名
                        value: match[2], // 导出的类名
                        file: `@/${file.replace(/\\/g, '/')}`, // 文件路径（转换为正斜杠）
                    };
                })
                .filter((value) => !!value);

            // 根据解析结果生成全局声明文件
            generateFiles(globalCache);
        });

    // 启动HTTP服务器
    const app = express();
    app.use(express.json());

    // 提供类缓存查询接口，供ESLint插件使用
    app.post('/cache', async (req, res) => {
        const { file } = req.body;
        res.send(await getClassCache(file));
    });

    // 在25487端口启动服务器
    app.listen(25487, () => {
        console.log('app listening on 25487');
    });
};

main();
