import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { User, Mail, Phone, Lock } from 'lucide-react-native';

export const SignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setToastMessage('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.registerCustomer({ name, email, phone, password });
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e) {
      setToastMessage('Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMessage} message={toastMessage} type="error" onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Create Customer Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Book top photographers, videographers & creative professionals across India
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Full Name"
          placeholder="e.g. Priya Sharma"
          value={name}
          onChangeText={setName}
          leftIcon={<User size={18} color={colors.textSecondary} />}
        />

        <Input
          label="Email Address"
          placeholder="priya@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Mail size={18} color={colors.textSecondary} />}
        />

        <Input
          label="Phone Number (+91)"
          placeholder="9876543210"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          leftIcon={<Phone size={18} color={colors.textSecondary} />}
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          isPassword
          leftIcon={<Lock size={18} color={colors.textSecondary} />}
        />

        <Button
          title="Sign Up as Customer"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSignUp}
          style={{ marginTop: 10 }}
        />
      </View>

      <TouchableOpacity
        style={styles.proSignupBox}
        onPress={() => navigation.navigate('ProfessionalSignUp')}
      >
        <Text style={[styles.proSignupText, { color: colors.accent }]}>
          Are you a creative professional? Sign up as a Pro →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  form: {
    marginBottom: 20,
  },
  proSignupBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 219, 233, 0.3)',
    backgroundColor: 'rgba(0, 219, 233, 0.05)',
  },
  proSignupText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
