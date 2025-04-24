import { QueueTask } from './types';
import { v4 as uuidv4 } from 'uuid';

export class RequestQueue {
    private queue: QueueTask[] = [];
    private processing: Set<string> = new Set();
    private concurrency: number;

    constructor(concurrency: number = 2) {
        this.concurrency = concurrency;
    }

    addTask(type: QueueTask['type'], request: any): { id: string; promise: Promise<any>; stream?: ReadableStream } {
        const id = uuidv4();

        let taskResolve: (value: any) => void;
        let taskReject: (reason: any) => void;

        const promise = new Promise((resolve, reject) => {
            taskResolve = resolve;
            taskReject = reject;
        });

        const task: QueueTask = {
            id,
            type,
            request,
            resolve: taskResolve!,
            reject: taskReject!,
        };

        // 如果是流式请求，创建一个ReadableStream
        let stream: ReadableStream | undefined;

        if (request.stream) {
            stream = new ReadableStream({
                start(controller) {
                    task.streamController = controller;
                }
            });
        }

        this.queue.push(task);
        this.processQueue();

        return { id, promise, stream };
    }

    private async processQueue() {
        if (this.queue.length === 0) return;

        if (this.processing.size >= this.concurrency) return;

        const task = this.queue.shift();
        if (!task) return;

        this.processing.add(task.id);

        try {
            // 此处会在ollama模块中实际处理请求
            // processTask会在ollama模块中定义
            await this.processTask(task);
        } catch (error) {
            task.reject(error);
        } finally {
            this.processing.delete(task.id);
            this.processQueue();
        }
    }

    // 这个方法会在ollama模块中实现
    async processTask(task: QueueTask): Promise<void> {
        // 在这里实现实际任务处理逻辑
        // 这是一个占位，实际实现会在ollama.ts中
        return Promise.resolve();
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    getProcessingCount(): number {
        return this.processing.size;
    }
}