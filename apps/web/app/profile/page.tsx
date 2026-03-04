'use client';

import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useIdentity, useAGCBalance, useGeneBalance } from '../hooks/useWeb3';
import { useEvolutions } from '../hooks/useData';
import { IdentityCard } from '../components/IdentityCard';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { 
    identity, 
    isLoading: isLoadingIdentity, 
    register, 
    isRegistering,
    isSuccess 
  } = useIdentity();
  const { balance: agcBalance, isLoading: isLoadingAGC } = useAGCBalance();
  const { balance: geneCount, isLoading: isLoadingGenes } = useGeneBalance();
  const { evolutions, isLoading: isLoadingEvolutions } = useEvolutions(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">请先连接钱包</h1>
          <p className="text-gray-400 mb-8">连接钱包以查看您的GenLoop身份和资产</p>
          <ConnectKitButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">个人中心</h1>
            <p className="text-gray-400 mt-1">{address}</p>
          </div>
          <ConnectKitButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 身份等级 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">修仙等级</h2>
            
            {isLoadingIdentity ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-24"></div>
              </div>
            ) : identity ? (
              <div>
                <div className={`text-3xl font-bold ${identity.levelColor} mb-2`}>
                  {identity.levelName}
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>进入排名: #{identity.entryRank}</p>
                  <p>贡献值: {identity.contribution}</p>
                  {identity.canUpgrade && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                      可升级
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">您还没有注册身份</p>
                <button
                  onClick={register}
                  disabled={isRegistering}
                  className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? '注册中...' : '注册身份'}
                </button>
                {isSuccess && (
                  <p className="mt-2 text-green-400 text-sm">注册成功！</p>
                )}
              </div>
            )}
          </div>

          {/* AGC余额 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">AGC余额</h2>
            
            {isLoadingAGC ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-700 rounded w-32"></div>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="text-4xl font-bold text-green-400 mb-1">
                  {agcBalance.toFixed(2)}
                </div>
                <p className="text-gray-400 text-sm">AGC</p>
                <button className="mt-4 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 text-sm">
                  购买算力
                </button>
              </div>
            )}
          </div>

          {/* 基因资产 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">我的基因</h2>
            
            {isLoadingGenes ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-700 rounded w-20"></div>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="text-4xl font-bold text-purple-400 mb-1">
                  {geneCount}
                </div>
                <p className="text-gray-400 text-sm">个基因</p>
                <a 
                  href="/market"
                  className="mt-4 inline-block px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 text-sm"
                >
                  去市场
                </a>
              </div>
            )}
          </div>

          {/* 进化记录 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">进化记录</h2>
            
            {isLoadingEvolutions ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-700 rounded w-20"></div>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="text-4xl font-bold text-cyan-400 mb-1">
                  {evolutions.length}
                </div>
                <p className="text-gray-400 text-sm">次进化</p>
                <a
                  href="/training"
                  className="mt-4 inline-block px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 text-sm"
                >
                  去训练
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">最近活动</h2>
          
          {evolutions.length > 0 ? (
            <div className="space-y-3">
              {evolutions.slice(0, 5).map((evo: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium">{evo.skillName}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(evo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    evo.level === 1 ? 'bg-green-600/20 text-green-400' :
                    evo.level === 2 ? 'bg-blue-600/20 text-blue-400' :
                    'bg-purple-600/20 text-purple-400'
                  }`}>
                    {evo.level === 1 ? '基础级' : evo.level === 2 ? '进阶级' : '专家级'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">暂无活动记录</p>
          )}
        </div>
      </div>
    </div>
  );
}
