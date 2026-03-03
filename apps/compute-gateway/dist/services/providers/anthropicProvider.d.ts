import { ProviderConfig } from '../../config';
import { Provider } from '../providerRouter';
export declare class AnthropicProvider implements Provider {
    name: string;
    type: string;
    enabled: boolean;
    priority: number;
    private client;
    constructor(config: ProviderConfig);
    chatCompletions(body: any): Promise<any>;
    streamChatCompletions(body: any): Promise<any>;
    healthCheck(): Promise<boolean>;
    private convertToAnthropicFormat;
    private convertToOpenAIFormat;
    private convertStreamToOpenAIFormat;
    private mapModel;
}
//# sourceMappingURL=anthropicProvider.d.ts.map