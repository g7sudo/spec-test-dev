/**
 * JoinCommunityScreen
 * 
 * Entry point for resident invite flow. User enters 6-digit access code
 * received via email to join a community.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { validateAccessCode } from '@/services/api/residentInvite';
import { useTranslation } from 'react-i18next';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';
import { useIsApiLoading } from '@/state/apiLoadingStore';

type JoinCommunityNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'JoinCommunity'>;

export const JoinCommunityScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('invite');
  const navigation = useNavigation<JoinCommunityNavigationProp>();
  const { setPendingInvite } = usePendingInvite();

  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Use global API loading state (managed by apiClient interceptors)
  const isApiLoading = useIsApiLoading();

  const handleCodeChange = (text: string) => {
    // Auto-uppercase and limit to 6 characters
    const normalized = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setAccessCode(normalized);
    setError(null); // Clear error on input change
  };

  const canSubmit = accessCode.length === 6;

  const handleValidateCode = async () => {
    if (!canSubmit) {
      console.log('[JoinCommunityScreen] ⚠️ Cannot submit - code length:', accessCode.length);
      return;
    }

    console.log('[JoinCommunityScreen] 🚀 Starting code validation:', {
      code: accessCode,
      normalizedCode: accessCode.toUpperCase().trim(),
      timestamp: new Date().toISOString(),
    });

    setError(null);

    try {
      // Step 1: Validate access code (platform level, no auth needed)
      console.log('[JoinCommunityScreen] 📡 Calling validateAccessCode API...');
      const response = await validateAccessCode(accessCode);
      
      console.log('[JoinCommunityScreen] 📥 Received validation response:', {
        isValid: response.isValid,
        hasInviteId: !!response.inviteId,
        hasInvitationToken: !!response.invitationToken,
        hasEmail: !!response.email,
        hasTenantId: !!response.tenantId,
        hasTenantCode: !!response.tenantCode,
        hasTenantName: !!response.tenantName,
        tenantCode: response.tenantCode,
        tenantName: response.tenantName,
        email: response.email,
        unitLabel: response.unitLabel,
        role: response.role,
        errorMessage: response.errorMessage,
      });

      // Step 1: Check if validation failed (isValid: false)
      if (response.isValid === false) {
        // Show errorMessage from API response
        const errorMsg = response.errorMessage || t('invalidCode');
        console.log('[JoinCommunityScreen] ❌ Validation failed - isValid: false:', {
          errorMessage: errorMsg,
          isValid: response.isValid,
        });
        setError(errorMsg);
        return;
      }

      // Step 2: Validate required fields for valid responses
      // Note: tenantCode can be empty - we'll get it from tenant selection later
      const hasRequiredFields = 
        response.inviteId && 
        response.invitationToken && 
        response.email &&
        response.tenantId; // tenantId is required, tenantCode can be empty

      if (!hasRequiredFields) {
        // Show error message for missing required fields
        const errorMsg = response.errorMessage || t('invalidCode');
        
        console.log('[JoinCommunityScreen] ❌ Validation failed - missing required fields:', {
          isValid: response.isValid,
          missingFields: {
            inviteId: !response.inviteId,
            invitationToken: !response.invitationToken,
            email: !response.email,
            tenantId: !response.tenantId,
          },
          receivedData: {
            tenantCode: response.tenantCode || '(empty)',
            tenantId: response.tenantId,
            tenantName: response.tenantName,
          },
          errorMessage: errorMsg,
        });
        setError(errorMsg);
        return;
      }

      // Store invite data in context for use in SetupAccountScreen and after Firebase auth
      // 
      // Note: tenantCode can be empty - we'll get it from accept invite response
      // tenantId is required and will be used to match with tenant memberships
      const inviteData = {
        accessCode: accessCode.toUpperCase().trim(), // ✅ Store original access code for accept call
        inviteId: response.inviteId!,
        invitationToken: response.invitationToken!, // ✅ Saved for accept call
        email: response.email!,
        tenantId: response.tenantId!, // ✅ Required for matching with tenant memberships
        tenantCode: response.tenantCode?.trim() || '', // ✅ Can be empty, will get from accept response
        tenantName: response.tenantName!,
        unitLabel: response.unitLabel!,
        role: response.role!,
        partyName: response.partyName!,
        expiresAt: response.expiresAt,
      };

      console.log('[JoinCommunityScreen] 💾 Storing invite data in context:', {
        inviteId: inviteData.inviteId,
        tenantId: inviteData.tenantId,
        tenantCode: inviteData.tenantCode || '(empty - will get from tenant selection)',
        tenantName: inviteData.tenantName,
        email: inviteData.email,
        unitLabel: inviteData.unitLabel,
      });

      setPendingInvite(inviteData);

      // Navigate to setup account screen (password entry)
      console.log('[JoinCommunityScreen] 🧭 Navigating to SetupAccount screen');
      navigation.navigate('SetupAccount');
    } catch (err: any) {
      console.error('[JoinCommunityScreen] ❌ Validation error caught:', {
        errorType: typeof err,
        errorMessage: err.message,
        status: err.status,
        statusCode: err.status,
        responseData: err.data,
        originalError: err.originalError,
        isNetworkError: err.status === 0 || err.message?.includes('Network'),
        isAxiosError: err.originalError?.isAxiosError,
        timestamp: new Date().toISOString(),
      });

      // Handle API errors with specific error messages
      if (err.status === 400 || err.status === 404) {
        // Invalid code or not found
        const errorMsg = err.message || t('invalidCode');
        console.log('[JoinCommunityScreen] ⚠️ 400/404 Error:', errorMsg);
        setError(errorMsg);
      } else if (err.status === 0 || err.message?.includes('Network')) {
        // Network error
        console.log('[JoinCommunityScreen] 🌐 Network Error detected');
        setError(t('networkError'));
      } else {
        // Other errors
        const errorMsg = err.message || t('validationError');
        console.log('[JoinCommunityScreen] ⚠️ Other Error:', errorMsg);
        setError(errorMsg);
      }
    } finally {
      console.log('[JoinCommunityScreen] ✅ Validation flow completed');
    }
  };

  return (
    <Screen safeArea style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={48} color={theme.colors.primary} />
            </View>
            <Text variant="h2" style={styles.title}>
              {t('joinCommunity')}
            </Text>
            <Text
              variant="body"
              color={theme.colors.textSecondary}
              align="center"
              style={styles.subtitle}
            >
              {t('enterAccessCode')}
            </Text>
          </View>

          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: theme.colors.errorLight },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={20}
                color={theme.colors.error}
              />
              <Text
                variant="bodySmall"
                color={theme.colors.error}
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <TextInput
              label={t('accessCode')}
              value={accessCode}
              onChangeText={handleCodeChange}
              placeholder={t('accessCodePlaceholder')}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              keyboardType="default"
              returnKeyType="done"
              onSubmitEditing={handleValidateCode}
              editable={!isApiLoading}
              style={styles.codeInput}
            />

            <Button
              title={t('continue')}
              onPress={handleValidateCode}
              disabled={!canSubmit || isApiLoading}
              loading={isApiLoading}
              variant="primary"
              style={styles.submitButton}
            />
          </View>

          <View style={styles.footer}>
            <Text
              variant="bodySmall"
              color={theme.colors.textSecondary}
              align="center"
            >
              {t('noAccessCode')}
            </Text>
            <TouchableOpacity>
              <Text
                variant="bodySmall"
                color={theme.colors.primary}
                weight="semiBold"
                style={styles.linkText}
              >
                {t('contactAdmin')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
  },
  form: {
    flex: 1,
    gap: 16,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    marginTop: 4,
  },
});

export default JoinCommunityScreen;

