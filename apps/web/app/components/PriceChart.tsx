'use client';

import { useMemo } from 'react';

interface PricePoint {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PricePoint[];
  width?: number;
  height?: number;
  color?: string;
}

export function PriceChart({
  data,
  width = 300,
  height = 100,
  color = '#3b82f6',
}: PriceChartProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';

    const minPrice = Math.min(...data.map((d) => d.price));
    const maxPrice = Math.max(...data.map((d) => d.price));
    const priceRange = maxPrice - minPrice || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.price - minPrice) / priceRange) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (data.length 㰯) return '';

    const minPrice = Math.min(...data.map((d) => d.price));
    const maxPrice = Math.max(...data.map((d) => d.price));
    const priceRange = maxPrice - minPrice || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.price - minPrice) / priceRange) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')} L ${width},${height} L 0,${height} Z`;
  }, [data, width, height]);

  const isPositive = data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const chartColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={areaPath}
        fill={`url(#gradient-${color.replace('#', '')})`}
        stroke="none"
      />

      <path
        d={path}
        fill="none"
        stroke={chartColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 当前价格点 */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={
            height -
            ((data[data.length - 1].price - Math.min(...data.map((d) => d.price))) /
              (Math.max(...data.map((d) => d.price)) - Math.min(...data.map((d) => d.price)) || 1)) *
              height
          }
          r="4"
          fill={chartColor}
          stroke="white"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

// 简化版Sparkline
export function Sparkline({
  data,
  width = 120,
  height = 40,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  const path = useMemo(() => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const isPositive = data.length >= 2 && data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height}>
      <path
        d={path}
        fill="none"
        stroke={isPositive ? '#10b981' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
