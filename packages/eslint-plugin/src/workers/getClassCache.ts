/**
 * @fileoverview 获取类缓存的工作线程
 * @description 用于与代码分析服务器通信，获取类的缓存信息
 * @author Chlamydomonos
 */

import axios from 'axios';
import { runAsWorker } from 'synckit';

/**
 * 工作线程主函数
 * @description 向代码分析服务器发送请求获取指定文件的类缓存信息
 * @param file 要获取缓存信息的文件路径
 * @returns 类缓存信息或错误状态
 */
runAsWorker(async (file: string) => {
    try {
        // 向代码分析服务器发送 POST 请求获取类缓存
        return (await axios.post('http://127.0.0.1:25487/cache', { file })).data;
    } catch (e) {
        // 如果服务器未启动或连接失败，返回错误状态
        return 'serverNotOpen';
    }
});
