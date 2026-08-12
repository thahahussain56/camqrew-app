import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { Phone, KeyRound, Mail, Lock, LogIn, ArrowLeft } from 'lucide-react-native';

export const SignInScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { login } = useAuthStore();

  const [authMode, setAuthMode] = useState<'otp' | 'email'>('otp');
  const [step, setStep] = useState<'phone_input' | 'otp_verify'>('phone_input');

  // Phone OTP state
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);

  // Email state
  const [email, setEmail] = useState('thaha@camcrew.in');
  const [password, setPassword] = useState('password123');

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  useEffect(() => {
    let interval: any;
    if (step === 'otp_verify' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOTP = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setToastType('error');
      setToastMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOTP(cleanPhone);
      setToastType('success');
      setToastMessage(res.message);
      setStep('otp_verify');
      setTimer(30);
    } catch (e: any) {
      setToastType('error');
      setToastMessage(e.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setToastType('error');
      setToastMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOTP(phone, otp);
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e: any) {
      setToastType('error');
      setToastMessage(e.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setToastType('error');
      setToastMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e) {
      setToastType('error');
      setToastMessage('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMessage} message={toastMessage} type={toastType} onDismiss={() => setToastMessage('')} />

      {step === 'otp_verify' ? (
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep('phone_input')}>
          <ArrowLeft size={20} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>Change Phone Number</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {step === 'otp_verify' ? 'Verify OTP' : 'Welcome to Camcrew'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 'otp_verify'
            ? `Enter the 6-digit code sent to +91 ${phone}`
            : 'Sign in to access creator services, studio bookings, & rental gear'}
        </Text>
      </View>

      {/* Tab Switcher: Phone OTP vs Email */}
      {step === 'phone_input' && (
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceCard }]}>
          <TouchableOpacity
            style={[styles.tab, authMode === 'otp' && { backgroundColor: colors.accent }]}
            onPress={() => setAuthMode('otp')}
          >
            <Text style={[styles.tabText, { color: authMode === 'otp' ? '#000' : colors.textSecondary }]}>
              Phone OTP (Fast)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, authMode === 'email' && { backgroundColor: colors.accent }]}
            onPress={() => setAuthMode('email')}
          >
            <Text style={[styles.tabText, { color: authMode === 'email' ? '#000' : colors.textSecondary }]}>
              Email & Password
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Form Content */}
      <View style={styles.form}>
        {authMode === 'otp' ? (
          step === 'phone_input' ? (
            <>
              <Input
                label="Mobile Phone Number"
                placeholder="9876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                leftIcon={<Phone size={18} color={colors.textSecondary} />}
              />

              <Button
                title="Get 6-Digit OTP"
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleSendOTP}
                icon={<KeyRound size={18} color="#000000" />}
                style={{ marginTop: 10 }}
              />
            </>
          ) : (
            <>
              <Input
                label="6-Digit Verification Code"
                placeholder="123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                leftIcon={<KeyRound size={18} color={colors.textSecondary} />}
              />

              <View style={styles.timerRow}>
                {timer > 0 ? (
                  <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                    Resend code in <Text style={{ color: colors.accent, fontWeight: '700' }}>{timer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOTP}>
                    <Text style={[styles.resendText, { color: colors.accent }]}>Resend OTP Code</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Button
                title="Verify & Log In"
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleVerifyOTP}
                icon={<LogIn size={18} color="#000000" />}
                style={{ marginTop: 10 }}
              />
            </>
          )
        ) : (
          <>
            <Input
              label="Email Address"
              placeholder="name@domain.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={18} color={colors.textSecondary} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Lock size={18} color={colors.textSecondary} />}
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In with Email"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleEmailSignIn}
              icon={<LogIn size={18} color="#000000" />}
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={[styles.signupLink, { color: colors.accent }]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  form: {
    marginBottom: 24,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  timerText: {
    fontSize: 13,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
