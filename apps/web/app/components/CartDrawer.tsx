'use client';

import { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../lib/utils';

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeItem, total, itemCount } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    // 模拟结账
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsCheckingOut(false);
    onClose();
  };

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 z-50 shadow-xl flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">购物车 ({itemCount})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              购物车是空的
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.seller.slice(0, 6)}...{item.seller.slice(-4)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">{formatPrice(item.price)} AGC</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">总计</span>
              <span className="text-2xl font-bold text-green-400">{formatPrice(total)} AGC</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isCheckingOut ? '处理中...' : '结算'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
