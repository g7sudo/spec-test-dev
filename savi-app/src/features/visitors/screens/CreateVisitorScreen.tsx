/**
 * CreateVisitorScreen
 * 
 * Simple, clean screen for creating a new visitor pass.
 * Step-by-step form: Visitor Type → Name → Date/Time → Optional fields
 * 
 * Uses @react-native-community/datetimepicker (Expo compatible).
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/core/theme';
import { Screen, Text, Row, Button } from '@/shared/components';
import { createVisitorPass, VisitorType, CreateVisitorPassRequest } from '@/services/api/visitors';
import { queryKeys } from '@/services/api/queryClient';
import { useTenantStore } from '@/state/tenantStore';

interface VisitorForm {
  visitorName: string;
  visitorPhone: string;
  visitType: VisitorType | null; // Null means not selected yet
  expectedDateTime: Date | null; // Null means not selected yet
  vehicleNumber: string;
  vehicleType: string;
  deliveryProvider: string;
  showVehicleInfo: boolean;
  showOptionalFields: boolean;
  notifyVisitorAtGate: boolean;
}

const visitorTypes: { key: VisitorType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: VisitorType.Guest, label: 'Guest', icon: 'person-outline' },
  { key: VisitorType.Delivery, label: 'Delivery', icon: 'cube-outline' },
  { key: VisitorType.Service, label: 'Service', icon: 'construct-outline' },
  { key: VisitorType.Other, label: 'Other', icon: 'ellipse-outline' },
];

export const CreateVisitorScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { currentUnit } = useTenantStore();

  // Get initial date/time for picker (1 hour from now, rounded to nearest 15 min)
  const getInitialPickerDateTime = (): Date => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    // Round to nearest 15 minutes
    const minutes = Math.ceil(oneHourLater.getMinutes() / 15) * 15;
    oneHourLater.setMinutes(minutes % 60);
    if (minutes >= 60) {
      oneHourLater.setHours(oneHourLater.getHours() + 1);
    }
    oneHourLater.setSeconds(0, 0);
    return oneHourLater;
  };

  // Initialize form with empty/null values - user must select all required fields
  const [form, setForm] = useState<VisitorForm>({
    visitorName: '',
    visitorPhone: '',
    visitType: null, // No pre-selection
    expectedDateTime: null, // No pre-filled date/time
    vehicleNumber: '',
    vehicleType: '',
    deliveryProvider: '',
    showVehicleInfo: false,
    showOptionalFields: false,
    notifyVisitorAtGate: true,
  });

  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(getInitialPickerDateTime()); // For iOS modal

  /**
   * Check if form is valid (all required fields filled)
   * Required: visitType, visitorName, expectedDateTime
   */
  const isFormValid = (): boolean => {
    const hasVisitorType = form.visitType !== null;
    const hasVisitorName = form.visitorName.trim().length > 0;
    const hasDateTime = form.expectedDateTime !== null;
    const hasUnit = !!currentUnit?.id;
    
    return hasVisitorType && hasVisitorName && hasDateTime && hasUnit;
  };

  /**
   * Update form field
   */
  const updateForm = (key: keyof VisitorForm, value: string | boolean | Date) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Format date for display (e.g., "Today", "Tomorrow", or "Wed, Dec 11")
   */
  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return 'Select Date';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Format time for display (e.g., "3:30 PM")
   */
  const formatDisplayTime = (date: Date | null): string => {
    if (!date) return 'Select Time';
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Handle date change
   */
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        // Use existing time or default
        const baseDateTime = form.expectedDateTime || getInitialPickerDateTime();
        const newDateTime = new Date(baseDateTime);
        newDateTime.setFullYear(selectedDate.getFullYear());
        newDateTime.setMonth(selectedDate.getMonth());
        newDateTime.setDate(selectedDate.getDate());
        updateForm('expectedDateTime', newDateTime);
      }
    } else {
      // iOS - update temp date
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  /**
   * Handle time change
   */
  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selectedTime) {
        // Use existing date or default
        const baseDateTime = form.expectedDateTime || getInitialPickerDateTime();
        const newDateTime = new Date(baseDateTime);
        newDateTime.setHours(selectedTime.getHours());
        newDateTime.setMinutes(selectedTime.getMinutes());
        updateForm('expectedDateTime', newDateTime);
      }
    } else {
      // iOS - update temp date
      if (selectedTime) {
        setTempDate(selectedTime);
      }
    }
  };

  /**
   * Confirm iOS date picker selection
   */
  const confirmDateSelection = () => {
    // Use existing time or default
    const baseDateTime = form.expectedDateTime || getInitialPickerDateTime();
    const newDateTime = new Date(baseDateTime);
    newDateTime.setFullYear(tempDate.getFullYear());
    newDateTime.setMonth(tempDate.getMonth());
    newDateTime.setDate(tempDate.getDate());
    updateForm('expectedDateTime', newDateTime);
    setShowDatePicker(false);
  };

  /**
   * Confirm iOS time picker selection
   */
  const confirmTimeSelection = () => {
    // Use existing date or default
    const baseDateTime = form.expectedDateTime || getInitialPickerDateTime();
    const newDateTime = new Date(baseDateTime);
    newDateTime.setHours(tempDate.getHours());
    newDateTime.setMinutes(tempDate.getMinutes());
    updateForm('expectedDateTime', newDateTime);
    setShowTimePicker(false);
  };

  /**
   * Open date picker
   */
  const openDatePicker = () => {
    // Use existing date or default for picker initial value
    setTempDate(form.expectedDateTime || getInitialPickerDateTime());
    setShowDatePicker(true);
  };

  /**
   * Open time picker
   */
  const openTimePicker = () => {
    // Use existing time or default for picker initial value
    setTempDate(form.expectedDateTime || getInitialPickerDateTime());
    setShowTimePicker(true);
  };

  /**
   * Create visitor pass mutation
   */
  const createMutation = useMutation({
    mutationFn: (request: CreateVisitorPassRequest) => createVisitorPass(request),
    onSuccess: (data) => {
      // Invalidate visitor passes queries to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all });
      
      // Show success message with access code
      Alert.alert(
        'Visitor Pass Created',
        `Visitor pass created successfully!\n\nAccess Code: ${data.accessCode}\n\nShare this code with your visitor.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    },
    onError: (error: any) => {
      console.error('[CreateVisitorScreen] ❌ Create visitor pass error:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to create visitor pass. Please try again.'
      );
    },
  });

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validate visitor type is selected
    if (!form.visitType) {
      Alert.alert('Error', 'Please select a visitor type');
      return;
    }

    // Validate visitor name is filled
    if (!form.visitorName.trim()) {
      Alert.alert('Error', 'Please enter visitor name');
      return;
    }

    // Validate date/time is selected
    if (!form.expectedDateTime) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    // Validate that selected date/time is not in the past
    const now = new Date();
    if (form.expectedDateTime < now) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    // Check if unit is selected
    if (!currentUnit?.id) {
      Alert.alert('Error', 'No unit selected. Please select a unit first.');
      return;
    }

    try {
      // Convert Date object to ISO string
      const expectedFrom = form.expectedDateTime.toISOString();
      
      // Set expectedTo to 2 hours after expectedFrom (default duration)
      const expectedTo = new Date(form.expectedDateTime.getTime() + 2 * 60 * 60 * 1000).toISOString();

      // Build request payload
      const request: CreateVisitorPassRequest = {
        unitId: currentUnit.id,
        visitorName: form.visitorName.trim(),
        visitType: form.visitType,
        visitorPhone: form.visitorPhone.trim() || null,
        vehicleNumber: form.showVehicleInfo && form.vehicleNumber.trim() ? form.vehicleNumber.trim() : null,
        vehicleType: form.showVehicleInfo && form.vehicleType.trim() ? form.vehicleType.trim() : null,
        deliveryProvider: form.deliveryProvider.trim() || null,
        notes: null,
        expectedFrom,
        expectedTo,
        notifyVisitorAtGate: form.notifyVisitorAtGate,
      };

      // Submit mutation
      createMutation.mutate(request);
    } catch (error: any) {
      console.error('[CreateVisitorScreen] ❌ Form validation error:', error);
      Alert.alert('Error', error.message || 'Invalid date or time format');
    }
  };

  return (
    <Screen safeArea style={styles.screen}>
      {/* Header */}
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
        {/* Step 1: Visitor Type */}
        <View style={styles.section}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionLabel}>
            Visitor Type
          </Text>
          <View style={styles.visitorTypeGrid}>
            {visitorTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                onPress={() => updateForm('visitType', type.key)}
                style={[
                  styles.visitorTypeButton,
                  {
                    backgroundColor:
                      form.visitType === type.key
                        ? theme.colors.primaryLight
                        : theme.colors.surfaceVariant,
                    borderColor:
                      form.visitType === type.key
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={type.icon}
                  size={20}
                  color={
                    form.visitType === type.key
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  variant="caption"
                  weight={form.visitType === type.key ? 'semiBold' : 'regular'}
                  color={
                    form.visitType === type.key
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 2: Visitor Name */}
        <View style={styles.section}>
          <Row gap={4} align="center" style={styles.inputLabelRow}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionLabel}>
              Visitor Name
            </Text>
            <Text variant="body" color={theme.colors.error}>
              *
            </Text>
          </Row>
          <TextInput
            value={form.visitorName}
            onChangeText={(v) => updateForm('visitorName', v)}
            placeholder="Enter visitor name"
            placeholderTextColor={theme.colors.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
          />
        </View>

        {/* Step 3: Date & Time - Tap to open picker */}
        <View style={styles.section}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionLabel}>
            Expected Date & Time
          </Text>
          
          {/* Date and Time Buttons */}
          <Row gap={12}>
            {/* Date Button */}
            <TouchableOpacity
              onPress={openDatePicker}
              style={[
                styles.dateTimeCard,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={22} color={theme.colors.primary} />
              <View style={styles.dateTimeCardContent}>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Date
                </Text>
                <Text variant="body" weight="semiBold" color={theme.colors.text}>
                  {formatDisplayDate(form.expectedDateTime)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Time Button */}
            <TouchableOpacity
              onPress={openTimePicker}
              style={[
                styles.dateTimeCard,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={22} color={theme.colors.primary} />
              <View style={styles.dateTimeCardContent}>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Time
                </Text>
                <Text variant="body" weight="semiBold" color={theme.colors.text}>
                  {formatDisplayTime(form.expectedDateTime)}
                </Text>
              </View>
            </TouchableOpacity>
          </Row>

          {/* Date Picker - Android shows directly, iOS uses Modal */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={form.expectedDateTime}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Time Picker - Android shows directly, iOS uses Modal */}
          {showTimePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={form.expectedDateTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              minuteInterval={15}
            />
          )}

          {/* iOS Date Picker Modal */}
          {Platform.OS === 'ios' && (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text variant="body" color={theme.colors.error}>Cancel</Text>
                    </TouchableOpacity>
                    <Text variant="body" weight="semiBold">Select Date</Text>
                    <TouchableOpacity onPress={confirmDateSelection}>
                      <Text variant="body" weight="semiBold" color={theme.colors.primary}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    style={styles.iosPicker}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* iOS Time Picker Modal */}
          {Platform.OS === 'ios' && (
            <Modal
              visible={showTimePicker}
              transparent
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text variant="body" color={theme.colors.error}>Cancel</Text>
                    </TouchableOpacity>
                    <Text variant="body" weight="semiBold">Select Time</Text>
                    <TouchableOpacity onPress={confirmTimeSelection}>
                      <Text variant="body" weight="semiBold" color={theme.colors.primary}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    minuteInterval={15}
                    style={styles.iosPicker}
                  />
                </View>
              </View>
            </Modal>
          )}
        </View>

        {/* Optional Fields Toggle */}
        {!form.showOptionalFields && (
          <TouchableOpacity
            onPress={() => updateForm('showOptionalFields', true)}
            style={styles.optionalToggle}
          >
            <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
            <Text variant="body" color={theme.colors.primary} weight="medium">
              Add Optional Information
            </Text>
          </TouchableOpacity>
        )}

        {/* Optional Fields */}
        {form.showOptionalFields && (
          <View style={styles.optionalSection}>
            {/* Phone Number */}
            <View style={styles.section}>
              <Text variant="body" weight="medium" style={styles.optionalLabel}>
                Phone Number (Optional)
              </Text>
              <TextInput
                value={form.visitorPhone}
                onChangeText={(v) => updateForm('visitorPhone', v)}
                placeholder="+1 234 567 8900"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            </View>

            {/* Delivery Provider (if Delivery type) */}
            {form.visitType === VisitorType.Delivery && (
              <View style={styles.section}>
                <Text variant="body" weight="medium" style={styles.optionalLabel}>
                  Delivery Provider (Optional)
                </Text>
                <TextInput
                  value={form.deliveryProvider}
                  onChangeText={(v) => updateForm('deliveryProvider', v)}
                  placeholder="e.g., Amazon, FedEx, UPS"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                />
              </View>
            )}

            {/* Vehicle Information Toggle */}
            <View style={styles.section}>
              <TouchableOpacity
                onPress={() => updateForm('showVehicleInfo', !form.showVehicleInfo)}
                style={styles.vehicleToggle}
              >
                <Row gap={8} align="center">
                  <Ionicons
                    name={form.showVehicleInfo ? 'car' : 'car-outline'}
                    size={20}
                    color={form.showVehicleInfo ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text
                    variant="body"
                    weight={form.showVehicleInfo ? 'semiBold' : 'regular'}
                    color={form.showVehicleInfo ? theme.colors.primary : theme.colors.textSecondary}
                  >
                    {form.showVehicleInfo ? 'Vehicle Information Added' : 'Add Vehicle Information'}
                  </Text>
                </Row>
              </TouchableOpacity>

              {form.showVehicleInfo && (
                <View style={styles.vehicleFields}>
                  <TextInput
                    value={form.vehicleNumber}
                    onChangeText={(v) => updateForm('vehicleNumber', v)}
                    placeholder="Vehicle Number (e.g., ABC 1234)"
                    placeholderTextColor={theme.colors.textTertiary}
                    style={[
                      styles.input,
                      { marginBottom: 12 },
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  />
                  <TextInput
                    value={form.vehicleType}
                    onChangeText={(v) => updateForm('vehicleType', v)}
                    placeholder="Vehicle Type (e.g., Sedan, SUV)"
                    placeholderTextColor={theme.colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* Hide Optional Fields */}
            <TouchableOpacity
              onPress={() => updateForm('showOptionalFields', false)}
              style={styles.hideOptional}
            >
              <Text variant="body" color={theme.colors.textSecondary}>
                Hide Optional Information
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sticky Submit Button at Bottom */}
      <View style={[styles.stickyFooter, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Button
          title="Create Visitor Pass"
          onPress={handleSubmit}
          variant="primary"
          size="large"
          loading={createMutation.isPending}
          fullWidth
          disabled={!isFormValid()}
        />
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20, // Less padding since button is now sticky
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  inputLabelRow: {
    marginBottom: 8,
  },
  optionalLabel: {
    marginBottom: 8,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  visitorTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  visitorTypeButton: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  dateTimeCardContent: {
    flex: 1,
    gap: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  iosPicker: {
    height: 200,
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionalSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  vehicleToggle: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  vehicleFields: {
    marginTop: 12,
    paddingLeft: 8,
  },
  hideOptional: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  stickyFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});

export default CreateVisitorScreen;
