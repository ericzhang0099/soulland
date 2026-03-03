"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { ALIPAY_PAYMENT_ABI } from "@/lib/contracts/config";

const ALIPAY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ALIPAY_CONTRACT_ADDRESS || "";

// 支付金额选项（人民币：元）
const PAYMENT_OPTIONS = [
  { amount: 10, points: 100, label: "10元", popular: false },
  { amount: 50, points: 550, label: "50元", popular: true },
  { amount: 100, points: 1200, label: "100元", popular: false },
  { amount: 500, points: 6500, label: "500元", popular: false },
];

export default function PaymentPage() {
  const { address, isConnected } = useAccount();
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // 读取汇率
  const { data: exchangeRate } = useReadContract({
    address: ALIPAY_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALIPAY_PAYMENT_ABI,
    functionName: "exchangeRate",
    query: { enabled: !!ALIPAY_CONTRACT_ADDRESS },
  });

  // 创建订单
  const { writeContract: createOrder, data: hash, error: writeError, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // 计算积分
  const calculatePoints = (amountCny: number): number => {
    if (!exchangeRate) return amountCny * 10; // 默认汇率
    return Math.floor((amountCny * 100 * Number(exchangeRate)) / 100 / 1e18);
  };

  const handleCreateOrder = async () => {
    if (!isConnected || !address) return;
    
    const amount = isCustom ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount <= 0) return;

    setIsLoading(true);
    setOrderStatus("creating");

    try {
      // 转换为分（人民币最小单位）
      const amountInCents = Math.floor(amount * 100);
      
      const metadata = JSON.stringify({
        type: "alipay_payment",
        device: "web",
        timestamp: Date.now(),
      });

      createOrder({
        address: ALIPAY_CONTRACT_ADDRESS as `0x${string}`,
        abi: ALIPAY_PAYMENT_ABI,
        functionName: "createOrder",
        args: [BigInt(amountInCents), metadata],
      });
    } catch (error) {
      console.error("创建订单失败:", error);
      setOrderStatus("error");
    }
  };

  // 监听交易确认
  useEffect(() => {
    if (isConfirmed && hash) {
      setOrderStatus("created");
      // 从交易收据中获取订单ID（简化处理）
      setCreatedOrderId(hash);
    }
  }, [isConfirmed, hash]);

  // 计算当前选择的金额对应的积分
  const currentAmount = isCustom ? parseFloat(customAmount || "0") : selectedAmount;
  const currentPoints = calculatePoints(currentAmount);

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-bg-card/50 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-pink rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <span className="font-display font-bold text-xl">GenLoop</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition">
                市场
              </Link>
              <Link href="/breeding" className="text-gray-300 hover:text-white transition">
                交配室
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                仪表盘
              </Link>
            </div>

            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary-400 to-accent-pink bg-clip-text text-transparent">
                充值积分
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              使用支付宝充值 GenLoop 积分，用于基因交易和交配
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center py-16 bg-bg-card rounded-2xl border border-white/10">
              <p className="text-gray-400 mb-6">请先连接钱包以继续</p>
              <ConnectButton />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* 金额选择 */}
              <div className="bg-bg-card rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-bold mb-6">选择充值金额</h2>
                
                {/* 预设选项 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {PAYMENT_OPTIONS.map((option) => (
                    <button
                      key={option.amount}
                      onClick={() => {
                        setSelectedAmount(option.amount);
                        setIsCustom(false);
                      }}
                      className={`relative p-4 rounded-xl border transition ${
                        !isCustom && selectedAmount === option.amount
                          ? "border-primary-500 bg-primary-500/10"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      {option.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-accent-pink text-xs rounded-full">
                          热门
                        </span>
                      )}
                      <div className="text-lg font-bold">{option.label}</div>
                      <div className="text-sm text-accent-emerald">{option.points} 积分</div>
                    </button>
                  ))}
                </div>

                {/* 自定义金额 */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isCustom}
                      onChange={() => setIsCustom(true)}
                      className="w-4 h-4 accent-primary-500"
                    />
                    <span className="text-sm text-gray-400">自定义金额</span>
                  </label>
                  {isCustom && (
                    <div className="relative">
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="输入金额（元）"
                        min="1"
                        max="100000"
                        className="w-full px-4 py-3 bg-bg-dark border border-white/10 rounded-xl focus:border-primary-500 focus:outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">元</span>
                    </div>
                  )}
                </div>

                {/* 汇率信息 */}
                <div className="text-sm text-gray-500">
                  当前汇率: 1元 = {exchangeRate ? (Number(exchangeRate) / 1e18).toFixed(2) : "10"} 积分
                </div>
              </div>

              {/* 订单摘要 */}
              <div className="bg-bg-card rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-bold mb-6">订单摘要</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">充值金额</span>
                    <span className="font-bold">{currentAmount.toFixed(2)} 元</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">获得积分</span>
                    <span className="font-bold text-accent-emerald">{currentPoints} GLP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">支付方式</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[#1677FF]">支付宝</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">钱包地址</span>
                    <span className="text-sm text-gray-500">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                </div>

                {/* 创建订单按钮 */}
                {!createdOrderId ? (
                  <button
                    onClick={handleCreateOrder}
                    disabled={isLoading || isPending || isConfirming || currentAmount <= 0}
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition"
                  >
                    {isPending || isConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        处理中...
                      </span>
                    ) : (
                      "创建订单"
                    )}
                  </button>
                ) : (
                  <AlipayQRCode 
                    orderId={createdOrderId} 
                    amount={currentAmount}
                    onClose={() => {
                      setCreatedOrderId(null);
                      setOrderStatus("");
                    }}
                  />
                )}

                {writeError && (
                  <p className="mt-4 text-red-400 text-sm">
                    错误: {writeError.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 说明 */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-bg-card/50 rounded-xl border border-white/5">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-bold mb-2">安全支付</h3>
              <p className="text-sm text-gray-400">使用支付宝官方支付接口，保障您的资金安全</p>
            </div>
            <div className="p-6 bg-bg-card/50 rounded-xl border border-white/5">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold mb-2">即时到账</h3>
              <p className="text-sm text-gray-400">支付成功后积分将立即发放到您的钱包</p>
            </div>
            <div className="p-6 bg-bg-card/50 rounded-xl border border-white/5">
              <div className="text-3xl mb-3">💎</div>
              <h3 className="font-bold mb-2">用途广泛</h3>
              <p className="text-sm text-gray-400">积分可用于基因交易、交配、市场购买等</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 支付宝二维码组件
function AlipayQRCode({ 
  orderId, 
  amount, 
  onClose 
}: { 
  orderId: string; 
  amount: number;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");
  const [countdown, setCountdown] = useState(900); // 15分钟倒计时

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (status === "paid") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-accent-emerald rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-accent-emerald mb-2">支付成功!</h3>
        <p className="text-gray-400 mb-4">积分已发放到您的钱包</p>
        <Link 
          href="/dashboard" 
          className="inline-block px-6 py-2 bg-primary-600 rounded-lg hover:bg-primary-500 transition"
        >
          查看余额
        </Link>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-2">订单已过期</h3>
        <p className="text-gray-400 mb-4">请重新创建订单</p>
        <button 
          onClick={onClose}
          className="px-6 py-2 bg-primary-600 rounded-lg hover:bg-primary-500 transition"
        >
          重新创建
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="bg-white p-4 rounded-xl mb-4 inline-block">
        {/* 这里应该显示真实的支付宝二维码 */}
        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
          支付宝二维码
          <br />
          (模拟)
        </div>
      </div>
      
      <p className="text-sm text-gray-400 mb-2">
        请使用支付宝扫描二维码支付
      </p>
      <p className="text-lg font-bold text-[#1677FF] mb-4">
        ¥{amount.toFixed(2)}
      </p>
      
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        等待支付... {formatTime(countdown)}
      </div>

      <button 
        onClick={onClose}
        className="text-sm text-gray-500 hover:text-white transition"
      >
        取消支付
      </button>
    </div>
  );
}
