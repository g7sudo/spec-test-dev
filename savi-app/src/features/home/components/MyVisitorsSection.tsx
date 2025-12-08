import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Text, Card, Row, Avatar, Button } from '@/shared/components';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

interface Visitor {
  id: string;
  name: string;
  flatNumber: string;
  visitDate: string;
  visitTime: string;
  photoUrl?: string;
}

interface MyVisitorsSectionProps {
  visitors: Visitor[];
  onViewAll: () => void;
  onVisitorPress: (visitorId: string) => void;
  onPreRegister: () => void;
  isLoading?: boolean;
}

export const MyVisitorsSection: React.FC<MyVisitorsSectionProps> = ({
  visitors,
  onViewAll,
  onVisitorPress,
  onPreRegister,
  isLoading,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / CARD_WIDTH);
    setCurrentPage(page);
  };

  const renderVisitorCard = (visitor: Visitor) => (
    <TouchableOpacity
      key={visitor.id}
      onPress={() => onVisitorPress(visitor.id)}
      activeOpacity={0.7}
    >
      <Card style={[styles.visitorCard, { width: CARD_WIDTH }] as any}>
        <Row style={styles.cardContent}>
          <View style={styles.visitorInfo}>
            <Text variant="bodyLarge" weight="semiBold" numberOfLines={1}>
              {visitor.name}
            </Text>
            <Text
              variant="bodySmall"
              color={theme.colors.textSecondary}
              style={styles.flatNumber}
            >
              Flat no. {visitor.flatNumber}
            </Text>
            <Text
              variant="caption"
              color={theme.colors.textSecondary}
              style={styles.visitTime}
            >
              {visitor.visitDate}, {visitor.visitTime}
            </Text>
          </View>
          <Avatar
            size="large"
            name={visitor.name}
            imageUrl={visitor.photoUrl}
          />
        </Row>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.emptyText}
      >
        {t('noVisitors', { ns: 'home' })}
      </Text>
      <Button
        title={t('preRegisterVisitor', { ns: 'home' })}
        variant="outline"
        size="small"
        onPress={onPreRegister}
        style={styles.preRegisterButton}
      />
    </View>
  );

  const renderPagination = () => {
    if (visitors.length <= 1) return null;

    return (
      <Row style={styles.pagination}>
        {visitors.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentPage
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
          />
        ))}
      </Row>
    );
  };

  return (
    <View style={styles.container}>
      <Row style={styles.header}>
        <Text variant="bodyLarge" weight="semiBold">
          {t('myVisitors', { ns: 'home' })}
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text variant="bodySmall" color={theme.colors.primary}>
            {t('viewAll')}
          </Text>
        </TouchableOpacity>
      </Row>

      {visitors.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 16}
          >
            {visitors.map(renderVisitorCard)}
          </ScrollView>
          {renderPagination()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  visitorCard: {
    padding: 16,
  },
  cardContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitorInfo: {
    flex: 1,
    marginRight: 16,
  },
  flatNumber: {
    marginTop: 4,
  },
  visitTime: {
    marginTop: 4,
  },
  pagination: {
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 12,
  },
  preRegisterButton: {
    marginTop: 8,
  },
});

export default MyVisitorsSection;
