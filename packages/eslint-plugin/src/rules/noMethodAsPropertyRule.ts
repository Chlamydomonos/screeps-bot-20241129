/**
 * @fileoverview 禁止将方法定义为属性的 ESLint 规则
 * @description 检查类中是否有将函数作为属性定义的情况，要求使用方法语法
 * @author Chlamydomonos
 */

import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

/**
 * 禁止将方法定义为属性的规则
 * @description 检查类属性是否为箭头函数或普通函数，如果是则报错
 */
export default ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
        return {
            /**
             * 检查属性定义
             * @param node 属性定义节点
             */
            PropertyDefinition(node) {
                // 检查属性值是否为箭头函数或普通函数
                if (
                    node.value?.type == AST_NODE_TYPES.ArrowFunctionExpression ||
                    node.value?.type == AST_NODE_TYPES.FunctionExpression
                ) {
                    context.report({ node, messageId: 'methodAsProperty' });
                }
            },
        };
    },
    meta: {
        docs: {
            description: '不允许使用函数作为属性',
        },
        messages: {
            methodAsProperty: '不允许使用函数作为属性（直接使用方法）',
        },
        type: 'problem',
        schema: [],
    },
    defaultOptions: [],
});
