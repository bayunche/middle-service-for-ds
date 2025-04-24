import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { config } from './config';
import apiRouter from './routes/api';

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = new Koa();

// 中间件
app.use(cors());
app.use(bodyParser());

// 错误处理
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err: any) {
        console.error('服务器错误:', err);
        ctx.status = err.status || 500;
        ctx.body = {
            error: err.message || '服务器内部错误'
        };
    }
});

// 路由
app.use(apiRouter.routes()).use(apiRouter.allowedMethods());

// 启动服务器
app.listen(config.port, () => {
    console.log(`服务已启动，端口: ${config.port}`);
    console.log(`Ollama API: ${config.ollama.baseUrl}`);
    console.log(`队列并发数: ${config.queue.concurrency}`);
});