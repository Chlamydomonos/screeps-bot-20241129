import { createSyncFn } from 'synckit';
import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { getDBPath, type FullClass } from '@screeps-bot-20241129/tools';

export default ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
        const fileName = getDBPath(context.physicalFilename);
        const cache = createSyncFn(require.resolve('../workers/getClassCache'))(fileName) as
            | Record<string, FullClass & { parentChain: FullClass[] }>
            | string;

        const superCache: Record<string, boolean> = {};

        return {
            MemberExpression(node) {
                if (node.object.type != AST_NODE_TYPES.Super) {
                    return;
                }

                let methodName: string | undefined;
                let methodNode: TSESTree.MethodDefinition | undefined;
                let className: string | undefined;
                let classNode: TSESTree.ClassDeclaration | undefined;
                let parent: TSESTree.Node | undefined = node.parent;
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

                if (node.property.type != AST_NODE_TYPES.Identifier || node.property.name != methodName) {
                    return;
                }

                superCache[`${className}#${methodName}`] = true;
            },
            'MethodDefinition:exit'(node) {
                if (node.key.type != AST_NODE_TYPES.Identifier) {
                    return;
                }
                const methodName = node.key.name;

                let className: string | undefined;
                let classNode: TSESTree.ClassDeclaration | undefined;
                let parent: TSESTree.Node | undefined = node.parent;
                while (parent) {
                    if (parent.type == AST_NODE_TYPES.ClassDeclaration) {
                        className = parent.id?.name;
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

                if (superCache[`${className}#${methodName}`]) {
                    return;
                }

                if (typeof cache == 'string') {
                    context.report({ node: classNode, messageId: 'serverClosed' });
                    return;
                }

                const classInCache = cache[className];
                if (!classInCache) {
                    context.report({ node: classNode, messageId: 'classNotInCache' });
                    return;
                }

                let lastSuper: FullClass['methods'][string] | undefined;

                for (const parent of classInCache.parentChain) {
                    const parentMethod = parent.methods[methodName];
                    if (parentMethod) {
                        lastSuper = parentMethod;
                        break;
                    }
                }

                if (!lastSuper) {
                    return;
                }

                for (const tag of lastSuper.tags) {
                    if (tag.name == 'emptySuper') {
                        return;
                    }
                }

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
