import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { evaluatePasswordStrength } from '../../utils/passwordStrength';
import { useTheme } from '../../hooks/useTheme';

interface PasswordStrengthViewProps {
  password: string;
  showRules?: boolean;
}

export const PasswordStrengthView: React.FC<PasswordStrengthViewProps> = ({
  password,
  showRules = true,
}) => {
  const { colors } = useTheme();

  if (!password) {
    return null;
  }

  const { score, level, color, checks } = evaluatePasswordStrength(password);

  const rulesList = [
    { label: 'At least 8 characters', met: checks.hasMinLength },
    { label: 'One uppercase letter (A-Z)', met: checks.hasUppercase },
    { label: 'One lowercase letter (a-z)', met: checks.hasLowercase },
    { label: 'One number (0-9)', met: checks.hasNumber },
    { label: 'One special character (!@#$...)', met: checks.hasSpecial },
  ];

  return (
    <View style={styles.container}>
      {/* Header: Label and Level */}
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
          Password strength:
        </Text>
        <Text style={[styles.headerLevel, { color }]}>
          {level}
        </Text>
      </View>

      {/* 4-Segment Bar */}
      <View style={styles.barRow}>
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <View
              key={step}
              style={[
                styles.barSegment,
                { backgroundColor: isActive ? color : 'rgba(255, 255, 255, 0.12)' },
              ]}
            />
          );
        })}
      </View>

      {/* Checklist */}
      {showRules && (
        <View style={styles.rulesGrid}>
          {rulesList.map((rule, idx) => (
            <View key={idx} style={styles.ruleItem}>
              <View
                style={[
                  styles.ruleIconCircle,
                  {
                    backgroundColor: rule.met
                      ? 'rgba(63, 182, 104, 0.2)'
                      : 'rgba(255, 255, 255, 0.08)',
                  },
                ]}
              >
                {rule.met ? (
                  <Check size={10} color="#3fb668" strokeWidth={3} />
                ) : (
                  <X size={9} color="#64748b" strokeWidth={2.5} />
                )}
              </View>
              <Text
                style={[
                  styles.ruleLabel,
                  { color: rule.met ? '#3fb668' : '#64748b' },
                ]}
              >
                {rule.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 14,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerLevel: {
    fontSize: 12,
    fontWeight: '700',
  },
  barRow: {
    flexDirection: 'row',
    gap: 5,
    height: 4,
    width: '100%',
    marginBottom: 10,
  },
  barSegment: {
    flex: 1,
    borderRadius: 2,
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
  },
  ruleIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
