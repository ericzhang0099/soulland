import { ProviderConfig } from '../../config';
import { Provider } from '../providerRouter';
export declare class ZhipuProvider implements Provider {
    name: string;
    type: string;
    enabled: boolean;
    priority: number;
    private client;
    constructor(config: ProviderConfig);
    chatCompletions(body: any): Promise<any>;
    streamChatCompletions(body: any): Promise<any>;
    healthCheck(): Promise<boolean>;
    private convertToZhipuFormat;
    private mapModel;
}
//# sourceMappingURL=zhipuProvider.d.ts.map