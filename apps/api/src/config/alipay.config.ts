import crypto from 'crypto';

/**
 * 支付宝配置管理类
 */
class AlipayConfig {
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
  private _formatKey(key: string, type: 'private' | 'public'): string {
    if (!key) return '';
    
    if (key.includes('-----BEGIN')) {
      return key;
    }
    
    key = key.replace(/\s/g, '');
    
    if (type === 'private') {
      return `-----BEGIN RSA PRIVATE KEY-----\n${this._chunkString(key, 64)}\n-----END RSA PRIVATE KEY-----`;
    } else {
      return `-----BEGIN PUBLIC KEY-----\n${this._chunkString(key, 64)}\n-----END PUBLIC KEY-----`;
    }
  }

  private _chunkString(str: string, size: number): string {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.substring(i, i + size));
    }
    return chunks.join('\n');
  }

  private _validateConfig(): void {
    const required = ['appId', 'privateKey', 'alipayPublicKey'];
    const missing = required.filter(key => !(this as any)[key]);
    
    if (missing.length > 0) {
      console.warn(`支付宝配置缺失: ${missing.join(', ')}`);
    }
  }

  /**
   * 生成签名
   */
  sign(params: Record<string, any>): string {
    const filtered = this._filterParams(params);
    const signString = this._buildSignString(filtered);
    
    const algorithm = this.signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1';
    
    const sign = crypto.createSign(algorithm);
    sign.update(signString, this.charset as crypto.Encoding);
    
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * 验证签名
   */
  verify(params: Record<string, any>, sign: string): boolean {
    try {
      const filtered = this._filterParams(params);
      const signString = this._buildSignString(filtered);
      
      const algorithm = this.signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1';
      
      const verify = crypto.createVerify(algorithm);
      verify.update(signString, this.charset as crypto.Encoding);
      
      return verify.verify(this.alipayPublicKey, sign, 'base64');
    } catch (error) {
      console.error('签名验证失败:', error);
      return false;
    }
  }

  private _filterParams(params: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '' && 
          key !== 'sign' && key !== 'sign_type') {
        filtered[key] = value;
      }
    }
    
    return filtered;
  }

  private _buildSignString(params: Record<string, any>): string {
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
  generateOrderId(): string {
    const prefix = 'GLP';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${date}${timestamp}${random}`;
  }
}

export default new AlipayConfig();
