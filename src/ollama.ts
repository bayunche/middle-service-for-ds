// src/ollama.ts
import axios from 'axios';
import { config } from './config';
import {
    OllamaGenerateRequest,
    OllamaResponse,
    QueueTask,
    OllamaChatRequest,
    OllamaChatResponse,
    OllamaEmbeddingRequest,
    OllamaEmbeddingResponse,
    OllamaCreateRequest,
    OllamaListModelsResponse,
    OllamaCreateResponse,
    OllamaPullResponse,
    OllamaPullRequest,
    OllamaCopyRequest,
    OllamaDeleteRequest,
    OllamaShowRequest,
    OllamaShowResponse
} from './types';
import { RequestQueue } from './queue';


export class OllamaService {
    private client = axios.create({
        baseURL: config.ollama.baseUrl,
        timeout: config.ollama.timeout,
    });

    public queue: RequestQueue;

    constructor() {
        this.queue = new RequestQueue(config.queue.concurrency);

        // 重写队列的processTask方法
        this.queue.processTask = this.processTask.bind(this);
    }

    private async processTask(task: QueueTask): Promise<void> {
        const { request } = task;

        if (request.stream) {
            // 流式处理
            try {
                const response = await this.client.post('/api/generate', request, {
                    responseType: 'stream',
                });

                const stream = response.data;

                stream.on('data', (chunk: Buffer) => {
                    const text = chunk.toString();
                    try {
                        // Ollama返回的是每行一个JSON
                        const lines = text.split('\n').filter(line => line.trim());

                        for (const line of lines) {
                            const data = JSON.parse(line);
                            if (task.streamController) {
                                task.streamController.enqueue(data);

                                if (data.done) {
                                    task.streamController.close();
                                }
                            }
                        }
                    } catch (e) {
                        console.error('解析流数据失败:', e);
                    }
                });

                stream.on('end', () => {
                    if (task.streamController) {
                        task.streamController.close();
                    }
                    task.resolve({ success: true });
                });

                stream.on('error', (err: Error) => {
                    console.error('流错误:', err);
                    if (task.streamController) {
                        task.streamController.error(err);
                    }
                    task.reject(err);
                });
            } catch (error) {
                console.error('创建流请求失败:', error);
                task.reject(error);
            }
        } else {
            // 非流式处理
            try {
                const response = await this.client.post('/api/generate', request);
                task.resolve(response.data);
            } catch (error) {
                console.error('非流式请求失败:', error);
                task.reject(error);
            }
        }
    }

    async generate(request: OllamaGenerateRequest): Promise<{ response: OllamaResponse | null; stream?: ReadableStream }> {
        const { id, promise, stream } = this.queue.addTask("generate", request);

        try {
            const result = await promise;
            return { response: result, stream };
        } catch (error) {
            console.error(`任务 ${id} 失败:`, error);
            return { response: null, stream };
        }
    }
    // 添加公开的chat方法
    async chat(request: OllamaChatRequest): Promise<{ response: OllamaChatResponse | null; stream?: ReadableStream }> {
        const { id, promise, stream } = this.queue.addTask('chat', request);

        try {
            const result = await promise;
            return { response: result, stream };
        } catch (error) {
            console.error(`聊天任务 ${id} 失败:`, error);
            return { response: null, stream };
        }
    }
    async embedding(request: OllamaEmbeddingRequest): Promise<OllamaEmbeddingResponse | null> {
        const { promise } = this.queue.addTask('embedding', request);

        try {
            return await promise;
        } catch (error) {
            console.error('嵌入请求失败:', error);
            console.error('显示模型信息失败:', error);
            throw error; // Throw the error to propagate it
        }
    }
    async listModels(): Promise<OllamaListModelsResponse | null> {
        const { promise } = this.queue.addTask('list', {});

        try {
            return await promise;
        } catch (error) {
            console.error('获取模型列表失败:', error);
            return null;
        }
    }

    async createModel(request: OllamaCreateRequest): Promise<{ response: OllamaCreateResponse | null; stream?: ReadableStream }> {
        const { promise, stream } = this.queue.addTask('create', request);

        try {
            const result = await promise;
            return { response: result, stream };
        } catch (error) {
            console.error('创建模型失败:', error);
            return { response: null, stream };
        }
    }

    async pullModel(request: OllamaPullRequest): Promise<{ response: OllamaPullResponse | null; stream?: ReadableStream }> {
        const { promise, stream } = this.queue.addTask('pull', request);

        try {
            const result = await promise;
            return { response: result, stream };
        } catch (error) {
            console.error('拉取模型失败:', error);
            return { response: null, stream };
        }
    }

    async copyModel(request: OllamaCopyRequest): Promise<any> {
        const { promise } = this.queue.addTask('copy', request);

        try {
            return await promise;
        } catch (error) {
            console.error('复制模型失败:', error);
            return null;
        }
    }

    async deleteModel(request: OllamaDeleteRequest): Promise<any> {
        const { promise } = this.queue.addTask('delete', request);

        try {
            return await promise;
        } catch (error) {
            console.error('删除模型失败:', error);
            return null;
        }
    }

    async showModel(request: OllamaShowRequest): Promise<OllamaShowResponse | null> {
        const { promise } = this.queue.addTask('show', request);

        try {
            return await promise;
        } catch (error) {
            console.error('显示模型信息失败:', error);
            return null;
        }
    }
}