/**
 * @fileoverview 禁止使用匿名类表达式的 ESLint 规则
 * @description 检查代码中是否使用了匿名类表达式，如果有则报错
 * @author Chlamydomonos
 */

import { ESLintUtils } from '@typescript-eslint/utils';

/**
 * 禁止使用匿名类表达式的规则
 * @description 在代码中发现匿名类表达式时报错，因为这种语法不利于代码维护
 */
export default ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
        return {
            /**
             * 检查类表达式
             * @param node 类表达式节点
             */
            ClassExpression(node) {
                context.report({ node, messageId: 'classExpression' });
            },
        };
    },
    meta: {
        docs: {
            description: '不允许使用匿名类',
        },
        messages: {
            classExpression: '不允许使用匿名类（为什么要使用这种匪夷所思的东西？）',
        },
        type: 'problem',
        schema: [],
    },
    defaultOptions: [],
});
