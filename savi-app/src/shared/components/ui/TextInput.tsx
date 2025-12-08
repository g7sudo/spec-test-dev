import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string | React.ReactNode; // Icon name (string) or custom ReactNode
  rightIcon?: string | React.ReactNode; // Icon name (string) or custom ReactNode
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry !== undefined;
  const showPassword = isPassword && isPasswordVisible;

  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary
    : theme.colors.border;

  const renderIcon = (iconProp: string | React.ReactNode | undefined, color: string) => {
    if (!iconProp) return null;
    if (typeof iconProp === 'string') {
      return <Ionicons name={iconProp as keyof typeof Ionicons.glyphMap} size={20} color={color} />;
    }
    return iconProp;
  };

  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon || isPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {hasLeftIcon && <View style={styles.leftIcon}>{renderIcon(leftIcon, theme.colors.iconSecondary)}</View>}
        <RNTextInput
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
            },
            hasLeftIcon ? { paddingLeft: 8 } : undefined,
            hasRightIcon ? { paddingRight: 8 } : undefined,
            style,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && !rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.iconSecondary}
            />
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress || (isPassword ? () => setIsPasswordVisible(!isPasswordVisible) : undefined)}
            disabled={!onRightIconPress && !isPassword}
          >
            {renderIcon(rightIcon, theme.colors.iconSecondary)}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text variant="caption" color={theme.colors.error} style={styles.error}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text variant="caption" color={theme.colors.textTertiary} style={styles.hint}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    paddingLeft: 12,
  },
  rightIcon: {
    paddingRight: 12,
  },
  error: {
    marginTop: 4,
  },
  hint: {
    marginTop: 4,
  },
});

export default TextInput;
