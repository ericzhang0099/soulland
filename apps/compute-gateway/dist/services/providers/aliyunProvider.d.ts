import { ProviderConfig } from '../../config';
import { Provider } from '../providerRouter';
export declare class AliyunProvider implements Provider {
    name: string;
    type: string;
    enabled: boolean;
    priority: number;
    private client;
    constructor(config: ProviderConfig);
    chatCompletions(body: any): Promise<any>;
    streamChatCompletions(body: any): Promise<any>;
    healthCheck(): Promise<boolean>;
    private convertToAliyunFormat;
    private convertToOpenAIFormat;
    private mapModel;
}
//# sourceMappingURL=aliyunProvider.d.ts.map