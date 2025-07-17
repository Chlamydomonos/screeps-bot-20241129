/**
 * @fileoverview 检查重载方法是否正确调用父类方法的 ESLint 规则
 * @description 确保继承类中的重载方法正确调用了父类的同名方法
 * @author Chlamydomonos
 */

import path from 'path';
import { createSyncFn } from 'synckit';
import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { getDBPath, type FullClass } from 'tools';

const SCREEPS_SRC_PATH = path.resolve(
    __dirname /* rules */,
    '..' /* dist */,
    '..' /* eslint-plugin */,
    '..' /* packages */,
    'screeps',
    'src'
);

/**
 * 检查重载方法是否正确调用父类方法的规则
 * @description 通过代码分析服务器获取类信息，检查重载方法是否调用了 super 方法
 */
export default ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
        // 如果文件不在SCREEPS_SRC_PATH下，跳过这项检查
        const currentFilePath = path.resolve(context.physicalFilename);
        if (!currentFilePath.startsWith(SCREEPS_SRC_PATH)) {
            return {};
        }

        // 获取文件路径并从代码分析服务器获取类缓存
        const fileName = getDBPath(context.physicalFilename);
        const cache = createSyncFn(require.resolve('../workers/getClassCache'))(fileName) as
            | Record<string, FullClass & { parentChain: FullClass[] }>
            | string;

        // 记录哪些方法调用了 super 方法
        const superCache: Record<string, boolean> = {};

        return {
            /**
             * 检查成员表达式，寻找 super 方法调用
             * @param node 成员表达式节点
             */
            MemberExpression(node) {
                // 只处理 super 对象的成员访问
                if (node.object.type != AST_NODE_TYPES.Super) {
                    return;
                }

                let methodName: string | undefined;
                let methodNode: TSESTree.MethodDefinition | undefined;
                let className: string | undefined;
                let classNode: TSESTree.ClassDeclaration | undefined;
                let parent: TSESTree.Node | undefined = node.parent;

                // 向上遍历 AST 找到方法和类信息
                while (parent) {
                    if (
                        parent.type == AST_NODE_TYPES.MethodDefinition &&
                        parent.key.type == AST_NODE_TYPES.Identifier
                    ) {
                        methodName = parent.key.name;
                        methodNode = parent;
                    }
                    if (parent.type == AST_NODE_TYPES.ClassDeclaration) {
                        className = parent.id?.name;
                        // 处理默认导出的类
                        if (parent.parent.type == AST_NODE_TYPES.ExportDefaultDeclaration) {
                            className = '#default';
                        }
                        classNode = parent;
                        break;
                    }
                    parent = parent.parent;
                }

                if (!methodName || !methodNode || !className || !classNode) {
                    return;
                }

                // 检查是否调用了同名的父类方法
                if (node.property.type != AST_NODE_TYPES.Identifier || node.property.name != methodName) {
                    return;
                }

                // 记录该方法调用了 super 方法
                superCache[`${className}#${methodName}`] = true;
            },
            /**
             * 检查方法定义结束时是否调用了 super 方法
             * @param node 方法定义节点
             */
            'MethodDefinition:exit'(node) {
                if (node.key.type != AST_NODE_TYPES.Identifier) {
                    return;
                }
                const methodName = node.key.name;

                let className: string | undefined;
                let classNode: TSESTree.ClassDeclaration | undefined;
                let parent: TSESTree.Node | undefined = node.parent;

                // 向上遍历找到类信息
                while (parent) {
                    if (parent.type == AST_NODE_TYPES.ClassDeclaration) {
                        className = parent.id?.name;
                        // 处理默认导出的类
                        if (parent.parent.type == AST_NODE_TYPES.ExportDefaultDeclaration) {
                            className = '#default';
                        }
                        classNode = parent;
                        break;
                    }
                    parent = parent.parent;
                }

                if (!className || !classNode) {
                    return;
                }

                // 如果已经调用了 super 方法，则通过检查
                if (superCache[`${className}#${methodName}`]) {
                    return;
                }

                // 检查代码分析服务器是否可用
                if (typeof cache == 'string') {
                    context.report({ node: classNode, messageId: 'serverClosed' });
                    return;
                }

                // 检查类是否在缓存中
                const classInCache = cache[className];
                if (!classInCache) {
                    context.report({ node: classNode, messageId: 'classNotInCache' });
                    return;
                }

                let lastSuper: FullClass['methods'][string] | undefined;

                // 在父类链中查找同名方法
                for (const parent of classInCache.parentChain) {
                    const parentMethod = parent.methods[methodName];
                    if (parentMethod) {
                        lastSuper = parentMethod;
                        break;
                    }
                }

                // 如果父类中没有同名方法，则不需要调用 super
                if (!lastSuper) {
                    return;
                }

                // 检查父类方法是否有 @emptySuper 标记
                for (const tag of lastSuper.tags) {
                    if (tag.name == 'emptySuper') {
                        return;
                    }
                }

                // 报告错误：重载方法必须调用 super 方法
                context.report({ node, messageId: 'callSuper' });
            },
        };
    },
    meta: {
        docs: {
            description: '重载方法必须调用super方法',
        },
        messages: {
            callSuper: '重载方法必须调用super方法',
            classNotInCache: '类不在缓存中，尝试构建项目或重新加载窗口',
            methodNotInCache: '方法不在缓存中，尝试构建项目或重新加载窗口',
            serverClosed: '代码分析服务器未启动，尝试重新加载窗口',
        },
        type: 'problem',
        schema: [],
    },
    defaultOptions: [],
});
