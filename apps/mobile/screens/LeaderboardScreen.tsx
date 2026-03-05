import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator } from 'react-native-paper';
import { useLeaderboard } from '../hooks/useLeaderboard';

const levelColors: Record<number, string> = {
  1: '#fbbf24', // 道祖 - 金
  2: '#a855f7', // 大罗 - 紫
  3: '#3b82f6', // 太乙 - 蓝
  4: '#22c55e', // 金仙 - 绿
  5: '#14b8a6', // 真仙 - 青
  6: '#f97316', // 大乘 - 橙
  7: '#ec4899', // 合体 - 粉
  8: '#6366f1', // 炼虚 - 靛
  9: '#9ca3af', // 化神 - 灰
};

const levelNames = ['None', '道祖', '大罗', '太乙', '金仙', '真仙', '大乘', '合体', '炼虚', '化神'];

export default function LeaderboardScreen() {
  const { leaderboard, loading } = useLeaderboard();

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.row}>
        {/* 排名 */}
        <View style={styles.rank}>
          {index < 3 ? (
            <Text style={[styles.medal, { color: index === 0 ? '#fbbf24' : index === 1 ? '#c0c0c0' : '#cd7f32' }]>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </Text>
          ) : (
            <Text style={styles.rankNumber}>#{index + 1}</Text>
          )}
        </View>

        {/* 头像 */}
        <Avatar.Text
          size={48}
          label={item.name?.slice(0, 2) || '??'}
          style={[styles.avatar, { backgroundColor: levelColors[item.level] }]}
        />

        {/* 信息 */}
        <View style={styles.info}>
          <Text style={styles.name}>{item.name || '匿名用户'}</Text>
          <Text style={styles.address}>
            {item.address?.slice(0, 6)}...{item.address?.slice(-4)}
          </Text>
        </View>

        {/* 等级和贡献 */}
        <View style={styles.stats}>
          <Text style={[styles.level, { color: levelColors[item.level] }]>
            {levelNames[item.level]}
          </Text>
          <Text style={styles.contribution}>
            {item.contribution?.toLocaleString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        修仙排行榜
      </Text>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.address}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  title: {
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 8,
    backgroundColor: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 50,
    alignItems: 'center',
  },
  medal: {
    fontSize: 24,
  },
  rankNumber: {
    color: '#94a3b8',
    fontSize: 16,
  },
  avatar: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  address: {
    color: '#94a3b8',
    fontSize: 12,
  },
  stats: {
    alignItems: 'flex-end',
  },
  level: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  contribution: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
});
