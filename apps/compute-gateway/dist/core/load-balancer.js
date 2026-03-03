"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightedRoundRobin = exports.LoadBalancer = void 0;
/**
 * 负载均衡器
 */
class LoadBalancer {
    latencyWeight = 0.3;
    costWeight = 0.2;
    availabilityWeight = 0.3;
    loadWeight = 0.2;
    maxLatencyMs = 5000;
    maxErrorRate = 0.1;
    maxLoad = 0.9;
    /**
     * 选择最佳供应商
     */
    selectProvider(request, availableProviders, configs) {
        // 过滤候选供应商
        const candidates = this.filterCandidates(request, availableProviders, configs);
        if (candidates.size === 0) {
            console.warn('No available providers for request');
            return null;
        }
        // 计算得分
        const scores = this.calculateScores(candidates);
        // 选择最佳供应商
        let bestProvider = '';
        let bestScore = -1;
        scores.forEach((score, name) => {
            if (score > bestScore) {
                bestScore = score;
                bestProvider = name;
            }
        });
        const config = configs.get(bestProvider);
        if (!config)
            return null;
        // 生成备选列表
        const fallbacks = [];
        scores.forEach((score, name) => {
            if (name !== bestProvider) {
                fallbacks.push(name);
            }
        });
        return {
            providerName: bestProvider,
            model: request.model,
            reason: `Score: ${bestScore.toFixed(2)}`,
            estimatedLatency: candidates.get(bestProvider)?.latencyMs || 0,
            estimatedCost: this.estimateCost(request, config),
            fallbackProviders: fallbacks.slice(0, 3),
        };
    }
    filterCandidates(request, providers, configs) {
        const candidates = new Map();
        providers.forEach((status, name) => {
            const config = configs.get(name);
            if (!config)
                return;
            // 基本可用性检查
            if (!status.isAvailable)
                return;
            if (status.errorRate > this.maxErrorRate)
                return;
            if (status.currentLoad > this.maxLoad)
                return;
            if (status.circuitState === 'open')
                return;
            // 模型支持检查
            if (!config.models.includes(request.model))
                return;
            candidates.set(name, status);
        });
        return candidates;
    }
    calculateScores(candidates) {
        const scores = new Map();
        candidates.forEach((status, name) => {
            let score = 0;
            // 延迟得分（越低越好）
            const latencyScore = Math.max(0, 1 - (status.latencyMs / this.maxLatencyMs));
            score += latencyScore * this.latencyWeight;
            // 可用性得分
            const availabilityScore = 1 - status.errorRate;
            score += availabilityScore * this.availabilityWeight;
            // 负载得分（越低越好）
            const loadScore = 1 - status.currentLoad;
            score += loadScore * this.loadWeight;
            // 队列长度惩罚
            const queuePenalty = Math.min(0.3, status.queueLength * 0.01);
            score -= queuePenalty;
            scores.set(name, score);
        });
        return scores;
    }
    estimateCost(request, config) {
        // 估算token数
        const estimatedTokens = request.messages.reduce((sum, m) => sum + m.content.length * 0.4, 0) + 100;
        const baseCost = (estimatedTokens / 1000) * 2; // 基础成本
        return baseCost * config.costMultiplier;
    }
}
exports.LoadBalancer = LoadBalancer;
/**
 * 加权轮询
 */
class WeightedRoundRobin {
    weights = new Map();
    current = new Map();
    updateWeights(weights) {
        Object.entries(weights).forEach(([name, weight]) => {
            this.weights.set(name, weight);
            if (!this.current.has(name)) {
                this.current.set(name, 0);
            }
        });
    }
    select(available) {
        if (available.length === 0)
            return null;
        // 只考虑可用的
        const validWeights = new Map();
        this.weights.forEach((weight, name) => {
            if (available.includes(name)) {
                validWeights.set(name, weight);
            }
        });
        if (validWeights.size === 0) {
            return available[Math.floor(Math.random() * available.length)];
        }
        // 加权轮询
        const total = Array.from(validWeights.values()).reduce((a, b) => a + b, 0);
        const pick = Math.random() * total;
        let current = 0;
        for (const [name, weight] of validWeights) {
            current += weight;
            if (pick <= current) {
                return name;
            }
        }
        return Array.from(validWeights.keys()).pop() || null;
    }
}
exports.WeightedRoundRobin = WeightedRoundRobin;
//# sourceMappingURL=load-balancer.js.map