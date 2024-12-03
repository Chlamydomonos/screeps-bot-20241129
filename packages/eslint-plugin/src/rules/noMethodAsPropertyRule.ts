import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

export default ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
        return {
            PropertyDefinition(node) {
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
