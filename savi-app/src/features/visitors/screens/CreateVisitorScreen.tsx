import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, Button } from '@/shared/components';

type VisitorType = 'guest' | 'delivery' | 'service' | 'cab';

interface VisitorForm {
  name: string;
  phone: string;
  email: string;
  purpose: string;
  visitorType: VisitorType;
  expectedDate: string;
  expectedTime: string;
  vehicleNumber: string;
  vehicleType: string;
  notes: string;
}

const visitorTypes: { key: VisitorType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'guest', label: 'Guest', icon: 'person-outline' },
  { key: 'delivery', label: 'Delivery', icon: 'cube-outline' },
  { key: 'service', label: 'Service', icon: 'construct-outline' },
  { key: 'cab', label: 'Cab/Taxi', icon: 'car-outline' },
];

export const CreateVisitorScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<VisitorForm>({
    name: '',
    phone: '',
    email: '',
    purpose: '',
    visitorType: 'guest',
    expectedDate: '',
    expectedTime: '',
    vehicleNumber: '',
    vehicleType: '',
    notes: '',
  });

  const updateForm = (key: keyof VisitorForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter visitor name');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }
    if (!form.expectedDate.trim()) {
      Alert.alert('Error', 'Please enter expected date');
      return;
    }

    setIsLoading(true);
    try {
      // API call to create visitor
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Visitor pass created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create visitor pass. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      multiline?: boolean;
      required?: boolean;
    }
  ) => (
    <View style={styles.inputContainer}>
      <Row gap={4}>
        <Text variant="body" weight="medium" style={styles.inputLabel}>
          {label}
        </Text>
        {options?.required && (
          <Text variant="body" color={theme.colors.error}>
            *
          </Text>
        )}
      </Row>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={options?.placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 3 : 1}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          },
          options?.multiline && styles.multilineInput,
        ]}
      />
    </View>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Row justify="space-between" align="center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h3" weight="semiBold">
            Add Visitor
          </Text>
          <View style={{ width: 24 }} />
        </Row>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Visitor Type Selection */}
        <Card style={styles.card}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Visitor Type
          </Text>
          <View style={styles.visitorTypeGrid}>
            {visitorTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                onPress={() => updateForm('visitorType', type.key)}
                style={[
                  styles.visitorTypeButton,
                  {
                    backgroundColor:
                      form.visitorType === type.key
                        ? theme.colors.primaryLight
                        : theme.colors.surfaceVariant,
                    borderColor:
                      form.visitorType === type.key
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={
                    form.visitorType === type.key
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  variant="caption"
                  weight={form.visitorType === type.key ? 'semiBold' : 'regular'}
                  color={
                    form.visitorType === type.key
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Basic Information */}
        <Card style={styles.card}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Basic Information
          </Text>
          {renderInput('Visitor Name', form.name, (v) => updateForm('name', v), {
            placeholder: 'Enter visitor name',
            required: true,
          })}
          {renderInput('Phone Number', form.phone, (v) => updateForm('phone', v), {
            placeholder: '+1 234 567 8900',
            keyboardType: 'phone-pad',
            required: true,
          })}
          {renderInput('Email', form.email, (v) => updateForm('email', v), {
            placeholder: 'visitor@email.com',
            keyboardType: 'email-address',
          })}
          {renderInput('Purpose of Visit', form.purpose, (v) => updateForm('purpose', v), {
            placeholder: 'Describe the purpose',
            multiline: true,
          })}
        </Card>

        {/* Visit Schedule */}
        <Card style={styles.card}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Visit Schedule
          </Text>
          {renderInput(
            'Expected Date',
            form.expectedDate,
            (v) => updateForm('expectedDate', v),
            {
              placeholder: 'YYYY-MM-DD',
              required: true,
            }
          )}
          {renderInput(
            'Expected Time',
            form.expectedTime,
            (v) => updateForm('expectedTime', v),
            {
              placeholder: 'HH:MM AM/PM',
            }
          )}
        </Card>

        {/* Vehicle Information */}
        <Card style={styles.card}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Vehicle Information (Optional)
          </Text>
          {renderInput(
            'Vehicle Number',
            form.vehicleNumber,
            (v) => updateForm('vehicleNumber', v),
            {
              placeholder: 'ABC 1234',
            }
          )}
          {renderInput(
            'Vehicle Type',
            form.vehicleType,
            (v) => updateForm('vehicleType', v),
            {
              placeholder: 'Sedan, SUV, Motorcycle, etc.',
            }
          )}
        </Card>

        {/* Additional Notes */}
        <Card style={styles.card}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Additional Notes
          </Text>
          {renderInput('Notes', form.notes, (v) => updateForm('notes', v), {
            placeholder: 'Any additional information',
            multiline: true,
          })}
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title="Create Visitor Pass"
            onPress={handleSubmit}
            variant="primary"
            size="large"
            loading={isLoading}
            fullWidth
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  visitorTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  visitorTypeButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitContainer: {
    marginTop: 8,
  },
});

export default CreateVisitorScreen;
