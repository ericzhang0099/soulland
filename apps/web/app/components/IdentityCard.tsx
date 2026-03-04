'use client';

interface IdentityCardProps {
  level: number;
  levelName: string;
  entryRank: number;
  contribution: number;
  canUpgrade: boolean;
}

const levelColors: Record<number, string> = {
  1: 'from-yellow-400 to-yellow-600', // 道祖
  2: 'from-purple-400 to-purple-600', // 大罗
  3: 'from-blue-400 to-blue-600',     // 太乙
  4: 'from-green-400 to-green-600',   // 金仙
  5: 'from-teal-400 to-teal-600',     // 真仙
  6: 'from-orange-400 to-orange-600', // 大乘
  7: 'from-pink-400 to-pink-600',     // 合体
  8: 'from-indigo-400 to-indigo-600', // 炼虚
  9: 'from-gray-400 to-gray-600',     // 化神
};

export function IdentityCard({
  level,
  levelName,
  entryRank,
  contribution,
  canUpgrade,
}: IdentityCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">修仙等级</h3>
        {canUpgrade && (
          <span className="px-2 py-1 bg-green-600 text-xs rounded-full">可升级</span>
        )}
      </div>

      <div className={`text-4xl font-bold bg-gradient-to-r ${levelColors[level]} bg-clip-text text-transparent mb-2`}>
        {levelName}
      </div>

      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>进入排名</span>
          <span className="text-white">#{entryRank}</span>
        </div>
        <div className="flex justify-between">
          <span>贡献值</span>
          <span className="text-white">{contribution}</span>
        </div>
      </div>

      <button className="mt-4 w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:opacity-90 transition-opacity">
        查看详情
      </button>
    </div>
  );
}
