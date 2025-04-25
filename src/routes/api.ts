
import Router from '@koa/router';
import { Context } from 'koa';
import { OllamaService } from '../ollama';
import {
    OllamaGenerateRequest,
    OllamaChatRequest,
    OllamaChatResponse,
    OllamaEmbeddingRequest,
    OllamaCreateRequest,
    OllamaPullRequest,
    OllamaCopyRequest,
    OllamaDeleteRequest,
    OllamaShowRequest
} from '../types';

import { config } from '../config';
// 新增引入保存消息和会话的模块
import { saveMessage } from '../db';
import { Conversation } from '../sequelizeUtil';

const router = new Router({
    prefix: '/api'
});

const ollamaService = new OllamaService();

// 生成API
router.post('/generate', async (ctx: Context) => {
    const request = ctx.request.body as OllamaGenerateRequest;

    if (!request.model || !request.prompt) {
        ctx.status = 400;
        ctx.body = { error: '缺少必要参数：model 或 prompt' };
        return;
    }

    const isStreamRequest = request.stream === true;

    if (isStreamRequest) {
        // 流式响应
        const { stream } = await ollamaService.generate(request);

        if (!stream) {
            ctx.status = 500;
            ctx.body = { error: '创建流失败' };
            return;
        }

        ctx.set('Content-Type', 'text/event-stream');
        ctx.set('Cache-Control', 'no-cache');
        ctx.set('Connection', 'keep-alive');

        // 创建Node.js流并传输到Koa响应
        const reader = stream.getReader();
        const nodeStream = new (require('stream')).Readable({
            async read() {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null);
                    } else {
                        this.push(JSON.stringify(value) + '\n');
                    }
                } catch (error) {
                    this.destroy(error as Error);
                }
            }
        });

        ctx.body = nodeStream;
    } else {
        // 非流式响应
        const { response } = await ollamaService.generate(request);

        if (!response) {
            ctx.status = 500;
            ctx.body = { error: '请求处理失败' };
            return;
        }

        ctx.body = response;
    }
});

// 聊天API
router.post('/chat', async (ctx: Context) => {
    const request = ctx.request.body as OllamaChatRequest;

    if (!request.model || !request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
        ctx.status = 400;
        ctx.body = { error: '缺少必要参数：model 或 messages' };
        return;
    }

    const isStreamRequest = request.stream === true;

    if (isStreamRequest) {
        // 流式响应
        const { stream } = await ollamaService.chat(request);

        if (!stream) {
            ctx.status = 500;
            ctx.body = { error: '创建流失败' };
            return;
        }

        ctx.set('Content-Type', 'text/event-stream');
        ctx.set('Cache-Control', 'no-cache');
        ctx.set('Connection', 'keep-alive');

        // 拼接返回的消息
        let fullMessage = '';

        // 创建Node.js流并传输到Koa响应
        const reader = stream.getReader();
        const nodeStream = new (require('stream')).Readable({
            async read() {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null);
                        // 新增：获取userId（若未传，使用默认值1）以及conversationId
                        const userId = (request as any).userId || 1;
                        let conversationId = (request as any).conversationId;
                        if (!conversationId) {
                            const newConversation = await Conversation.create({ userId, created_at: new Date() });
                            conversationId = newConversation.id;
                        }

                        // 保存消息记录到数据库，增加userId、conversationId、flag字段
                        try {
                            await saveMessage({
                                model: request.model,
                                messages: request.messages,
                                response: fullMessage,
                                createdAt: new Date(), // 修改属性名以适配保存函数
                                userId,
                                conversationId,
                                flag: 'model'
                            });
                        } catch (e) {
                            console.error("保存消息记录出错：", e);
                        }
                    } else {
                        // 新增：保存流式响应的消息记录
                        fullMessage += value.message.content;
                        this.push(JSON.stringify(value) + '\n');

                    }
                } catch (error) {
                    this.destroy(error as Error);
                }
            }
        });

        ctx.body = nodeStream;
    } else {
        // 非流式响应
        const { response } = await ollamaService.chat(request);

        if (!response) {
            ctx.status = 500;
            ctx.body = { error: '请求处理失败' };
            return;
        }

        // 新增：获取userId（若未传，使用默认值1）以及conversationId
        const userId = (request as any).userId || 1;
        let conversationId = (request as any).conversationId;
        if (!conversationId) {
            const newConversation = await Conversation.create({ userId, created_at: new Date() });
            conversationId = newConversation.id;
        }

        // 保存消息记录到数据库，增加userId、conversationId、flag字段
        try {
            await saveMessage({
                model: request.model,
                messages: request.messages,
                response: response,
                createdAt: new Date(), // 修改属性名以适配保存函数
                userId,
                conversationId,
                flag: 'model'
            });
        } catch (e) {
            console.error("保存消息记录出错：", e);
        }

        ctx.body = response;
    }
});

// 嵌入API
router.post('/embeddings', async (ctx: Context) => {
    const request = ctx.request.body as OllamaEmbeddingRequest;

    if (!request.model || !request.prompt) {
        ctx.status = 400;
        ctx.body = { error: '缺少必要参数：model 或 prompt' };
        return;
    }

    const response = await ollamaService.embedding(request);

    if (!response) {
        ctx.status = 500;
        ctx.body = { error: '请求处理失败' };
        return;
    }

    ctx.body = response;
});

// 列出模型API
router.get('/tags', async (ctx: Context) => {
    const response = await ollamaService.listModels();

    if (!response) {
        ctx.status = 500;
        ctx.body = { error: '获取模型列表失败' };
        return;
    }

    ctx.body = response;
});

// 创建模型API
router.post('/create', async (ctx: Context) => {
    const request = ctx.request.body as OllamaCreateRequest;

    if (!request.name || !request.modelfile) {
        ctx.status = 400;
        ctx.body = { error: '缺少必要参数：name 或 modelfile' };
        return;
    }

    const isStreamRequest = request.stream === true;

    if (isStreamRequest) {
        // 流式响应
        const { stream } = await ollamaService.createModel(request);

        if (!stream) {
            ctx.status = 500;
            ctx.body = { error: '创建流失败' };
            return;
        }

        ctx.set('Content-Type', 'text/event-stream');
        ctx.set('Cache-Control', 'no-cache');
        ctx.set('Connection', 'keep-alive');

        // 创建Node.js流并传输到Koa响应
        const reader = stream.getReader();
        const nodeStream = new (require('stream')).Readable({
            async read() {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null);
                    } else {
                        this.push(JSON.stringify(value) + '\n');
                    }
                } catch (error) {
                    this.destroy(error as Error);
                }
            }
        });

        ctx.body = nodeStream;
    } else {
        // 非流式响应
        const { response } = await ollamaService.createModel(request);

        if (!response) {
            ctx.status = 500;
            ctx.body = { error: '请求处理失败' };
            return;
        }

        ctx.body = response;
    }
});

// 拉取模型API
router.post('/pull', async (ctx: Context) => {
    const request = ctx.request.body as OllamaPullRequest;

    if (!request.name) {
        ctx.status = 400;
        ctx.body = { error: '缺少必要参数：name' };
        return;
    }

    const isStreamRequest = request.stream === true;

    if (isStreamRequest) {
        // 流式响应
        const { stream } = await ollamaService.pullModel(request);

        if (!stream) {
            ctx.status = 500;
            ctx.body = { error: '创建流失败' };
            return;
        }

        ctx.set('Content-Type', 'text/event-stream');
        ctx.set('Cache-Control', 'no-cache');
        ctx.set('Connection', 'keep-alive');

        // 创建Node.js流并传输到Koa响应
        const reader = stream.getReader();
        const nodeStream = new (require('stream')).Readable({
            async read() {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null);
                    } else {
                        this.push(JSON.stringify(value) + '\n');
                    }
                } catch (error) {
                    this.destroy(error as Error);
                }
            }
        });

        ctx.body = nodeStream;
    } else {
        // 非流式响应
        const { response } = await ollamaService.pullModel(request);

        if (!response) {
            ctx.status = 500;
            ctx.body = { error: '请求处理失败' };
            return;
        }

        ctx.body = response;
    }
});

// 复制模型API
router.post('/copy', async (ctx: Context) => {
    const request = ctx.request.body as OllamaCopyRequest;

    if (!request.source || !request.destination) {
        ctx.status = 400;
        ctx.body = { error: '缺少必要参数：source 或 destination' };
        return;
    }

    const response = await ollamaService.copyModel(request);

    if (!response) {
        ctx.status = 500;
        ctx.body = { error: '复制模型失败' };
        return;
    }

    ctx.body = response;
});

// 删除模型API
router.delete('/delete', async (ctx: Context) => {
    const request = ctx.request.body as OllamaDeleteRequest;

    if (!request.name) {
        ctx.status = 400;
        ctx.body = { error: '缺少必要参数：name' };
        return;
    }

    const response = await ollamaService.deleteModel(request);

    if (!response) {
        ctx.status = 500;
        ctx.body = { error: '删除模型失败' };
        return;
    }

    ctx.body = response;
});

// 显示模型信息API
router.post('/show', async (ctx: Context) => {
    const request = ctx.request.body as OllamaShowRequest;

    if (!request.name) {
        ctx.status = 400;
        ctx.body = { error: '缺少必要参数：name' };
        return;
    }

    const response = await ollamaService.showModel(request);

    if (!response) {
        ctx.status = 500;
        ctx.body = { error: '获取模型信息失败' };
        return;
    }

    ctx.body = response;
});

// 队列状态API
router.get('/queue-status', (ctx: Context) => {
    ctx.body = {
        queueLength: ollamaService.queue.getQueueLength(),
        processing: ollamaService.queue.getProcessingCount(),
        concurrency: config.queue.concurrency
    };
});

export default router;

