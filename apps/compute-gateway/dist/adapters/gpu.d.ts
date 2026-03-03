import { BaseAdapter } from './base';
import { ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, StreamChunk } from '../types';
/**
 * GPU推理服务适配器 (vLLM/TGI)
 */
export declare class GPUAdapter extends BaseAdapter {
    constructor(config: ProviderConfig);
    protected getHeaders(): Record<string, string>;
    protected convertRequest(request: ChatCompletionRequest): any;
    protected convertResponse(response: any, requestId: string): ChatCompletionResponse;
    protected convertStreamChunk(chunk: any): StreamChunk | null;
    protected getModelPricing(model: string): {
        input: number;
        output: number;
    };
    /**
     * 获取GPU状态
     */
    getGPUStatus(): Promise<any>;
}
//# sourceMappingURL=gpu.d.ts.map