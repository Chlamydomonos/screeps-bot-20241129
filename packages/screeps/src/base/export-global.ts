/**
 * 全局单例导出工具
 *
 * 该模块提供了一个用于创建全局单例的工具函数。在Screeps环境中，
 * 由于全局重置的存在，需要特殊处理单例的创建和重置。
 */

/**
 * 使用该函数来创建一个全局单例。需要添加注释"#exportGlobal"。
 *
 * 该函数会创建一个单例实例，并将其注册到全局作用域中。同时会为实例
 * 添加一个__manualReset方法，用于在全局重置时重新创建实例。
 *
 * @example
 * ```ts
 * export class SomeClass {
 *     constructor(private param1: string, private param2: number) {}
 *
 *     someMethod() {
 *         console.log('执行方法');
 *     }
 * }
 *
 * // #exportGlobal
 * const singleInstance = exportGlobal('singleInstance', SomeClass, 'arg1', 42);
 * ```
 *
 * @param name 单例的名称，将成为一个全局变量。注意，只能用字符串字面量，而不能使用常量、变量、字符串模板等。
 * @param instanceClass 单例的类，必须用export关键字导出，且不能export default，以使代码生成可以正常工作。
 * @param args 创建该实例所需的构造函数参数
 * @returns 创建的单例，包含manualReset方法
 */
export const exportGlobal = <T, A extends any[]>(name: string, instanceClass: { new (...args: A): T }, ...args: A) => {
    /**
     * 手动重置函数
     * 在全局重置时会被调用，用于重新创建实例
     */
    const manualReset = function (this: T) {
        const instance = new instanceClass(...args);
        (global as any)[name] = instance;
        (instance as any).__manualReset = manualReset;
    };

    // 创建实例并注册到全局
    const instance = new instanceClass(...args);
    (global as any)[name] = instance;
    (instance as any).__manualReset = manualReset;

    return instance as T & { manualReset(): void };
};
