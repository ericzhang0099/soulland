'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useGenes } from '../hooks/useData';
import { GeneCard } from '../components/GeneCard';

export default function MarketPage() {
  const { address } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});

  const { genes, isLoading, error, refetch } = useGenes({
    isActive: true,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
  });

  // 过滤和排序
  const filteredGenes = genes
    .filter((gene: any) =>
      gene.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gene.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rarity') return b.rarityScore - a.rarityScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">基因市场</h1>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            刷新
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="bg-gray-800 rounded-xl p-4 mb-8 border border-gray-700">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="搜索基因..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            >
              <option value="newest">最新发布</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
              <option value="rarity">稀有度</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="最低价格"
                value={priceRange.min || ''}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                className="w-28 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="最高价格"
                value={priceRange.max || ''}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                className="w-28 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">加载中...</p>
          </div>
        ) : (
          <>
            {/* 结果统计 */}
            <div className="mb-4 text-gray-400">
              共找到 {filteredGenes.length} 个基因
            </div>

            {/* 基因列表 */}
            {filteredGenes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGenes.map((gene: any) => (
                  <GeneCard
                    key={gene.id}
                    id={gene.id}
                    name={gene.name}
                    description={gene.description}
                    price={gene.price}
                    creator={gene.creator?.address || gene.creatorId}
                    rarityScore={gene.metadata?.rarityScore || 50}
                    onPurchase={() => {
                      if (!address) {
                        alert('请先连接钱包');
                        return;
                      }
                      // 处理购买逻辑
                      console.log('Purchase:', gene.id);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                没有找到符合条件的基因
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
