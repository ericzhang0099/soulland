import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface GeneCardProps {
  gene: {
    id: string;
    name: string;
    description: string;
    price: string;
    rarity: number;
    image?: string;
  };
  onPress: () => void;
}

export default function GeneCard({ gene, onPress }: GeneCardProps) {
  const rarityColors = ['#9ca3af', '#22c55e', '#3b82f6', '#a855f7', '#fbbf24'];

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.name}>
              {gene.name}
            </Text>
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: rarityColors[gene.rarity - 1] || rarityColors[0] },
              ]}
            >
              <Text style={styles.rarityText}>{'★'.repeat(gene.rarity)}</Text>
            </View>
          </View>

          <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
            {gene.description}
          </Text>

          <Text variant="titleSmall" style={styles.price}>
            {gene.price} AGC
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    color: '#fff',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 12,
  },
  description: {
    color: '#94a3b8',
    marginBottom: 8,
  },
  price: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
});
