'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon }: StatCardProps) {
  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold">{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
            {changeType === 'positive' && '↑ '}
            {changeType === 'negative' && '↓ '}
            {change}
          </p>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  stats: StatCardProps[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
