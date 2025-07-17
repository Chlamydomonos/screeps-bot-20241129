/**
 * WASM模块初始化工具
 *
 * 该模块负责在Screeps环境中初始化WebAssembly模块，提供高性能的底层计算能力。
 * 由于Screeps的全局重置机制，需要在每次全局重置后重新加载WASM模块。
 */

import * as wasmModule from 'screeps-wasm';

/** WASM模块初始化输出类型 */
export type WASMInstance = wasmModule.InitOutput;

/** WASM模块的二进制文件名 */
const WASM_MODULE_NAME = 'screeps_wasm_bg';

/**
 * 初始化WASM模块
 *
 * 该函数会同步加载WASM模块，并在加载完成后清除require缓存，
 * 确保下次全局重置时能够重新加载。
 *
 * @throws {Error} 如果WASM模块加载失败
 */
export const initWasm = () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wasmBin = require(WASM_MODULE_NAME);
    const wasmBinModule = new WebAssembly.Module(wasmBin);
    wasmModule.initSync({ module: wasmBinModule });
    delete require.cache[WASM_MODULE_NAME];
};
