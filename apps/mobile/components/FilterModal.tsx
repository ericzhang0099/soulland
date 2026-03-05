import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, Chip, Divider } from 'react-native-paper';

interface FilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: any) => void;
}

export default function FilterModal({ visible, onDismiss, onApply }: FilterModalProps) {
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min?: string; max?: string }>({});

  const rarities = [
    { key: 'common', label: '普通', color: '#9ca3af' },
    { key: 'uncommon', label: '优秀', color: '#22c55e' },
    { key: 'rare', label: '稀有', color: '#3b82f6' },
    { key: 'epic', label: '史诗', color: '#a855f7' },
    { key: 'legendary', label: '传说', color: '#fbbf24' },
  ];

  const toggleRarity = (key: string) => {
    setSelectedRarity((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleApply = () => {
    onApply({
      rarities: selectedRarity,
      priceRange,
    });
  };

  const handleReset = () => {
    setSelectedRarity([]);
    setPriceRange({});
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Text variant="titleLarge" style={styles.title}>筛选</Text>

        <Divider style={styles.divider} />

        {/* 稀有度筛选 */}
        <Text variant="titleMedium" style={styles.sectionTitle}>稀有度</Text>
        <View style={styles.chipContainer}>
          {rarities.map((rarity) => (
            <Chip
              key={rarity.key}
              selected={selectedRarity.includes(rarity.key)}
              onPress={() => toggleRarity(rarity.key)}
              style={[
                styles.chip,
                selectedRarity.includes(rarity.key) && {
                  backgroundColor: rarity.color,
                },
              ]}
              textStyle={
                selectedRarity.includes(rarity.key)
                  ? { color: '#fff' }
                  : { color: rarity.color }
              }
            >
              {rarity.label}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* 按钮 */}
        <View style={styles.buttonContainer}>
          <Button onPress={handleReset} style={styles.button}>重置</Button>
          <Button mode="contained" onPress={handleApply} style={styles.button}>
            应用
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  title: {
    color: '#fff',
    marginBottom: 16,
  },
  divider: {
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  sectionTitle: {
    color: '#fff',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#334155',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    minWidth: 80,
  },
});
