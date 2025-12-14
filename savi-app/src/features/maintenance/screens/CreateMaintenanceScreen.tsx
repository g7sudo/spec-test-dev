/**
 * CreateMaintenanceScreen
 * 
 * Form for creating a new maintenance request with optional attachments.
 * Uses image picker for adding photos and supports multipart form upload.
 * 
 * Features:
 * - Category selection (grid layout)
 * - Title and description input
 * - Priority selection
 * - Photo attachments (up to 5 images)
 * - Form validation
 * - Multipart form submission
 */

import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput, Card, Row } from '@/shared/components';
import { useCreateMaintenanceRequest } from '../hooks';
import {
  MaintenanceCategoryCode,
  MaintenancePriority,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MaintenanceAttachment,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_MB = 10;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CreateMaintenanceScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('maintenance');
  const navigation = useNavigation();

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<MaintenanceCategoryCode | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>(MaintenancePriority.Normal);
  const [attachments, setAttachments] = useState<MaintenanceAttachment[]>([]);

  // Create mutation
  const createMutation = useCreateMaintenanceRequest();

  // Check if form is valid
  const isFormValid = 
    selectedCategory !== null && 
    title.trim().length > 0;

  /**
   * Request camera/gallery permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    // Request camera permission
    const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
    const libraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraResult.status !== 'granted' || libraryResult.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to add photos.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  };

  /**
   * Handle adding a photo attachment
   * Shows action sheet to choose camera or gallery
   */
  const handleAddPhoto = useCallback(async () => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      Alert.alert('Limit Reached', `You can add up to ${MAX_ATTACHMENTS} photos.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Add Photo',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImage('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [attachments.length]);

  /**
   * Pick image from camera or library
   */
  const pickImage = async (source: 'camera' | 'library') => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Compress to reduce upload size
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Create attachment object
        const newAttachment: MaintenanceAttachment = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      }
    } catch (error) {
      console.error('[CreateMaintenanceScreen] ❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  /**
   * Remove an attachment
   */
  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!isFormValid || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate title length
    if (title.trim().length > 200) {
      Alert.alert('Error', 'Title must be 200 characters or less');
      return;
    }

    createMutation.mutate(
      {
        categoryCode: selectedCategory,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        attachments: attachments.map((a) => ({
          uri: a.uri,
          type: a.type,
          name: a.name,
        })),
      },
      {
        onSuccess: (data) => {
          Alert.alert(
            'Success',
            `Your maintenance request has been submitted!\n\nTicket: ${data.ticketNumber}`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        },
        onError: (error: any) => {
          console.error('[CreateMaintenanceScreen] ❌ Submit error:', error);
          Alert.alert(
            'Error',
            error?.message || 'Failed to submit request. Please try again.'
          );
        },
      }
    );
  }, [isFormValid, selectedCategory, title, description, priority, attachments, createMutation, navigation]);

  // Render attachment preview
  const renderAttachment = (attachment: MaintenanceAttachment) => (
    <View key={attachment.id} style={styles.attachmentItem}>
      <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
      <TouchableOpacity
        style={styles.removeAttachmentButton}
        onPress={() => handleRemoveAttachment(attachment.id)}
      >
        <Ionicons name="close-circle" size={24} color="#DC3545" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen safeArea style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Row justify="space-between" align="center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h3" weight="semiBold">
            {t('create.screenTitle')}
          </Text>
          <View style={{ width: 24 }} />
        </Row>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category Selection */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          {t('create.category')} <Text color={theme.colors.error}>*</Text>
        </Text>
        <View style={styles.categoriesGrid}>
          {MAINTENANCE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.code}
              style={[
                styles.categoryItem,
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                },
                selectedCategory === category.code && {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primaryLight,
                },
              ]}
              onPress={() => setSelectedCategory(category.code)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor:
                      selectedCategory === category.code
                        ? theme.colors.primary
                        : theme.colors.backgroundSecondary,
                  },
                ]}
              >
                <Ionicons
                  name={category.icon}
                  size={24}
                  color={
                    selectedCategory === category.code
                      ? '#FFFFFF'
                      : theme.colors.textSecondary
                  }

                />
              </View>
              <Text
                variant="caption"
                align="center"
                color={
                  selectedCategory === category.code
                    ? theme.colors.primary
                    : theme.colors.text
                }

                weight={selectedCategory === category.code ? 'semiBold' : 'regular'}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title Input */}
        <TextInput
          label={`${t('create.title')} *`}
          placeholder="Brief description of the issue"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          maxLength={200}
        />

        {/* Description Input */}
        <TextInput
          label={t('create.description')}
          placeholder={t('create.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        {/* Priority Selection */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          {t('create.priority')}
        </Text>
        <View style={styles.priorityContainer}>
          {MAINTENANCE_PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.priorityButton,
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                },
                priority === p.value && {
                  borderColor: p.color,
                  backgroundColor: `${p.color}20`, // 20% opacity
                },
              ]}
              onPress={() => setPriority(p.value)}
            >
              <View 
                style={[
                  styles.priorityDot, 
                  { backgroundColor: p.color }
                ]} 
              />
              <Text
                variant="bodySmall"
                color={priority === p.value ? p.color : theme.colors.text}
                weight={priority === p.value ? 'semiBold' : 'regular'}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photo Attachments */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          {t('create.attachPhotos')} ({attachments.length}/{MAX_ATTACHMENTS})
        </Text>
        <View style={styles.attachmentsContainer}>
          {attachments.map(renderAttachment)}
          
          {/* Add photo button */}
          {attachments.length < MAX_ATTACHMENTS && (
            <TouchableOpacity
              style={[
                styles.addPhotoButton,
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={handleAddPhoto}
            >
              <Ionicons 
                name="camera-outline" 
                size={28} 
                color={theme.colors.primary} 
              />
              <Text variant="caption" color={theme.colors.primary}>
                {t('create.addPhoto')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Note */}
        <Card style={{ ...styles.noteCard, backgroundColor: theme.colors.primaryLight }}>
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

      {/* Sticky Submit Button */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button
          title={t('create.submitRequest')}
          variant="primary"
          size="large"
          fullWidth
          loading={createMutation.isPending}
          disabled={!isFormValid}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
};

// ============================================================================
// STYLES
// ============================================================================

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
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
    alignItems: 'center',
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
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  attachmentItem: {
    position: 'relative',
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  noteCard: {
    padding: 12,
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
    borderTopWidth: 1,
  },
});

export default CreateMaintenanceScreen;
