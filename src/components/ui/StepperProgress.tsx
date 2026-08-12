import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface StepperProgressProps {
  totalSteps: number;
  currentStep: number;
  stepTitles?: string[];
}

export const StepperProgress: React.FC<StepperProgressProps> = ({
  totalSteps,
  currentStep,
  stepTitles,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={index}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isCompleted || isActive ? colors.accent : colors.chipBg,
                    borderColor: isCompleted || isActive ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepText,
                    {
                      color: isCompleted || isActive ? '#000000' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {stepNumber}
                </Text>
              </View>
              {index < totalSteps - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: isCompleted ? colors.accent : colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {stepTitles && stepTitles[currentStep - 1] && (
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Step {currentStep}: {stepTitles[currentStep - 1]}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepText: {
    fontSize: 13,
  },
  line: {
    flex: 1,
    height: 3,
    marginHorizontal: -2,
  },
  title: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
  },
});
