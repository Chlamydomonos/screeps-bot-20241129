/**
 * 注释解析模块
 *
 * 这个模块负责解析TypeScript代码中的注释，提取自定义标签信息。
 * 主要用于分析代码中的特殊注释标记，这些标记用于代码生成和验证。
 *
 * 功能：
 * - 解析代码节点前的注释内容
 * - 提取以#开头的自定义标签
 * - 解析标签的参数数据
 *
 * 支持的注释格式：
 * - // #tagName param1 param2 "param with spaces"
 * - * #tagName param1 param2 "param with spaces"
 *
 * 标签格式：
 * - #tagName: 简单标签，无参数
 * - #tagName param1 param2: 带参数的标签
 * - #tagName "param with spaces": 带引号的参数支持空格
 */

import * as ts from 'typescript';

/**
 * 标签信息接口
 */
interface Tag {
    name: string; // 标签名称
    data: string[]; // 标签参数数组
}

/**
 * 解析代码节点前的注释，提取自定义标签信息
 *
 * @param fullText 完整的源代码文本
 * @param node TypeScript AST节点
 * @returns 提取的标签信息数组
 */
export const parseComment = (fullText: string, node: ts.Node) => {
    // 获取节点前的注释文本
    const comment = fullText.substring(node.getFullStart(), node.getStart());
    const lines = comment.split('\n');
    const tags: Tag[] = [];

    for (const line of lines) {
        // 使用正则表达式匹配标签格式
        // 支持 // 和 * 两种注释前缀
        const match = /^\s*(?:\/\/|\*)?\s*#(\w+)(\s+.+?)?\s*$/g.exec(line);
        if (match) {
            const name = match[1];
            // 解析参数，支持引号包围的参数
            const data = match[2]?.match(/("([^"]*)")|(\S+)/g) ?? [];
            tags.push({ name, data });
        }
    }

    return tags;
};
