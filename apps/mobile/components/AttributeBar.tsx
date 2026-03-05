import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';

interface AttributeBarProps {
  label: string;
  value: number;
  max?: number;
}

export default function AttributeBar({ label, value, max = 100 }: AttributeBarProps) {
  const progress = Math.min(value / max, 1);

  const getColor = (val: number) => {
    if (val >= 80) return '#22c55e';
    if (val >= 60) return '#3b82f6';
    if (val >= 40) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <ProgressBar
        progress={progress}
        color={getColor(value)}
        style={styles.progress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
});
