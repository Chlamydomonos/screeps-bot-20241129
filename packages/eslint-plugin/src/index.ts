/**
 * @fileoverview ESLint 插件入口文件
 * @description 提供自定义的 ESLint 规则，用于 Screeps 项目的代码质量检查
 * @author Chlamydomonos
 */

import noClassExpressionRule from './rules/noClassExpressionRule';
import noMethodAsPropertyRule from './rules/noMethodAsPropertyRule';
import callSuperRule from './rules/callSuperRule';

/**
 * ESLint 插件配置
 * @description 导出插件的元数据和所有自定义规则
 */
export const plugin = {
    meta: {
        name: '@screeps-bot-20241129/eslint-plugin',
    },
    rules: {
        // 禁止使用匿名类表达式
        'no-class-expression': noClassExpressionRule,
        // 禁止将方法定义为属性
        'no-method-as-property': noMethodAsPropertyRule,
        // 检查重载方法是否正确调用了父类方法
        'call-super': callSuperRule,
    },
};
