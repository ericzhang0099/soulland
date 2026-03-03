import { BaseAdapter } from './base';
import { ProviderConfig, ChatCompletionRequest, ChatCompletionResponse, StreamChunk } from '../types';
/**
 * 国产大模型适配器 - 通义千问/GLM/DeepSeek
 */
export declare class DomesticAdapter extends BaseAdapter {
    private vendor;
    constructor(config: ProviderConfig, vendor?: string);
    protected getHeaders(): Record<string, string>;
    protected convertRequest(request: ChatCompletionRequest): any;
    protected convertResponse(response: any, requestId: string): ChatCompletionResponse;
    protected convertStreamChunk(chunk: any): StreamChunk | null;
    protected getModelPricing(model: string): {
        input: number;
        output: number;
    };
}
//# sourceMappingURL=domestic.d.ts.map