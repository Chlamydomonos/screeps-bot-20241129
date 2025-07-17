/**
 * 初始化指定房间的游戏状态
 *
 * 在游戏开始并放置第一个Spawn后，需要在控制台中调用此函数，来初始化房间。
 *
 * @param roomName 要初始化的房间名称
 * @returns void
 *
 * @example
 * ```typescript
 * // 在控制台中调用
 * initGame('E1S1');
 * ```
 */
export const initGame = (roomName: string) => {
    // TODO: 在这里添加游戏初始化逻辑
    console.log(`正在初始化房间: ${roomName}`);
};
