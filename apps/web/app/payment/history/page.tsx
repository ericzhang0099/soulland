"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";
import { ALIPAY_PAYMENT_ABI } from "@/lib/contracts/config";
import { useState, useEffect } from "react";

const ALIPAY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ALIPAY_CONTRACT_ADDRESS || "";

// 支付状态映射
const STATUS_MAP: { [key: number]: { text: string; color: string } } = {
  0: { text: "待支付", color: "text-accent-amber" },
  1: { text: "已支付", color: "text-accent-cyan" },
  2: { text: "已完成", color: "text-accent-emerald" },
  3: { text: "已取消", color: "text-gray-500" },
  4: { text: "已退款", color: "text-red-400" },
};

interface Order {
  orderId: string;
  alipayOrderNo: string;
  payer: string;
  amountCny: bigint;
  pointsAmount: bigint;
  status: number;
  createdAt: bigint;
  paidAt: bigint;
  completedAt: bigint;
  metadata: string;
}

export default function PaymentHistoryPage() {
  const { address, isConnected } = useAccount();
  const [orders, setOrders] = useState<Order[]>([]);

  // 读取用户订单数量
  const { data: orderCount } = useReadContract({
    address: ALIPAY_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALIPAY_PAYMENT_ABI,
    functionName: "getUserOrderCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!ALIPAY_CONTRACT_ADDRESS },
  });

  // 读取用户订单列表
  const { data: orderIds } = useReadContract({
    address: ALIPAY_CONTRACT_ADDRESS as `0x${string}`,
    abi: ALIPAY_PAYMENT_ABI,
    functionName: "getUserOrders",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!ALIPAY_CONTRACT_ADDRESS },
  });

  // 获取每个订单的详情
  useEffect(() => {
    const fetchOrders = async () => {
      if (!orderIds || !ALIPAY_CONTRACT_ADDRESS) return;
      
      // 这里简化处理，实际应该通过合约批量查询或后端API获取
      // 由于无法直接在客户端循环调用合约，建议通过后端API获取订单详情
      setOrders([]);
    };

    fetchOrders();
  }, [orderIds]);

  const formatAmount = (amountCny: bigint): string => {
    return (Number(amountCny) / 100).toFixed(2);
  };

  const formatPoints = (points: bigint): string => {
    return (Number(points) / 1e18).toFixed(2);
  };

  const formatDate = (timestamp: bigint): string => {
    if (!timestamp || timestamp === 0n) return "-";
    return new Date(Number(timestamp) * 1000).toLocaleString("zh-CN");
  };

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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-3xl font-bold">充值记录</h1>
            <Link
              href="/payment"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg transition"
            >
              去充值
            </Link>
          </div>

          {!isConnected ? (
            <div className="text-center py-16 bg-bg-card rounded-2xl border border-white/10">
              <p className="text-gray-400">请先连接钱包查看充值记录</p>
            </div>
          ) : (
            <div className="bg-bg-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">订单ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">金额</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">积分</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">状态</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">创建时间</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">完成时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          暂无充值记录
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const status = STATUS_MAP[order.status] || { text: "未知", color: "text-gray-500" };
                        return (
                          <tr key={order.orderId} className="hover:bg-white/5">
                            <td className="px-6 py-4 font-mono text-sm">
                              {order.orderId.slice(0, 10)}...{order.orderId.slice(-6)}
                            </td>
                            <td className="px-6 py-4">¥{formatAmount(order.amountCny)}</td>
                            <td className="px-6 py-4 text-accent-emerald">
                              {formatPoints(order.pointsAmount)} GLP
                            </td>
                            <td className={`px-6 py-4 ${status.color}`}>{status.text}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {formatDate(order.completedAt)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {orderCount && Number(orderCount) > 0 && (
                <div className="px-6 py-4 border-t border-white/10 text-sm text-gray-400">
                  共 {orderCount.toString()} 条记录
                </div>
              )}
            </div>
          )}

          {/* 提示 */}
          <div className="mt-8 p-6 bg-bg-card/50 rounded-xl border border-white/5">
            <h3 className="font-bold mb-2">关于充值</h3>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>充值金额将按当前汇率转换为 GenLoop 积分 (GLP)</li>
              <li>支付成功后积分将自动发放到您的钱包</li>
              <li>如遇到账延迟，请耐心等待或联系客服</li>
              <li>充值记录可能存在延迟，请稍后刷新查看</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
