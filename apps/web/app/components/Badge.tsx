'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const variants = {
  default: 'bg-gray-700 text-gray-300',
  success: 'bg-green-600/20 text-green-400',
  warning: 'bg-yellow-600/20 text-yellow-400',
  error: 'bg-red-600/20 text-red-400',
  info: 'bg-blue-600/20 text-blue-400',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}

// 等级徽章
export function LevelBadge({ level }: { level: number }) {
  const levelNames = ['None', '道祖', '大罗', '太乙', '金仙', '真仙', '大乘', '合体', '炼虚', '化神'];
  const levelColors: Record<number, string> = {
    1: 'bg-yellow-600/20 text-yellow-400',
    2: 'bg-purple-600/20 text-purple-400',
    3: 'bg-blue-600/20 text-blue-400',
    4: 'bg-green-600/20 text-green-400',
    5: 'bg-teal-600/20 text-teal-400',
    6: 'bg-orange-600/20 text-orange-400',
    7: 'bg-pink-600/20 text-pink-400',
    8: 'bg-indigo-600/20 text-indigo-400',
    9: 'bg-gray-600/20 text-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
        levelColors[level] || 'bg-gray-700 text-gray-300'
      }`}
    >
      {levelNames[level] || 'Unknown'}
    </span>
  );
}

// 稀有度徽章
export function RarityBadge({ score }: { score: number }) {
  let variant: BadgeProps['variant'] = 'default';
  let label = '普通';

  if (score >= 90) {
    variant = 'error';
    label = '传说';
  } else if (score >= 70) {
    variant = 'warning';
    label = '史诗';
  } else if (score >= 50) {
    variant = 'info';
    label = '稀有';
  } else if (score >= 30) {
    variant = 'success';
    label = '优秀';
  }

  return <Badge variant={variant}>{label}</Badge>;
}
