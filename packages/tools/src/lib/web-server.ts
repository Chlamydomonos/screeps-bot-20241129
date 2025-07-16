/**
 * Web服务器模块
 *
 * 负责创建和启动HTTP服务器，提供API接口供ESLint插件使用
 */

import express from 'express';
import { getClassCache } from './get-class-cache';

/**
 * 创建并启动Web服务器
 *
 * 提供以下API接口：
 * - POST /cache - 查询类缓存信息
 *
 * @param port 服务器端口，默认25487
 */
export function createWebServer(port: number = 25487): void {
    // 启动HTTP服务器
    const app = express();
    app.use(express.json());

    // 提供类缓存查询接口，供ESLint插件使用
    app.post('/cache', async (req, res) => {
        const { file } = req.body;
        res.send(await getClassCache(file));
    });

    // 启动服务器
    app.listen(port, () => {
        console.log(`app listening on ${port}`);
    });
}
