import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  isPassword = false,
  containerStyle,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.danger : colors.border,
            height: props.multiline ? 'auto' : 48,
            paddingVertical: props.multiline ? 12 : 0,
            alignItems: props.multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {/* Left icon — NOT absolutely positioned, just a flex sibling */}
        {leftIcon && (
          <View style={styles.leftIconContainer} pointerEvents="none">
            {leftIcon}
          </View>
        )}

        <TextInput
          placeholderTextColor={colors.textFaint}
          secureTextEntry={isPassword && !showPassword}
          style={[
            styles.input,
            { color: colors.textPrimary },
            props.multiline && { height: 'auto', minHeight: 80, textAlignVertical: 'top' },
            style,
          ]}
          // iOS-critical: these prevent autofill banner from stealing focus
          autoCorrect={false}
          spellCheck={false}
          {...props}
        />

        {/* Right icon — NOT absolutely positioned */}
        {isPassword && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',      // Row layout: icon | input | eye
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  leftIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
  },
  input: {
    flex: 1,                   // Takes all remaining horizontal space
    fontSize: 15,
    // Explicit height for iOS — '100%' is unreliable inside flex containers
    height: Platform.OS === 'ios' ? undefined : undefined, // Height managed by wrapper now
    paddingVertical: 0,        // Remove extra vertical padding on iOS
  },
  rightIconContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
