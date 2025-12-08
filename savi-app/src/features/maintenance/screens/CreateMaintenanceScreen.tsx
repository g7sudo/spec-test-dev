import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput, Card, Row } from '@/shared/components';
import { useTranslation } from 'react-i18next';

const categories = [
  { id: 'plumber', name: 'Plumber', icon: 'water-outline' as const },
  { id: 'electrician', name: 'Electrician', icon: 'flash-outline' as const },
  { id: 'ac', name: 'AC Tech', icon: 'snow-outline' as const },
  { id: 'carpenter', name: 'Carpenter', icon: 'hammer-outline' as const },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles-outline' as const },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline' as const },
];

export const CreateMaintenanceScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = title.length > 0 && description.length > 0 && selectedCategory;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    navigation.goBack();
  };

  return (
    <Screen safeArea style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          Category
        </Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory === category.id && {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primaryLight,
                },
              ]}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor:
                      selectedCategory === category.id
                        ? theme.colors.primary
                        : theme.colors.backgroundSecondary,
                  },
                ]}
              >
                <Ionicons
                  name={category.icon}
                  size={24}
                  color={
                    selectedCategory === category.id
                      ? '#FFFFFF'
                      : theme.colors.textSecondary
                  }
                />
              </View>
              <Text
                variant="caption"
                align="center"
                color={
                  selectedCategory === category.id
                    ? theme.colors.primary
                    : theme.colors.text
                }
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          label="Title"
          placeholder="Brief description of the issue"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <TextInput
          label="Description"
          placeholder="Provide detailed information about the issue"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <Card style={styles.noteCard}>
          <Row style={styles.noteRow}>
            <Ionicons
              name="information-circle"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              variant="bodySmall"
              color={theme.colors.textSecondary}
              style={styles.noteText}
            >
              Your request will be reviewed and a technician will be assigned within 24 hours.
            </Text>
          </Row>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Submit Request"
          variant="primary"
          size="large"
          fullWidth
          loading={isLoading}
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  categoryItem: {
    width: '30%',
    marginHorizontal: '1.5%',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  noteCard: {
    padding: 12,
    backgroundColor: '#F0F7FF',
    marginTop: 8,
  },
  noteRow: {
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
});

export default CreateMaintenanceScreen;
