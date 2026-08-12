import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { Mail } from 'lucide-react-native';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setToastMessage('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (e) {
      setToastMessage('Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toastMessage} message={toastMessage} type="error" onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your email to receive a password reset link
        </Text>
      </View>

      {!submitted ? (
        <View style={styles.form}>
          <Input
            label="Registered Email"
            placeholder="name@domain.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
          />
          <Button
            title="Send Reset Instructions"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit}
            style={{ marginTop: 10 }}
          />
        </View>
      ) : (
        <View style={styles.successBox}>
          <Text style={[styles.successText, { color: colors.success }]}>
            ✅ Instructions sent! Please check your email inbox.
          </Text>
          <Button
            title="Back to Sign In"
            variant="outline"
            size="md"
            onPress={() => navigation.navigate('SignIn')}
            style={{ marginTop: 20 }}
          />
        </View>
      )}
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
  successBox: {
    alignItems: 'center',
    marginTop: 20,
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
