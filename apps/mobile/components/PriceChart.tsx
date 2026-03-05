import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';

interface PriceChartProps {
  data: { date: string; price: number }[];
}

export default function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无价格数据</Text>
      </View>
    );
  }

  const chartData = {
    labels: data.map((d) => d.date.slice(5)), // MM-DD
    datasets: [
      {
        data: data.map((d) => parseFloat(d.price)),
        color: () => '#3b82f6',
        strokeWidth: 2,
      },
    ],
  };

  const screenWidth = Dimensions.get('window').width - 64;

  return (
    <View>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={200}
        chartConfig={{
          backgroundColor: '#1e293b',
          backgroundGradientFrom: '#1e293b',
          backgroundGradientTo: '#1e293b',
          decimalPlaces: 2,
          color: () => '#94a3b8',
          labelColor: () => '#94a3b8',
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#3b82f6',
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
