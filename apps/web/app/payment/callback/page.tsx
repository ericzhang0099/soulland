"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [message, setMessage] = useState("正在处理支付结果...");

  useEffect(() => {
    const outTradeNo = searchParams.get("out_trade_no");
    const tradeNo = searchParams.get("trade_no");
    const tradeStatus = searchParams.get("trade_status");

    // 根据支付宝返回的状态判断
    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      setStatus("success");
      setMessage("支付成功！积分已发放到您的钱包");
    } else if (tradeStatus === "WAIT_BUYER_PAY") {
      setStatus("pending");
      setMessage("等待支付完成...");
    } else {
      setStatus("failed");
      setMessage("支付失败或已取消");
    }

    // 这里可以调用后端API确认订单状态
    if (outTradeNo) {
      verifyPayment(outTradeNo);
    }
  }, [searchParams]);

  const verifyPayment = async (orderId: string) => {
    try {
      // 调用后端API验证支付状态
      const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        setStatus("success");
        setMessage("支付成功！积分已发放到您的钱包");
      }
    } catch (error) {
      console.error("验证支付失败:", error);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-bg-card rounded-2xl border border-white/10 p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <h2 className="text-xl font-bold mb-2">处理中</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-accent-emerald rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-accent-emerald mb-2">支付成功!</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="flex gap-4">
                <Link
                  href="/dashboard"
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold transition"
                >
                  查看余额
                </Link>
                <Link
                  href="/marketplace"
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition border border-white/20"
                >
                  去市场
                </Link>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">支付失败</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="flex gap-4">
                <Link
                  href="/payment"
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold transition"
                >
                  重新支付
                </Link>
                <Link
                  href="/"
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition border border-white/20"
                >
                  返回首页
                </Link>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-accent-amber border-t-transparent rounded-full animate-spin" />
              <h2 className="text-xl font-bold mb-2">等待支付</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <p className="text-sm text-gray-500">
                如果已完成支付，请稍后刷新页面查看结果
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
