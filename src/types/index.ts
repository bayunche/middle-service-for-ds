export interface OllamaModelInfo {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

export interface OllamaListModelsResponse {
    models: OllamaModelInfo[];
}

export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    system?: string;
    template?: string;
    context?: number[];
    stream?: boolean;
    raw?: boolean;
    format?: string;
    options?: {
        seed?: number;
        num_predict?: number;
        top_k?: number;
        top_p?: number;
        tfs_z?: number;
        typical_p?: number;
        repeat_last_n?: number;
        temperature?: number;
        repeat_penalty?: number;
        presence_penalty?: number;
        frequency_penalty?: number;
        mirostat?: number;
        mirostat_tau?: number;
        mirostat_eta?: number;
        penalize_newline?: boolean;
        stop?: string[];
        numa?: boolean;
        num_ctx?: number;
        num_batch?: number;
        num_gpu?: number;
        num_thread?: number;
        num_keep?: number;
        main_gpu?: number;
        low_vram?: boolean;
        f16_kv?: boolean;
        logits_all?: boolean;
        vocab_only?: boolean;
        use_mmap?: boolean;
        use_mlock?: boolean;
        embedding_only?: boolean;
        rope_frequency_base?: number;
        rope_frequency_scale?: number;
        num_gqa?: number;
    };
}

export interface OllamaEmbeddingRequest {
    model: string;
    prompt: string;
    options?: Record<string, any>;
}

export interface OllamaEmbeddingResponse {
    embedding: number[];
}

export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaChatRequest {
    model: string;
    messages: {
        role: "system" | "user" | "assistant";
        content: string;
        images?: string[];
    }[];
    stream?: boolean;
    format?: string;
    options?: OllamaGenerateRequest["options"];
}

export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaCreateRequest {
    name: string;
    modelfile: string;
    stream?: boolean;
    path?: string;
}

export interface OllamaCreateResponse {
    status: string;
    digest?: string;
    error?: string;
}

export interface OllamaPullRequest {
    name: string;
    insecure?: boolean;
    stream?: boolean;
}

export interface OllamaPullResponse {
    status: string;
    digest?: string;
    total?: number;
    completed?: number;
    error?: string;
}

export interface OllamaCopyRequest {
    source: string;
    destination: string;
}

export interface OllamaDeleteRequest {
    name: string;
}

export interface OllamaShowRequest {
    name: string;
}

export interface OllamaShowResponse {
    modelfile: string;
    parameters: string;
    template: string;
    system: string;
    license: string;
}

export interface QueueTask {
    id: string;
    type: 'generate' | 'chat' | 'embedding' | 'list' | 'create' | 'pull' | 'copy' | 'delete' | 'show';
    request: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    streamController?: ReadableStreamController<any>;
}
