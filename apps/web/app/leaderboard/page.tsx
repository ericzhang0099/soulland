'use client';

import { useLeaderboard } from '../hooks/useData';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

const levelColors: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-purple-400',
  3: 'text-blue-400',
  4: 'text-green-400',
  5: 'text-teal-400',
  6: 'text-orange-400',
  7: 'text-pink-400',
  8: 'text-indigo-400',
  9: 'text-gray-400',
};

const levelNames = ['None', '道祖', '大罗', '太乙', '金仙', '真仙', '大乘', '合体', '炼虚', '化神'];

export default function LeaderboardPage() {
  const { leaderboard, isLoading, error } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">修仙等级排行榜</h1>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon="⚠️"
            title="加载失败"
            description={error}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">修仙等级排行榜</h1>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-700 font-medium text-gray-300">
            <div className="col-span-1">排名</div>
            <div className="col-span-5">用户</div>
            <div className="col-span-3">等级</div>
            <div className="col-span-3 text-right">贡献值</div>
          </div>

          <div className="divide-y divide-gray-700">
            {leaderboard.length > 0 ? (
              leaderboard.map((user: any, index: number) => (
                <div
                  key={user.address}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-700/50 transition-colors"
                >
                  <div className="col-span-1">
                    {index < 3 ? (
                      <span className={`text-2xl ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        'text-orange-400'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-gray-500">#{index + 1}</span>
                    )}
                  </div>

                  <div className="col-span-5">
                    <div className="font-medium">{user.name || '匿名用户'}</div>
                    <div className="text-sm text-gray-400">{user.address}</div>
                  </div>

                  <div className="col-span-3">
                    <span className={`font-bold ${levelColors[user.level]}`}>
                      {levelNames[user.level]}
                    </span>
                  </div>

                  <div className="col-span-3 text-right font-medium">
                    {user.contribution?.toLocaleString() || 0}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        </div>

        {/* 等级说明 */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">等级说明</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {levelNames.slice(1).map((name, index) => (
              <div key={name} className="flex items-center gap-2">
                <span className={`font-bold ${levelColors[index + 1]}`}>{name}</span>
                <span className="text-xs text-gray-500">
                  ({index === 0 ? '1-10K' : index === 1 ? '10K-30K' : index === 2 ? '30K-80K' : index === 3 ? '80K-180K' : '180K+'})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
