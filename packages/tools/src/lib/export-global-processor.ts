/**
 * exportGlobal处理器
 *
 * 负责解析带有exportGlobal标签的全局语句，并生成相应的代码文件
 */

import { GlobalStatement } from './db/models/global-statement';
import { generateFiles } from './generate-global';

/**
 * 解析exportGlobal语句的返回类型
 */
export interface ExportGlobalItem {
    key: string; // 全局变量名
    value: string; // 导出的类名
    file: string; // 文件路径
}

/**
 * 查询所有带有exportGlobal标签的全局语句并解析
 * @returns 解析后的exportGlobal项目列表
 */
export async function getExportGlobalItems(): Promise<ExportGlobalItem[]> {
    // 查询所有带有exportGlobal标签的全局语句
    const globalStatements = await GlobalStatement.findAll({
        include: [
            {
                association: 'tags',
                required: true,
                where: {
                    name: 'exportGlobal',
                },
                include: [
                    {
                        association: 'data',
                    },
                ],
            },
        ],
    });

    const globalCache = globalStatements
        .map((value) => {
            const { text, file } = value;
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
        .filter((value) => !!value) as ExportGlobalItem[];

    return globalCache;
}

/**
 * 处理exportGlobal并生成代码文件
 *
 * 此函数会查询所有带有exportGlobal标签的全局语句，
 * 解析它们并生成相应的全局声明文件
 */
export async function processExportGlobal(): Promise<void> {
    const globalCache = await getExportGlobalItems();

    // 根据解析结果生成全局声明文件
    generateFiles(globalCache);
}
