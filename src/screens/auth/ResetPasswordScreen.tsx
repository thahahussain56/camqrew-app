import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { Lock } from 'lucide-react-native';
import { authApi } from '../../api/authApi';

export const ResetPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setToastType('error');
      setToastMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setToastType('error');
      setToastMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.updatePassword(password);
      setToastType('success');
      setToastMessage('Password updated successfully! Please sign in.');
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 1500);
    } catch (e: any) {
      setToastType('error');
      setToastMessage(e.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toastMessage} message={toastMessage} type={toastType} onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <Image
          source={isDark ? require('../../../assets/camqrew-logo-white.png') : require('../../../assets/camqrew-logo-dark.png')}
          style={styles.logo}
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your new password below
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
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
    alignItems: 'center',
  },
  logo: { width: 180, height: 42, resizeMode: 'contain', marginBottom: 24 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  form: {},
});
