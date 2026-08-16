import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { Category } from '../types';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <View style={styles.chipsContainer}>
      <FlatList
        horizontal
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Chip
            selected={selectedCategory === item}
            onPress={() => onSelectCategory(item)}
            style={styles.chip}
            mode={selectedCategory === item ? "flat" : "outlined"}
            showSelectedOverlay
          >
            {item}
          </Chip>
        )}
        contentContainerStyle={styles.chipsContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chipsContainer: {
    paddingVertical: 8,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
});
