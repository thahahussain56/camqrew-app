import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { Lock } from 'lucide-react-native';

export const ResetPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleReset = async () => {
    if (!password || password !== confirmPassword) {
      setToastMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('SignIn');
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toastMessage} message={toastMessage} type="error" onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your new password below
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="New Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          isPassword
          leftIcon={<Lock size={18} color={colors.textSecondary} />}
        />
        <Input
          label="Confirm New Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          leftIcon={<Lock size={18} color={colors.textSecondary} />}
        />
        <Button
          title="Update Password"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleReset}
          style={{ marginTop: 10 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
  },
  form: {},
});
