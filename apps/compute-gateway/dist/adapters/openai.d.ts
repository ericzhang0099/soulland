import { BaseAdapter } from './base';
import { ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, StreamChunk } from '../types';
/**
 * OpenAI 适配器
 */
export declare class OpenAIAdapter extends BaseAdapter {
    constructor(config: ProviderConfig);
    protected getHeaders(): Record<string, string>;
    protected convertRequest(request: ChatCompletionRequest): any;
    protected convertResponse(response: any, requestId: string): ChatCompletionResponse;
    protected convertStreamChunk(chunk: any): StreamChunk | null;
    protected getModelPricing(model: string): {
        input: number;
        output: number;
    };
}
//# sourceMappingURL=openai.d.ts.map