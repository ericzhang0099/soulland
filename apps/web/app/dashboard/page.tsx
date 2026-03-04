'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useStats } from '../hooks/useData';
import { StatCard } from '../components/StatCard';
import { GeneCard } from '../components/GeneCard';
import { Skeleton } from '../components/Skeleton';

export default function DashboardPage() {
  const { address } = useAccount();
  const { stats, isLoading } = useStats();
  const [timeRange, setTimeRange] = useState('7d');

  const statItems = [
    { title: '总用户数', value: stats?.totalUsers || 0, icon: '👥' },
    { title: '总基因数', value: stats?.totalGenes || 0, icon: '🧬' },
    { title: '总交易量', value: stats?.totalTransactions || 0, icon: '💱' },
    { title: '总交易额', value: `${stats?.totalVolume || 0} AGC`, icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">数据仪表盘</h1>
            <p className="text-gray-400 mt-1">实时监控平台数据</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <option value="24h">24小时</option>
            <option value="7d">7天</option>
            <option value="30d">30天</option>
            <option value="all">全部</option>
          </select>
        </div>

        {/* 统计卡片 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statItems.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        )}

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">交易趋势</h2>
            <div className="h-64 flex items-center justify-center text-gray-400">
              图表组件（待集成）
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">用户增长</h2>
            <div className="h-64 flex items-center justify-center text-gray-400">
              图表组件（待集成）
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
