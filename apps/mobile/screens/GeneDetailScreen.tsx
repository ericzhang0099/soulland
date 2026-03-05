import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider, Portal, Dialog } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { useGene } from '../hooks/useGene';
import { useWallet } from '../hooks/useWallet';
import PriceChart from '../components/PriceChart';
import AttributeBar from '../components/AttributeBar';

export default function GeneDetailScreen({ navigation }) {
  const route = useRoute();
  const { id } = route.params as { id: string };
  const { gene, loading } = useGene(id);
  const { address } = useWallet();
  const [buyDialogVisible, setBuyDialogVisible] = useState(false);

  if (loading || !gene) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const isOwner = gene.owner === address;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `看看这个神奇的基因：${gene.name} - ${gene.description}`,
        url: `https://genloop.app/gene/${id}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 基因头部信息 */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Image
              size={80}
              source={{ uri: gene.image }}
              style={styles.avatar}
            />
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {gene.name}
              </Text>
              <Text variant="bodyMedium" style={styles.rarity}>
                稀有度: {'★'.repeat(gene.rarity)}
              </Text>
              <Text variant="titleMedium" style={styles.price}>
                {gene.price} AGC
              </Text>
            </View>
          </View>

          <Text variant="bodyMedium" style={styles.description}>
            {gene.description}
          </Text>

          <View style={styles.actions}>
            <Button
              icon="share-variant"
              mode="outlined"
              onPress={handleShare}
              style={styles.actionButton}
            >
              分享
            </Button>
            
            {!isOwner && gene.isActive && (
              <Button
                mode="contained"
                onPress={() => setBuyDialogVisible(true)}
                style={styles.actionButton}
              >
                购买
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* 属性 */}
      <Card style={styles.sectionCard}>
        <Card.Title title="基因属性" />
        <Card.Content>
          {Object.entries(gene.attributes).map(([key, value]) => (
            <AttributeBar
              key={key}
              label={key}
              value={value}
              max={100}
            />
          ))}
        </Card.Content>
      </Card>

      {/* 价格历史 */}
      <Card style={styles.sectionCard}>
        <Card.Title title="价格历史" />
        <Card.Content>
          <PriceChart data={gene.priceHistory} />
        </Card.Content>
      </Card>

      {/* 交易历史 */}
      <Card style={styles.sectionCard}>
        <Card.Title title="交易历史" />
        <Card.Content>
          {gene.transactions?.map((tx, index) => (
            <View key={index}>
              <List.Item
                title={`${tx.price} AGC`}
                description={`${tx.from.slice(0, 6)}... → ${tx.to.slice(0, 6)}...`}
                left={(props) => <List.Icon {...props} icon="swap-horizontal" />}
              />
              {index < gene.transactions.length - 1 && <Divider />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* 购买确认弹窗 */}
      <Portal>
        <Dialog
          visible={buyDialogVisible}
          onDismiss={() => setBuyDialogVisible(false)}
        >
          <Dialog.Title>确认购买</Dialog.Title>
          <Dialog.Content>
            <Text>确定要购买 {gene.name} 吗？</Text>
            <Text style={styles.dialogPrice}>价格: {gene.price} AGC</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBuyDialogVisible(false)}>取消</Button>
            <Button onPress={() => {
              // 执行购买
              setBuyDialogVisible(false);
            }}>
              确认购买
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerCard: {
    margin: 16,
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#3b82f6',
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    color: '#fff',
    marginBottom: 4,
  },
  rarity: {
    color: '#fbbf24',
    marginBottom: 4,
  },
  price: {
    color: '#3b82f6',
  },
  description: {
    color: '#94a3b8',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#1e293b',
  },
  dialogPrice: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});
