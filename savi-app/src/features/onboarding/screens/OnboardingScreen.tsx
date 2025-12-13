import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, Row, Spacer } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

type OnboardingNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export const OnboardingScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      icon: 'home-outline',
      title: t('onboarding.slide1.title'),
      description: t('onboarding.slide1.description'),
    },
    {
      id: '2',
      icon: 'construct-outline',
      title: t('onboarding.slide2.title'),
      description: t('onboarding.slide2.description'),
    },
    {
      id: '3',
      icon: 'calendar-outline',
      title: t('onboarding.slide3.title'),
      description: t('onboarding.slide3.description'),
    },
    {
      id: '4',
      icon: 'people-outline',
      title: t('onboarding.slide4.title'),
      description: t('onboarding.slide4.description'),
    },
  ];

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    navigation.navigate('Consent');
  };

  const handleGetStarted = () => {
    navigation.navigate('Consent');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.primaryLight },
        ]}
      >
        <Ionicons name={item.icon} size={80} color={theme.colors.primary} />
      </View>
      <Text variant="h2" align="center" style={styles.title}>
        {item.title}
      </Text>
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.description}
      >
        {item.description}
      </Text>
    </View>
  );

  const renderPagination = () => (
    <Row style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === currentIndex
                  ? theme.colors.primary
                  : theme.colors.border,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </Row>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Button
          title={t('skip')}
          variant="ghost"
          size="small"
          onPress={handleSkip}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {renderPagination()}

      <View style={styles.footer}>
        {currentIndex === slides.length - 1 ? (
          <>
            <Button
              title={t('onboarding.getStarted')}
              variant="primary"
              size="large"
              fullWidth
              onPress={handleGetStarted}
            />
            <Spacer size={12} />
            <Button
              title={t('joinCommunity', { ns: 'invite' })}
              variant="outline"
              size="large"
              fullWidth
              onPress={() => navigation.navigate('JoinCommunity')}
            />
          </>
        ) : (
          <Button
            title={t('next')}
            variant="primary"
            size="large"
            fullWidth
            onPress={handleNext}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    paddingHorizontal: 16,
  },
  pagination: {
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default OnboardingScreen;
