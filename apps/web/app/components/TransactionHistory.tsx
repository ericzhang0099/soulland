'use client';

import { formatAddress, formatDate, formatPrice } from '../lib/utils';

interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'reward';
  geneName?: string;
  amount: string;
  counterparty: string;
  timestamp: string;
  txHash: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-800 h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        暂无交易记录
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-red-400';
      case 'sale':
        return 'text-green-400';
      case 'reward':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return '购买';
      case 'sale':
        return '出售';
      case 'reward':
        return '奖励';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'purchase'
                    ? 'bg-red-500/20'
                    : tx.type === 'sale'
                    ? 'bg-green-500/20'
                    : 'bg-yellow-500/20'
                }`}
              >
                <span className={getTypeColor(tx.type)}>
                  {tx.type === 'purchase' ? '↓' : tx.type === 'sale' ? '↑' : '★'}
                </span>
              </div>

              <div>
                <p className="font-medium">
                  {tx.geneName || getTypeLabel(tx.type)}
                </p>
                <p className="text-sm text-gray-400">
                  {tx.type === 'purchase' ? '从 ' : tx.type === 'sale' ? '给 ' : ''}
                  {formatAddress(tx.counterparty)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className={`font-bold ${getTypeColor(tx.type)}`}>
                {tx.type === 'purchase' ? '-' : '+'}
                {formatPrice(tx.amount)} AGC
              </p>
              <p className="text-sm text-gray-400">{formatDate(tx.timestamp)}</p>
            </div>
          </div>

          <a
            href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
          >
            查看交易 ↗
          </a>
        </div>
      ))}
    </div>
  );
}
