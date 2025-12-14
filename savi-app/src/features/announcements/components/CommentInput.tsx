/**
 * CommentInput Component
 * 
 * Input field for adding comments to announcements.
 * Positioned at bottom of screen with send button.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Row } from '@/shared/components';
import { useTranslation } from 'react-i18next';

interface CommentInputProps {
  /** Called when comment is submitted */
  onSubmit: (content: string) => void;
  /** Is submission in progress */
  isSubmitting?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Replying to a comment (shows reply indicator) */
  replyingTo?: { id: string; authorName: string } | null;
  /** Called when reply is cancelled */
  onCancelReply?: () => void;
}

/**
 * CommentInput - Bottom input for adding comments
 * 
 * Features:
 * - Text input with send button
 * - Loading state during submission
 * - Reply indicator when replying to a comment
 * - Keyboard avoiding behavior
 */
export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  isSubmitting = false,
  placeholder,
  replyingTo,
  onCancelReply,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('announcements');
  const [content, setContent] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Handle submit
  const handleSubmit = useCallback(() => {
    const trimmedContent = content.trim();
    if (trimmedContent && !isSubmitting) {
      onSubmit(trimmedContent);
      setContent('');
    }
  }, [content, isSubmitting, onSubmit]);

  // Handle cancel reply
  const handleCancelReply = useCallback(() => {
    onCancelReply?.();
    setContent('');
  }, [onCancelReply]);

  // Check if can submit
  const canSubmit = content.trim().length > 0 && !isSubmitting;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {/* Reply indicator */}
        {replyingTo && (
          <Row style={styles.replyIndicator}>
            <Text variant="caption" color={theme.colors.textSecondary}>
              {t('replyingTo', { name: replyingTo.authorName, defaultValue: `Replying to ${replyingTo.authorName}` })}
            </Text>
            <TouchableOpacity onPress={handleCancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </Row>
        )}

        {/* Input Row */}
        <Row style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.textPrimary,
              },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder={placeholder || t('commentPlaceholder', { defaultValue: 'Write a comment...' })}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={1000}
            editable={!isSubmitting}
            returnKeyType="default"
          />

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: canSubmit ? theme.colors.primary : theme.colors.surfaceVariant,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={canSubmit ? '#FFFFFF' : theme.colors.textDisabled}
              />
            )}
          </TouchableOpacity>
        </Row>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  replyIndicator: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 4,
  },
  inputRow: {
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentInput;

