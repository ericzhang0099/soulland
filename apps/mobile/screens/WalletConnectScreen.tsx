import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useWallet } from '../hooks/useWallet';

export default function WalletConnectScreen({ navigation }) {
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { connect } = useWallet();

  const handleConnect = async () => {
    if (!privateKey.trim()) {
      setError('请输入私钥');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await connect(privateKey.trim());
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || '连接失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            连接钱包
          </Text>

          <Text variant="bodyMedium" style={styles.description}>
            请输入您的以太坊私钥以连接钱包。私钥仅存储在本地，不会上传到服务器。
          </Text>

          <TextInput
            label="私钥"
            value={privateKey}
            onChangeText={setPrivateKey}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            placeholder="0x..."
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleConnect}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            连接
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            取消
          </Button>

          <Text variant="bodySmall" style={styles.warning}>
            警告：请确保您的私钥安全，不要分享给任何人。
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#334155',
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
  warning: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
  },
});
