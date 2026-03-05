import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useGenes } from '../hooks/useGenes';
import GeneCard from '../components/GeneCard';
import FilterModal from '../components/FilterModal';

export default function MarketScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const { genes, loading, refresh, hasMore, loadMore } = useGenes();

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '出售中' },
    { key: 'rare', label: '稀有' },
    { key: 'legendary', label: '传说' },
  ];

  const filteredGenes = genes.filter((gene) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return gene.isActive;
    if (selectedFilter === 'rare') return gene.rarity >= 4;
    if (selectedFilter === 'legendary') return gene.rarity >= 5;
    return true;
  });

  const renderItem = ({ item }) => (
    <GeneCard
      gene={item}
      onPress={() => navigation.navigate('GeneDetail', { id: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <Searchbar
        placeholder="搜索基因..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        icon="magnify"
      />

      {/* 筛选标签 */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              selected={selectedFilter === item.key}
              onPress={() => setSelectedFilter(item.key)}
              style={styles.chip}
              selectedColor="#3b82f6"
            >
              {item.label}
            </Chip>
          )}
        />
        <Button
          icon="filter-variant"
          onPress={() => setFilterVisible(true)}
          compact
        >
          筛选
        </Button>
      </View>

      {/* 基因列表 */}
      {loading && genes.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={filteredGenes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? <ActivityIndicator style={styles.loader} /> : null
          }
        />
      )}

      {/* 筛选弹窗 */}
      <FilterModal
        visible={filterVisible}
        onDismiss={() => setFilterVisible(false)}
        onApply={(filters) => {
          console.log('Applied filters:', filters);
          setFilterVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchbar: {
    margin: 16,
    backgroundColor: '#1e293b',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#1e293b',
  },
  list: {
    padding: 16,
  },
  loader: {
    marginVertical: 20,
  },
});
