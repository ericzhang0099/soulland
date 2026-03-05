import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, List, Avatar, Divider, Portal, Dialog } from 'react-native-paper';
import { useWallet } from '../hooks/useWallet';
import { useUserIdentity } from '../hooks/useUserIdentity';

export default function ProfileScreen({ navigation }) {
  const { address, disconnect } = useWallet();
  const { identity, balance } = useUserIdentity(address);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  if (!address) {
    return (
      <View style={styles.container}>
        <Card style={styles.connectCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              未连接钱包
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

  const menuItems = [
    { icon: 'dna', title: '我的基因', subtitle: '查看和管理', onPress: () => {} },
    { icon: 'trophy', title: '我的成就', subtitle: '修仙等级', onPress: () => {} },
    { icon: 'swap-horizontal', title: '交易记录', subtitle: '历史交易', onPress: () => {} },
    { icon: 'cog', title: '设置', subtitle: '应用设置', onPress: () => {} },
    { icon: 'help-circle', title: '帮助', subtitle: '使用指南', onPress: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息卡片 */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={80}
              label={address.slice(2, 4).toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {identity?.name || '修仙者'}
              </Text>
              <Text style={styles.address}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </Text>
              <Text style={styles.balance}>
                {balance} AGC
              </Text>
            </View>
          </View>

          {identity?.level && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>
                等级: {identity.level}
              </Text>
              <Text style={styles.contributionText}>
                贡献: {identity.contribution}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 菜单列表 */}
      <Card style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <View key={item.title}>
            <List.Item
              title={item.title}
              description={item.subtitle}
              left={(props) => <List.Icon {...props} icon={item.icon} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={item.onPress}
              titleStyle={styles.menuTitle}
              descriptionStyle={styles.menuDescription}
            />
            {index < menuItems.length - 1 && <Divider />}
          </View>
        ))}
      </Card>

      {/* 退出按钮 */}
      <Button
        mode="outlined"
        onPress={() => setLogoutDialogVisible(true)}
        style={styles.logoutButton}
        textColor="#ef4444"
      >
        断开连接
      </Button>

      {/* 退出确认弹窗 */}
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Title>确认退出</Dialog.Title>
          <Dialog.Content>
            <Text>确定要断开钱包连接吗？</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>取消</Button>
            <Button
              onPress={() => {
                disconnect();
                setLogoutDialogVisible(false);
              }}
              textColor="#ef4444"
            >
              确认
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
  connectCard: {
    margin: 16,
    backgroundColor: '#1e293b',
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  profileCard: {
    margin: 16,
    backgroundColor: '#1e293b',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#3b82f6',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    color: '#fff',
  },
  address: {
    color: '#94a3b8',
    marginTop: 4,
  },
  balance: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  levelText: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  contributionText: {
    color: '#94a3b8',
  },
  menuCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#1e293b',
  },
  menuTitle: {
    color: '#fff',
  },
  menuDescription: {
    color: '#94a3b8',
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
    borderColor: '#ef4444',
  },
});
