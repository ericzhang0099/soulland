'use client';

interface GeneCardProps {
  id: string;
  name: string;
  description?: string;
  price: string;
  creator: string;
  rarityScore?: number;
  onPurchase?: () => void;
}

export function GeneCard({
  id,
  name,
  description,
  price,
  creator,
  rarityScore = 50,
  onPurchase,
}: GeneCardProps) {
  const rarityColor = rarityScore >= 80 ? 'text-purple-400' : 
                      rarityScore >= 60 ? 'text-blue-400' : 
                      rarityScore >= 40 ? 'text-green-400' : 'text-gray-400';

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-white truncate">{name}</h3>
        <span className={`text-sm font-medium ${rarityColor}`}>
          稀有度: {rarityScore}
        </span>
      </div>

      {description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-400">
          创作者: {creator.slice(0, 6)}...{creator.slice(-4)}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-green-400">
          {price} AGC
        </div>
        <button
          onClick={onPurchase}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          购买
        </button>
      </div>
    </div>
  );
}
