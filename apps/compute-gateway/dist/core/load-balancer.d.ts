import { ChatCompletionRequest, RoutingDecision, ProviderStatus, ProviderConfig } from '../types';
/**
 * 负载均衡器
 */
export declare class LoadBalancer {
    private latencyWeight;
    private costWeight;
    private availabilityWeight;
    private loadWeight;
    private maxLatencyMs;
    private maxErrorRate;
    private maxLoad;
    /**
     * 选择最佳供应商
     */
    selectProvider(request: ChatCompletionRequest, availableProviders: Map<string, ProviderStatus>, configs: Map<string, ProviderConfig>): RoutingDecision | null;
    private filterCandidates;
    private calculateScores;
    private estimateCost;
}
/**
 * 加权轮询
 */
export declare class WeightedRoundRobin {
    private weights;
    private current;
    updateWeights(weights: Record<string, number>): void;
    select(available: string[]): string | null;
}
//# sourceMappingURL=load-balancer.d.ts.map