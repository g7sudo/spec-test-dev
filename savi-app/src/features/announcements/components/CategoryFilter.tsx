/**
 * CategoryFilter Component
 * 
 * Horizontal scrollable category filter chips for announcements.
 * Allows filtering by announcement category.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import {
  AnnouncementCategory,
  ANNOUNCEMENT_CATEGORIES,
} from '@/services/api/announcements';

interface CategoryFilterProps {
  /** Currently selected category (null for 'All') */
  selectedCategory: AnnouncementCategory | null;
  /** Called when a category is selected */
  onSelectCategory: (category: AnnouncementCategory | null) => void;
  /** Show 'All' option at the start */
  showAllOption?: boolean;
}

/**
 * CategoryFilter - Horizontal category filter chips
 * 
 * Features:
 * - Scrollable horizontal list of category chips
 * - Optional 'All' category to clear filter
 * - Category icons from Ionicons
 * - Highlight selected category
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  showAllOption = true,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('announcements');

  // Handler for category selection
  const handleSelect = useCallback((category: AnnouncementCategory | null) => {
    onSelectCategory(category);
  }, [onSelectCategory]);

  // Render a single chip
  const renderChip = (
    key: string,
    label: string,
    icon: string,
    isSelected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={14}
        color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
      />
      <Text
        variant="bodySmall"
        color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
        weight={isSelected ? 'semiBold' : 'regular'}
        style={styles.chipText}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 'All' chip */}
        {showAllOption && renderChip(
          'all',
          t('categories.all', { defaultValue: 'All' }),
          'apps-outline',
          selectedCategory === null,
          () => handleSelect(null)
        )}

        {/* Category chips */}
        {ANNOUNCEMENT_CATEGORIES.map((category) =>
          renderChip(
            category.value,
            t(`categories.${category.value.toLowerCase()}`, { defaultValue: category.label }),
            category.icon,
            selectedCategory === category.value,
            () => handleSelect(category.value)
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
  },
});

export default CategoryFilter;

