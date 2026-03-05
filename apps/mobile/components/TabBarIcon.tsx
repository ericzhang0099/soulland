import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TabBarIconProps {
  route: { name: string };
  focused: boolean;
  color: string;
  size: number;
}

const iconMap: Record<string, string> = {
  Home: 'home',
  Market: 'store',
  Training: 'dumbbell',
  Leaderboard: 'trophy',
  Profile: 'account',
};

export default function TabBarIcon({ route, focused, color, size }: TabBarIconProps) {
  const iconName = iconMap[route.name] || 'help-circle';

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={iconName as any}
        size={size}
        color={color}
      />
      {focused && <View style={styles.indicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
});
