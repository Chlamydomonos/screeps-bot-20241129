import type { TreeNode } from './TreeNode';

/**
 * 使用该函数来创建一个全局单例。需要添加注释"#exportGlobal"。
 *
 * 用法示例：
 * ```ts
 * // #exportGlobal
 * const singleInstance = exportGlobal('singleInstance', SomeClass, arg1, arg2);
 * ```
 *
 * @param name 单例的名称，将成为一个全局变量。注意，只能用字符串字面量，而不能使用常量、变量、字符串模板等。
 * @param nodeClass 单例的类
 * @param args 创建该实例所需的构造函数参数
 * @returns 创建的单例
 */
export const exportGlobal = <T extends TreeNode, A extends any[]>(
    name: string,
    nodeClass: { new (...args: A): T },
    ...args: A
) => {
    const manualReset = function (this: TreeNode) {
        const instance = new nodeClass(...args);
        (global as any)[name] = instance;
        (instance as any).manualReset = manualReset;
    };
    const instance = new nodeClass(...args);
    (global as any)[name] = instance;
    (instance as any).__manualReset = manualReset;
    return instance as T & { manualReset(): void };
};
