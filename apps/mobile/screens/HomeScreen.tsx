import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import { useWallet } from '../hooks/useWallet';
import { useGenes } from '../hooks/useGenes';
import GeneCard from '../components/GeneCard';

export default function HomeScreen({ navigation }) {
  const { address, connect } = useWallet();
  const { genes, loading, refresh } = useGenes();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (!address) {
    return (
      <View style={styles.container}>
        <Card style={styles.connectCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              欢迎来到 GenLoop
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              连接钱包开始您的修仙之旅
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('WalletConnect')}
              style={styles.button}
            >
              连接钱包
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 用户信息卡片 */}
      <Card style={styles.userCard}>
        <Card.Content>
          <View style={styles.userInfo}>
            <Avatar.Text
              size={64}
              label={address.slice(2, 4).toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.userText}>
              <Text variant="titleLarge">修仙者</Text>
              <Text variant="bodyMedium" style={styles.address}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 推荐基因 */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          热门基因
        </Text>
        
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          genes.slice(0, 5).map((gene) => (
            <GeneCard
              key={gene.id}
              gene={gene}
              onPress={() => navigation.navigate('GeneDetail', { id: gene.id })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  connectCard: {
    margin: 16,
    backgroundColor: '#1e293b',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#94a3b8',
  },
  button: {
    marginTop: 8,
  },
  userCard: {
    margin: 16,
    backgroundColor: '#1e293b',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#3b82f6',
  },
  userText: {
    marginLeft: 16,
  },
  address: {
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    marginBottom: 12,
  },
  loader: {
    marginTop: 20,
  },
});
