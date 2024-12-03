import noClassExpressionRule from './rules/noClassExpressionRule';
import noMethodAsPropertyRule from './rules/noMethodAsPropertyRule';
import callSuperRule from './rules/callSuperRule';

export const plugin = {
    meta: {
        name: '@screeps-bot-20241129/eslint-plugin',
    },
    rules: {
        'no-class-expression': noClassExpressionRule,
        'no-method-as-property': noMethodAsPropertyRule,
        'call-super': callSuperRule,
    },
};
