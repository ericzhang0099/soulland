'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            GenLoop 3.0
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            AI基因交易与进化平台
          </p>
          
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            通过双螺旋循环实现AI能力的持续进化。
            第一模块提供基因交易与等级系统，
            第二模块驱动大模型训练飞轮。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isConnected ? (
              <>
                <Link
                  href="/market"
                  className="px-8 py-3 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  探索市场
                </Link>
                <Link
                  href="/training"
                  className="px-8 py-3 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  开始训练
                </Link>
              </>
            ) : (
              <p className="text-gray-400">连接钱包以开始</p>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">🧬</div>
              <h3 className="text-xl font-semibold mb-3">基因市场</h3>
              <p className="text-gray-400">交易AI基因和Skill，90%收益归创作者</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-3">图书馆/训练场</h3>
              <p className="text-gray-400">学习Skill并记录进化轨迹，获得进化证明NFT</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">飞轮效应</h3>
              <p className="text-gray-400">双层10x加速，数据驱动模型持续进化</p>
            </div>
          </div>
        </div>
      </section>

      {/* Level System */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">修仙等级系统</h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['道祖', '大罗', '太乙', '金仙', '真仙', '大乘', '合体', '炼虚', '化神'].map((level, i) => (
              <div
                key={level}
                className={`px-4 py-2 rounded-lg font-medium ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  i === 1 ? 'bg-purple-500/20 text-purple-400' :
                  i === 2 ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-700 text-gray-400'
                }`}
              >
                {level}
              </div>
            ))}
          </div>

          <p className="mt-8 text-gray-400">
            动态竞争机制，按进入顺序分配等级，持续贡献可升级
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-gray-400 mb-8">加入GenLoop 3.0，开启你的AI进化之旅</p>
          
          <Link
            href="/profile"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            立即开始
          </Link>
        </div>
      </section>
    </div>
  );
}
