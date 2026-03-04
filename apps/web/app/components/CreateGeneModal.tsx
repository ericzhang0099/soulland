'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

interface Gene {
  id: string;
  name: string;
  description?: string;
  price: string;
}

export function CreateGeneModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address } = useAccount();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gene, setGene] = useState<Partial<Gene>>({
    name: '',
    description: '',
    price: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    onClose();
    setStep(1);
    setGene({ name: '', description: '', price: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">铸造基因NFT</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* 步骤指示器 */}
        <div className="flex mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">基因名称</label>
              <input
                type="text"
                value={gene.name}
                onChange={(e) => setGene({ ...gene, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="例如：高级代码生成基因"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
              <textarea
                value={gene.description}
                onChange={(e) => setGene({ ...gene, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-24"
                placeholder="描述这个基因的功能和特点..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">价格 (AGC)</label>
              <input
                type="number"
                value={gene.price}
                onChange={(e) => setGene({ ...gene, price: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="100"
              />
              <p className="text-sm text-gray-400 mt-2">您将获得 90% = {gene.price ? Number(gene.price) * 0.9 : 0} AGC</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">收益分配</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>创作者（您）</span>
                  <span className="text-green-400">90%</span>
                </div>
                <div className="flex justify-between">
                  <span>平台</span>
                  <span className="text-blue-400">10%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-medium mb-4">确认信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">名称</span>
                  <span>{gene.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">价格</span>
                  <span>{gene.price} AGC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">创作者</span>
                  <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              上一步
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!gene.name || (step === 2 && !gene.price)}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? '铸造中...' : '确认铸造'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
