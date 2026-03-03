"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
/**
 * 支付宝配置管理类
 */
class AlipayConfig {
    constructor() {
        this.appId = process.env.ALIPAY_APP_ID || '';
        this.privateKey = this._formatKey(process.env.ALIPAY_APP_PRIVATE_KEY || '', 'private');
        this.alipayPublicKey = this._formatKey(process.env.ALIPAY_PUBLIC_KEY || '', 'public');
        this.gatewayUrl = process.env.ALIPAY_SANDBOX === 'true'
            ? 'https://openapi.alipaydev.com/gateway.do'
            : 'https://openapi.alipay.com/gateway.do';
        this.signType = process.env.ALIPAY_SIGN_TYPE || 'RSA2';
        this.charset = process.env.ALIPAY_CHARSET || 'utf-8';
        this.format = process.env.ALIPAY_FORMAT || 'json';
        this.notifyUrl = process.env.ALIPAY_NOTIFY_URL || '';
        this.returnUrl = process.env.ALIPAY_RETURN_URL || '';
        this.sandbox = process.env.ALIPAY_SANDBOX === 'true';
        this._validateConfig();
    }
    /**
     * 格式化密钥
     */
    _formatKey(key, type) {
        if (!key)
            return '';
        if (key.includes('-----BEGIN')) {
            return key;
        }
        key = key.replace(/\s/g, '');
        if (type === 'private') {
            return `-----BEGIN RSA PRIVATE KEY-----\n${this._chunkString(key, 64)}\n-----END RSA PRIVATE KEY-----`;
        }
        else {
            return `-----BEGIN PUBLIC KEY-----\n${this._chunkString(key, 64)}\n-----END PUBLIC KEY-----`;
        }
    }
    _chunkString(str, size) {
        const chunks = [];
        for (let i = 0; i < str.length; i += size) {
            chunks.push(str.substring(i, i + size));
        }
        return chunks.join('\n');
    }
    _validateConfig() {
        const required = ['appId', 'privateKey', 'alipayPublicKey'];
        const missing = required.filter(key => !this[key]);
        if (missing.length > 0) {
            console.warn(`支付宝配置缺失: ${missing.join(', ')}`);
        }
    }
    /**
     * 生成签名
     */
    sign(params) {
        const filtered = this._filterParams(params);
        const signString = this._buildSignString(filtered);
        const algorithm = this.signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1';
        const sign = crypto_1.default.createSign(algorithm);
        sign.update(signString, this.charset);
        return sign.sign(this.privateKey, 'base64');
    }
    /**
     * 验证签名
     */
    verify(params, sign) {
        try {
            const filtered = this._filterParams(params);
            const signString = this._buildSignString(filtered);
            const algorithm = this.signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1';
            const verify = crypto_1.default.createVerify(algorithm);
            verify.update(signString, this.charset);
            return verify.verify(this.alipayPublicKey, sign, 'base64');
        }
        catch (error) {
            console.error('签名验证失败:', error);
            return false;
        }
    }
    _filterParams(params) {
        const filtered = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined && value !== '' &&
                key !== 'sign' && key !== 'sign_type') {
                filtered[key] = value;
            }
        }
        return filtered;
    }
    _buildSignString(params) {
        const sortedKeys = Object.keys(params).sort();
        const pairs = sortedKeys.map(key => {
            const value = params[key];
            if (typeof value === 'object') {
                return `${key}=${JSON.stringify(value)}`;
            }
            return `${key}=${value}`;
        });
        return pairs.join('&');
    }
    /**
     * 生成订单号
     */
    generateOrderId() {
        const prefix = 'GLP';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}${date}${timestamp}${random}`;
    }
}
exports.default = new AlipayConfig();
//# sourceMappingURL=alipay.config.js.map