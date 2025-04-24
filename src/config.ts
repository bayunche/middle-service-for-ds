export const config = {
    port: process.env.PORT || 3000,
    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        timeout: parseInt(process.env.OLLAMA_TIMEOUT || '60000'),
    },
    queue: {
        concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '2'),
    }
};