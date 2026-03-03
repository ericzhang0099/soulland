// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
        [key: string]: any;
      };
    }
  }
}

export {};
