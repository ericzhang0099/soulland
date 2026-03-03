/**
 * 支付宝配置管理类
 */
declare class AlipayConfig {
    appId: string;
    privateKey: string;
    alipayPublicKey: string;
    gatewayUrl: string;
    signType: string;
    charset: string;
    format: string;
    notifyUrl: string;
    returnUrl: string;
    sandbox: boolean;
    constructor();
    /**
     * 格式化密钥
     */
    private _formatKey;
    private _chunkString;
    private _validateConfig;
    /**
     * 生成签名
     */
    sign(params: Record<string, any>): string;
    /**
     * 验证签名
     */
    verify(params: Record<string, any>, sign: string): boolean;
    private _filterParams;
    private _buildSignString;
    /**
     * 生成订单号
     */
    generateOrderId(): string;
}
declare const _default: AlipayConfig;
export default _default;
//# sourceMappingURL=alipay.config.d.ts.map