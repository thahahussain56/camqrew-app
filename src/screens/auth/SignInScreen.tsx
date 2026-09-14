import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';

// ------------------------------------------------------------------
// Inline plain TextInput to avoid any gesture/focus issues on iOS
// ------------------------------------------------------------------
const Field: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  autoCorrect?: boolean;
  textContentType?: any;
  testID?: string;
}> = ({ label, placeholder, value, onChangeText, keyboardType = 'default', autoCapitalize = 'none', secureTextEntry = false, autoCorrect = false, textContentType = 'none', testID }) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 50,
          borderRadius: 14,
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? '#3fb668' : colors.border,
          backgroundColor: colors.inputBackground,
          paddingHorizontal: 14,
        }}
      >
        <RNTextInput
          testID={testID}
          style={{ flex: 1, fontSize: 15, color: colors.textPrimary, height: 50 }}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !showPass}
          autoCorrect={autoCorrect}
          textContentType={textContentType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ fontSize: 12, color: '#3fb668', fontWeight: '700' }}>
              {showPass ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ------------------------------------------------------------------
// Sign In Screen
// ------------------------------------------------------------------
export const SignInScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { login } = useAuthStore();

  const [mode, setMode] = useState<'email' | 'phone'>('email');

  // Email fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone OTP fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  const showError = (msg: string) => { setToastType('error'); setToast(msg); };
  const showSuccess = (msg: string) => { setToastType('success'); setToast(msg); };

  const handleEmailLogin = async () => {
    if (!email.trim()) { showError('Please enter your email address.'); return; }
    if (!password) { showError('Please enter your password.'); return; }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e: any) {
      showError(e.message?.includes('Invalid') ? 'Invalid email or password.' : (e.message || 'Login failed.'));
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length < 10) { showError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true);
    try {
      const res = await authApi.sendOTP(cleaned);
      showSuccess(res.message);
      setOtpSent(true);
      setOtpTimer(30);
      const timer = setInterval(() => {
        setOtpTimer(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
      }, 1000);
    } catch (e: any) {
      showError(e.message || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { showError('Enter the full 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await authApi.verifyOTP(phone, otp);
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e: any) {
      showError('Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <Toast visible={!!toast} message={toast} type={toastType} onDismiss={() => setToast('')} />

        <View style={styles.headerArea}>
          <Image
            source={isDark ? require('../../../assets/camcrew-logo-white.png') : require('../../../assets/camcrew-logo-dark.png')}
            style={styles.logo}
          />
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Welcome Back</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Sign in to your Camcrew account</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
          {/* Mode Switcher */}
          <View style={[styles.modeSwitcher, { backgroundColor: colors.surfaceCard }]}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'email' && styles.modeBtnActive]}
              onPress={() => setMode('email')}
            >
              <Text style={[styles.modeBtnText, { color: mode === 'email' ? '#fff' : colors.textSecondary }]}>
                Email & Password
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'phone' && styles.modeBtnActive]}
              onPress={() => setMode('phone')}
            >
              <Text style={[styles.modeBtnText, { color: mode === 'phone' ? '#fff' : colors.textSecondary }]}>
                Phone OTP
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'email' ? (
            <>
              <Field
                testID="input-email"
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="username"
              />
              <Field
                testID="input-password"
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
              />
              <TouchableOpacity
                style={{ alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 }}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={{ color: '#3fb668', fontSize: 13, fontWeight: '600' }}>Forgot Password?</Text>
              </TouchableOpacity>
              <Button testID="btn-login" title="Sign In" variant="primary" size="lg" loading={loading} onPress={handleEmailLogin} />
            </>
          ) : (
            <>
              <Field
                label="Mobile Number (+91)"
                placeholder="9876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
              />
              {!otpSent ? (
                <Button title="Send OTP" variant="primary" size="lg" loading={loading} onPress={handleSendOtp} />
              ) : (
                <>
                  <Field
                    label="6-Digit OTP"
                    placeholder="123456"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                  />
                  <TouchableOpacity
                    disabled={otpTimer > 0}
                    onPress={handleSendOtp}
                    style={{ alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 }}
                  >
                    <Text style={{ color: otpTimer > 0 ? colors.textFaint : '#3fb668', fontSize: 13, fontWeight: '600' }}>
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                  <Button title="Verify & Sign In" variant="primary" size="lg" loading={loading} onPress={handleVerifyOtp} />
                </>
              )}
            </>
          )}

          <View style={styles.footerRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={{ color: '#3fb668', fontSize: 14, fontWeight: '700' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  page: { flexGrow: 1 },
  headerArea: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: { width: 180, height: 42, resizeMode: 'contain', marginBottom: 24 },
  heroTitle: { fontSize: 28, fontWeight: '900', marginBottom: 6, textAlign: 'center' },
  heroSub: { fontSize: 15, textAlign: 'center' },
  card: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 32,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#3fb668' },
  modeBtnText: { fontSize: 13, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
});
