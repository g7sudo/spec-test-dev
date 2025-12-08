import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Avatar, Row } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useAuthStore, TenantMembership } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useTranslation } from 'react-i18next';

type TenantSelectNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'TenantSelect'
>;

export const TenantSelectScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<TenantSelectNavigationProp>();
  const { tenantMemberships } = useAuthStore();
  const { selectTenant } = useTenantStore();

  const handleSelectTenant = (membership: TenantMembership) => {
    selectTenant(
      {
        id: membership.tenantId,
        name: membership.tenantName,
        slug: membership.tenantSlug,
      },
      {
        id: membership.unitId,
        name: membership.unitName,
      }
    );
    // Navigation will be handled by RootNavigator based on tenant state
  };

  const renderTenantItem = ({ item }: { item: TenantMembership }) => (
    <TouchableOpacity
      onPress={() => handleSelectTenant(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.tenantCard}>
        <Row style={styles.tenantRow}>
          <Avatar
            size="large"
            name={item.tenantName}
            style={styles.tenantAvatar}
          />
          <View style={styles.tenantInfo}>
            <Text variant="bodyLarge" weight="semiBold">
              {item.tenantName}
            </Text>
            <Row style={styles.unitRow}>
              <Ionicons
                name="home-outline"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text
                variant="bodySmall"
                color={theme.colors.textSecondary}
                style={styles.unitText}
              >
                {item.unitName}
              </Text>
            </Row>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Text variant="caption" color={theme.colors.primary}>
                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={theme.colors.textSecondary}
          />
        </Row>
      </Card>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="h2" align="center">
        {t('tenant.selectCommunity')}
      </Text>
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.subtitle}
      >
        {t('tenant.selectCommunitySubtitle')}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="business-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.emptyText}
      >
        {t('tenant.noCommunities')}
      </Text>
    </View>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <FlatList
        data={tenantMemberships}
        renderItem={renderTenantItem}
        keyExtractor={(item) => item.tenantId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 8,
  },
  tenantCard: {
    padding: 16,
    marginBottom: 16,
  },
  tenantRow: {
    alignItems: 'center',
  },
  tenantAvatar: {
    marginRight: 16,
  },
  tenantInfo: {
    flex: 1,
  },
  unitRow: {
    marginTop: 4,
    gap: 4,
  },
  unitText: {
    marginLeft: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
  },
});

export default TenantSelectScreen;
