import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { Text, Button, Row } from '@/shared/components';
import { useTranslation } from 'react-i18next';

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
}

interface BillDrawerProps {
  bill: Bill | null;
  onPayNow: (billId: string) => void;
}

export const BillDrawer: React.FC<BillDrawerProps> = ({ bill, onPayNow }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');
  const [isDismissed, setIsDismissed] = useState(false);

  if (!bill || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handlePayNow = () => {
    onPayNow(bill.id);
  };

  return (
    <LinearGradient
      colors={['#FFF3CD', '#FFE69C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color="#856404" />
      </TouchableOpacity>

      <Row style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="flash" size={24} color="#856404" />
        </View>

        <View style={styles.textContainer}>
          <Row style={styles.titleRow}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.title}>
              {bill.title}
            </Text>
            <Text variant="bodySmall" style={styles.dueDate}>
              Due date {bill.dueDate}
            </Text>
          </Row>
          <Text variant="bodySmall" style={styles.warning}>
            {t('billWarning')}
          </Text>
        </View>
      </Row>

      <Button
        title={t('payNow')}
        variant="primary"
        size="small"
        onPress={handlePayNow}
        style={styles.payButton}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
  },
  contentRow: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(133, 100, 4, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 24,
  },
  titleRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#856404',
  },
  dueDate: {
    color: '#856404',
  },
  warning: {
    color: '#856404',
  },
  payButton: {
    alignSelf: 'flex-start',
  },
});

export default BillDrawer;
