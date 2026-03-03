import { Router } from '../core/router';
import { PointsService } from '../services/points.service';
import { QuotaService } from '../services/quota.service';
import { ComputeService } from '../services/compute.service';
/**
 * 依赖注入容器
 */
export interface Container {
    router: Router;
    pointsService: PointsService;
    quotaService: QuotaService;
    computeService: ComputeService;
}
/**
 * 创建依赖容器
 */
export declare function createContainer(): Container;
/**
 * 注册供应商
 */
export declare function registerProviders(router: Router): void;
//# sourceMappingURL=container.d.ts.map