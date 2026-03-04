'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useGene } from '../../hooks/useData';
import { useCart } from '../../hooks/useCart';
import { useFavorites } from '../../hooks/useFavorites';
import { PriceChart } from '../../components/PriceChart';
import { Sparkline } from '../../components/PriceChart';
import { Skeleton } from '../../components/Skeleton';
import { Badge } from '../../components/Badge';
import { formatAddress, formatPrice } from '../../lib/utils';

// 模拟价格历史数据
const mockPriceHistory = [
  { timestamp: Date.now() - 86400000 * 7, price: 100 },
  { timestamp: Date.now() - 86400000 * 6, price: 120 },
  { timestamp: Date.now() - 86400000 * 5, price: 110 },
  { timestamp: Date.now() - 86400000 * 4, price: 140 },
  { timestamp: Date.now() - 86400000 * 3, price: 135 },
  { timestamp: Date.now() - 86400000 * 2, price: 160 },
  { timestamp: Date.now() - 86400000, price: 150 },
  { timestamp: Date.now(), price: 180 },
];

export default function GeneDetailPage() {
  const params = useParams();
  const { address } = useAccount();
  const { gene, isLoading } = useGene(params.id as string);
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!gene) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">基因未找到</h1>
          <a href="/market" className="text-blue-400 hover:underline">返回市场</a>
        </div>
      </div>
    );
  }

  const isOwner = gene.creator?.address === address;
  const favorited = isFavorite(gene.id);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* 面包屑 */}
        <nav className="text-sm text-gray-400 mb-6">
          <a href="/" className="hover:text-white">首页</a>
          <span className="mx-2">/</span>
          <a href="/market" className="hover:text-white">市场</a>
          <span className="mx-2">/</span>
          <span className="text-white">{gene.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：基因信息 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{gene.name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">基因 ID: {gene.tokenId}</Badge>
                    {gene.metadata?.rarityScore && (
                      <Badge variant="warning">
                        稀有度: {gene.metadata.rarityScore}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(gene.id)}
                    className={`p-2 rounded-lg ${
                      favorited ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {favorited ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>

              <p className="text-gray-300 mb-6">{gene.description}</p>

              {/* 标签页 */}
              <div className="border-b border-gray-700 mb-6">
                <div className="flex gap-6">
                  {['overview', 'history', 'attributes'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 capitalize ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab === 'overview'
                        ? '概览'
                        : tab === 'history'
                        ? '历史'
                        : '属性'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标签内容 */}
              {activeTab === 'overview' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">价格趋势</h3>
                    <div className="h-48">
                      <PriceChart data={mockPriceHistory} width={600} height={180} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="text-gray-400">交易历史记录将显示在这里</div>
              )}

              {activeTab === 'attributes' && (
                <div className="grid grid-cols-2 gap-4">
                  {gene.metadata?.attributes?.map((attr: any, index: number) => (
                    <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">{attr.trait_type}</p>
                      <p className="text-lg font-medium">{attr.value}</p>
                    </div>
                  )) || <p className="text-gray-400">暂无属性数据</p>}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：购买卡片 */}
          <div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-6">
              <div className="mb-6">
                <p className="text-gray-400 mb-1">当前价格</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-400">
                    {formatPrice(gene.price)}
                  </span>
                  <span className="text-gray-400">AGC</span>
                </div>
                <div className="mt-2">
                  <Sparkline
                    data={mockPriceHistory.map((p) => p.price)}
                    width={200}
                    height={40}
                  />
                </div>
              </div>

              {!isOwner ? (
                <>
                  <button
                    onClick={() =>
                      addItem({
                        id: gene.id,
                        name: gene.name,
                        price: gene.price,
                        seller: gene.creator?.address || '',
                      })
                    }
                    className="w-full py-3 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 mb-3"
                  >
                    加入购物车
                  </button>

                  <button className="w-full py-3 bg-green-600 rounded-lg font-medium hover:bg-green-700">
                    立即购买
                  </button>
                </>
              ) : (
                <button className="w-full py-3 bg-gray-700 rounded-lg font-medium cursor-not-allowed">
                  您是该基因的拥有者
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">创作者</span>
                  <span>{formatAddress(gene.creator?.address || '')}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">创建时间</span>
                  <span>{new Date(gene.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">版税</span>
                  <span>10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
