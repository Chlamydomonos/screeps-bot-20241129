import { ESLintUtils } from '@typescript-eslint/utils';

export default ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
        return {
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
