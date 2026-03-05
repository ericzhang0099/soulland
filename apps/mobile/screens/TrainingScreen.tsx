import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, List, Divider } from 'react-native-paper';
import { useWallet } from '../hooks/useWallet';
import { useGenes } from '../hooks/useGenes';

export default function TrainingScreen() {
  const { address } = useWallet();
  const { genes, loading, refresh } = useGenes();

  const myGenes = genes.filter((g) => g.owner === address);

  if (!address) {
    return (
      <View style={styles.container}>
        <Card style={styles.connectCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              训练场
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              连接钱包以开始训练您的基因
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <Text variant="headlineMedium" style={styles.header}>
        训练场
      </Text>

      {/* 我的基因 */}
      <Card style={styles.sectionCard}>
        <Card.Title title="我的基因" />
        <Card.Content>
          {loading ? (
            <ActivityIndicator />
          ) : myGenes.length > 0 ? (
            myGenes.map((gene, index) => (
              <View key={gene.id}>
                <List.Item
                  title={gene.name}
                  description={`等级: ${gene.level || 1}`}
                  right={() => (
                    <Button mode="contained" compact>训练</Button>
                  )}
                />
                {index < myGenes.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>暂无基因</Text>
          )}
        </Card.Content>
      </Card>

      {/* 训练说明 */}
      <Card style={styles.sectionCard}>
        <Card.Title title="训练说明" />
        <Card.Content>
          <List.Item
            title="技能学习"
            description="消耗AGC学习新技能"
            left={(props) => <List.Icon {...props} icon="school" />}
          />
          <Divider />
          <List.Item
            title="基因进化"
            description="提升基因等级和属性"
            left={(props) => <List.Icon {...props} icon="dna" />}
          />
          <Divider />
          <List.Item
            title="获得NFT证书"
            description="进化成功后获得证明"
            left={(props) => <List.Icon {...props} icon="certificate" />}
          />
        </Card.Content>
      </Card>
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
  },
  header: {
    color: '#fff',
    margin: 16,
    marginBottom: 8,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#1e293b',
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: 20,
  },
});
