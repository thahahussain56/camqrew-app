import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { PROFESSIONAL_CATEGORIES, getArchetype } from '../../constants/categories';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────
// Reusable plain field — no wrapper abstractions, direct RNTextInput
// ─────────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  textContentType?: any;
  multiline?: boolean;
  numberOfLines?: number;
}> = ({
  label, placeholder, value, onChangeText,
  keyboardType = 'default', autoCapitalize = 'words',
  secureTextEntry = false, textContentType = 'none',
  multiline = false, numberOfLines = 1,
}) => {
  const { colors } = useTheme();
  const [showPass, setShowPass] = useState(false);
  const minH = multiline ? numberOfLines * 44 : 52;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>
        {label.toUpperCase()}
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        minHeight: minH,
        borderRadius: 14,
        backgroundColor: colors.inputBackground,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 12 : 0,
      }}>
        <RNTextInput
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.textPrimary,
            minHeight: multiline ? minH - 24 : 52,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingVertical: 0,
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !showPass}
          textContentType={textContentType}
          autoCorrect={false}
          spellCheck={false}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPass(p => !p)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ paddingLeft: 10, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '800' }}>
              {showPass ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────
// SIGN IN SCREEN
// ─────────────────────────────────────────────────────────────────
export const SignInScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { login } = useAuthStore();

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  const err = (msg: string) => { setToastType('error'); setToast(msg); };
  const ok = (msg: string) => { setToastType('success'); setToast(msg); };

  const handleEmailLogin = async () => {
    if (!email.trim()) { err('Please enter your email.'); return; }
    if (!password) { err('Please enter your password.'); return; }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e: any) {
      err(e.message?.includes('Invalid') ? 'Wrong email or password.' : (e.message || 'Login failed.'));
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length < 10) { err('Enter a valid 10-digit number.'); return; }
    setLoading(true);
    try {
      const res = await authApi.sendOTP(cleaned);
      ok(res.message);
      setOtpSent(true);
      setOtpTimer(30);
      const t = setInterval(() => setOtpTimer(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    } catch (e: any) { err(e.message || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { err('Enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await authApi.verifyOTP(phone, otp);
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch { err('Invalid OTP. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Toast visible={!!toast} message={toast} type={toastType} onDismiss={() => setToast('')} />

        {/* Hero */}
        <LinearGradient colors={['#0F0C29', '#302B63', '#24243E']} style={siStyles.hero}>
          <View style={siStyles.badge}>
            <Text style={{ color: '#3fb668', fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>CAMQREW STUDIO</Text>
          </View>
          <Text style={siStyles.heroTitle}>Welcome{'\n'}Back 👋</Text>
          <Text style={siStyles.heroSub}>India's Premier Creative Professional Platform</Text>
        </LinearGradient>

        {/* Card */}
        <View style={siStyles.card}>
          {/* Mode Switcher */}
          <View style={siStyles.switcher}>
            {(['email', 'phone'] as const).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[siStyles.switchBtn, mode === m && siStyles.switchBtnActive]}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: mode === m ? '#fff' : '#888' }}>
                  {m === 'email' ? '✉️  Email & Password' : '📱  Phone OTP'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'email' ? (
            <>
              <Field label="Email Address" placeholder="you@example.com" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" textContentType="username" />
              <Field label="Password" placeholder="Your password" value={password} onChangeText={setPassword}
                secureTextEntry textContentType="password" />
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 20 }}
                onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={{ color: '#3fb668', fontSize: 13, fontWeight: '700' }}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={siStyles.cta} onPress={handleEmailLogin} disabled={loading}>
                <LinearGradient colors={['#3fb668', '#FF9A00']} style={siStyles.ctaInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
                    {loading ? 'Signing In…' : 'Sign In →'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Field label="Mobile Number" placeholder="9876543210 (India)" value={phone} onChangeText={setPhone}
                keyboardType="phone-pad" autoCapitalize="none" textContentType="telephoneNumber" />
              {!otpSent ? (
                <TouchableOpacity style={siStyles.cta} onPress={handleSendOtp} disabled={loading}>
                  <LinearGradient colors={['#3fb668', '#FF9A00']} style={siStyles.ctaInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{loading ? 'Sending…' : 'Send OTP →'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  <Field label="6-Digit OTP Code" placeholder="123456" value={otp} onChangeText={setOtp}
                    keyboardType="number-pad" autoCapitalize="none" textContentType="oneTimeCode" />
                  <TouchableOpacity disabled={otpTimer > 0} style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 20 }}
                    onPress={handleSendOtp}>
                    <Text style={{ color: otpTimer > 0 ? '#ccc' : '#3fb668', fontSize: 13, fontWeight: '700' }}>
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={siStyles.cta} onPress={handleVerifyOtp} disabled={loading}>
                    <LinearGradient colors={['#3fb668', '#FF9A00']} style={siStyles.ctaInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{loading ? 'Verifying…' : 'Verify & Sign In →'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 }}>
            <Text style={{ color: '#888', fontSize: 14 }}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={{ color: '#3fb668', fontSize: 14, fontWeight: '800' }}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const siStyles = StyleSheet.create({
  hero: { paddingTop: 80, paddingBottom: 60, paddingHorizontal: 24 },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20 },
  heroTitle: { fontSize: 42, fontWeight: '900', color: '#fff', lineHeight: 50, marginBottom: 10 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  card: {
    marginTop: -30, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 28,
    padding: 24, shadowColor: '#000', shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 }, shadowRadius: 24, elevation: 16, marginBottom: 32,
  },
  switcher: {
    flexDirection: 'row', backgroundColor: '#F0F0F5', borderRadius: 14,
    padding: 4, marginBottom: 24, gap: 4,
  },
  switchBtn: { flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  switchBtnActive: { backgroundColor: '#000000' },
  cta: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  ctaInner: { height: 54, justifyContent: 'center', alignItems: 'center' },
});

// ─────────────────────────────────────────────────────────────────
// CUSTOMER SIGN UP SCREEN
// ─────────────────────────────────────────────────────────────────
export const SignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  const err = (msg: string) => { setToastType('error'); setToast(msg); };

  const handleSignUp = async () => {
    if (!name.trim()) { err('Full name is required.'); return; }
    if (!email.includes('@')) { err('Enter a valid email address.'); return; }
    if (phone.replace(/\D/g, '').length < 10) { err('Enter a valid 10-digit phone.'); return; }
    if (password.length < 6) { err('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { err('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await authApi.registerCustomer({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.replace(/\D/g, ''), password });
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e: any) { err(e.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Toast visible={!!toast} message={toast} type={toastType} onDismiss={() => setToast('')} />

        <View style={suStyles.headerArea}>
          <Image
            source={isDark ? require('../../../assets/camcrew-logo-white.png') : require('../../../assets/camcrew-logo-dark.png')}
            style={suStyles.logo}
          />
          <Text style={[suStyles.heroTitle, { color: colors.textPrimary }]}>Create Your{'\n'}Account</Text>
          <Text style={[suStyles.heroSub, { color: colors.textSecondary }]}>Book top photographers, studios & gear across India</Text>
        </View>

        <View style={[suStyles.card, { backgroundColor: colors.surfaceCard }]}>
          <View style={suStyles.dbBadge}>
            <Text style={{ fontSize: 11, color: '#666', fontWeight: '600' }}>📊 Maps to: <Text style={{ color: '#3fb668' }}>users</Text> table</Text>
          </View>

          {/* users.name */}
          <Field label="Full Name *" placeholder="e.g. Priya Sharma" value={name} onChangeText={setName} />
          {/* users.email */}
          <Field label="Email Address *" placeholder="priya@example.com" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" />
          {/* users.phone */}
          <Field label="Mobile Number * (+91)" placeholder="9876543210" value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" autoCapitalize="none" textContentType="telephoneNumber" />
          {/* Supabase Auth password */}
          <Field label="Password * (min 6 chars)" placeholder="Choose a strong password" value={password}
            onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
          <Field label="Confirm Password *" placeholder="Re-enter your password" value={confirm}
            onChangeText={setConfirm} secureTextEntry textContentType="newPassword" />

          <TouchableOpacity style={[suStyles.cta, { backgroundColor: colors.accent }]} onPress={handleSignUp} disabled={loading}>
            <View style={suStyles.ctaInner}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
                {loading ? 'Creating Account…' : 'Create Account →'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={suStyles.proBox}
            onPress={() => navigation.navigate('ProfessionalSignUp')}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>📸 Photographer / Videographer?</Text>
            <Text style={{ fontSize: 13, color: '#3fb668', fontWeight: '700', marginTop: 2 }}>Sign up as a Professional →</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 }}>
            <Text style={{ color: '#888', fontSize: 14 }}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={{ color: '#3fb668', fontSize: 14, fontWeight: '800' }}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const suStyles = StyleSheet.create({
  headerArea: { paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24, alignItems: 'center' },
  logo: { width: 180, height: 42, resizeMode: 'contain', marginBottom: 24 },
  heroTitle: { fontSize: 28, fontWeight: '900', lineHeight: 36, marginBottom: 10, textAlign: 'center' },
  heroSub: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  card: {
    marginTop: 10, marginHorizontal: 16, borderRadius: 28,
    padding: 24, shadowColor: '#000', shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 }, shadowRadius: 24, elevation: 16, marginBottom: 32,
  },
  dbBadge: { backgroundColor: '#FFF3E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 18 },
  cta: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  ctaInner: { height: 54, justifyContent: 'center', alignItems: 'center' },
  proBox: {
    marginTop: 16, borderWidth: 1.5, borderColor: '#3fb668', borderRadius: 16,
    padding: 16, backgroundColor: 'rgba(63, 182, 104, 0.1)', alignItems: 'center',
  },
});

// ─────────────────────────────────────────────────────────────────
// PROFESSIONAL SIGN UP SCREEN (4-step wizard)
// ─────────────────────────────────────────────────────────────────
const PRO_STEPS = [
  { label: 'Account', emoji: '👤', hint: '→ users table' },
  { label: 'Profile', emoji: '🎬', hint: '→ professional_profiles' },
  { label: 'Location & Rates', emoji: '📍', hint: '→ city, state, rate_per_day' },
  { label: 'Review', emoji: '✅', hint: '→ Submit' },
];

export const ProfessionalSignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { login } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  // Step 0 — users
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Step 1 — professional_profiles
  const [selectedCategory, setSelectedCategory] = useState('Photographers');
  const regArchetype = getArchetype(selectedCategory);
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skills, setSkills] = useState('');
  const [equipment, setEquipment] = useState('');

  // Step 2 — location + rate
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Mumbai');
  const [city, setCity] = useState('Mumbai');
  const [ratePerDay, setRatePerDay] = useState('');

  const err = (msg: string) => { setToastType('error'); setToast(msg); };

  const validate = (): boolean => {
    if (step === 0) {
      if (!name.trim()) { err('Full name is required.'); return false; }
      if (!email.includes('@')) { err('Enter a valid email.'); return false; }
      if (phone.replace(/\D/g, '').length < 10) { err('Enter a valid 10-digit phone.'); return false; }
      if (password.length < 6) { err('Password must be at least 6 characters.'); return false; }
      if (password !== confirm) { err('Passwords do not match.'); return false; }
    }
    if (step === 1) {
      if (!title.trim()) { err('Professional title is required.'); return false; }
      if (!bio.trim() || bio.trim().length < 20) { err('Bio must be at least 20 characters.'); return false; }
    }
    if (step === 2) {
      if (!city.trim() || !district.trim() || !state.trim()) { err('State, District, and City are required.'); return false; }
      if (!ratePerDay || isNaN(Number(ratePerDay)) || Number(ratePerDay) < 500) { err(`Enter a valid rate (min ₹500 per ${regArchetype.rateUnitDefault.toLowerCase()}).`); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < PRO_STEPS.length - 1) { setStep(step + 1); }
    else { handleSubmit(); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await authApi.registerProfessional({
        name: name.trim(), email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''), password,
        title: title.trim(), bio: bio.trim(),
        experienceYears: Number(experienceYears) || 0,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        equipment: equipment.split(',').map(s => s.trim()).filter(Boolean),
        categories: [selectedCategory],
        state: state.trim(),
        district: district.trim(),
        city: city.trim(),
        ratePerDay: Number(ratePerDay),
      });
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e: any) { err(e.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const reviewRows = [
    ['Name', name], ['Email', email], ['Phone', phone],
    ['Category', selectedCategory],
    ['Title', title], ['Experience', `${experienceYears || 0} years`],
    ['Locality', `${city}, ${district}`], ['State', state],
    [`Base Rate (${regArchetype.rateUnitDefault})`, `₹${Number(ratePerDay || 0).toLocaleString('en-IN')}`],
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Toast visible={!!toast} message={toast} type={toastType} onDismiss={() => setToast('')} />

        <View style={proStyles.headerArea}>
          <Image
            source={isDark ? require('../../../assets/camcrew-logo-white.png') : require('../../../assets/camcrew-logo-dark.png')}
            style={suStyles.logo}
          />
          <Text style={[proStyles.heroTitle, { color: colors.textPrimary }]}>Join as a Pro</Text>
          <Text style={[proStyles.heroSub, { color: colors.textSecondary }]}>Grow your creative studio & get booked by top clients</Text>

          {/* Progress Stepper */}
          <View style={{ marginTop: 24, paddingHorizontal: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {PRO_STEPS.map((s, i) => (
                <React.Fragment key={i}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{
                      width: '100%', height: 4, borderRadius: 2,
                      backgroundColor: i <= step ? colors.accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      marginBottom: 8,
                    }} />
                    <Text style={{
                      color: i <= step ? colors.textPrimary : colors.textFaint,
                      fontSize: 10, fontWeight: '700', textAlign: 'center',
                      opacity: i <= step ? 1 : 0.6
                    }}>
                      {s.label}
                    </Text>
                  </View>
                  {i < PRO_STEPS.length - 1 && <View style={{ width: 8 }} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        <View style={[proStyles.card, { backgroundColor: colors.surfaceCard }]}>
          {/* DB badge */}
          <View style={suStyles.dbBadge}>
            <Text style={{ fontSize: 11, color: '#666', fontWeight: '600' }}>
              📊 {PRO_STEPS[step].hint}
            </Text>
          </View>

          {step === 0 && (
            <>
              <Text style={[proStyles.stepTitle, { color: colors.textPrimary }]}>Account Details</Text>
              <Field label="Full Name *" placeholder="Aarav Sharma" value={name} onChangeText={setName} />
              <Field label="Email Address *" placeholder="aarav@studio.in" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" />
              <Field label="Mobile Number * (+91)" placeholder="9876543210" value={phone} onChangeText={setPhone}
                keyboardType="phone-pad" autoCapitalize="none" textContentType="telephoneNumber" />
              <Field label="Password * (min 6 chars)" placeholder="Choose a strong password" value={password}
                onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
              <Field label="Confirm Password *" placeholder="Re-enter your password" value={confirm}
                onChangeText={setConfirm} secureTextEntry textContentType="newPassword" />
            </>
          )}

          {step === 1 && (
            <>
              <Text style={[proStyles.stepTitle, { color: colors.textPrimary }]}>Professional Category & Profile</Text>
              
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>
                PRIMARY INDUSTRY / CATEGORY *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                {PROFESSIONAL_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.name)}
                      style={{
                        paddingHorizontal: 13,
                        paddingVertical: 7,
                        borderRadius: 16,
                        backgroundColor: isSelected ? colors.accent : colors.inputBackground,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.accent : colors.borderLight,
                      }}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: isSelected ? '#ffffff' : colors.textPrimary,
                      }}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Field 
                label="Professional Title *" 
                placeholder={selectedCategory === 'Home Bakers' ? 'e.g. Artisan Cake Designer & Fresh Baked Foods' : selectedCategory === 'Caterers' ? 'e.g. Executive Banquet Caterer' : selectedCategory === 'Organisers' ? 'e.g. Luxury Wedding & Event Planner' : selectedCategory === 'Developers' ? 'e.g. Full-Stack Web & Mobile Developer' : selectedCategory === 'Models' ? 'e.g. International Runway & High-Fashion Model' : 'e.g. Senior Wedding Photographer'} 
                value={title} 
                onChangeText={setTitle} 
              />
              <Field label="Bio / About You * (min 20 chars)" placeholder="Tell clients about your style, capabilities, and past projects..." value={bio} onChangeText={setBio} multiline numberOfLines={4} />
              <Field label="Years of Experience" placeholder="e.g. 5" value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" autoCapitalize="none" />
              <Field 
                label={`${regArchetype.skillsSectionTitle} (comma separated)`} 
                placeholder={selectedCategory === 'Home Bakers' ? 'Fondant Sculpting, Eggless Baking, French Macarons, Custom Tiered Cakes' : selectedCategory === 'Caterers' ? 'FSSAI Certified, Mughlai, Live Chaat, Mocktail Bar' : selectedCategory === 'Organisers' ? 'Turnkey Planning, Stage Fabrication, Artist Booking' : selectedCategory === 'Developers' ? 'React, Next.js, Node.js, Supabase, AWS' : selectedCategory === 'Models' ? 'Lakmé Fashion Week, FDCI, Vogue, Ramp Walk Certified' : 'Photography, Cinematography, DGCA Drone Pilot'} 
                value={skills} 
                onChangeText={setSkills} 
              />
              <Field 
                label={`${regArchetype.equipmentSectionTitle} (comma separated)`} 
                placeholder={selectedCategory === 'Home Bakers' ? 'Baking Studio, Commercial Deck Oven, KitchenAid Stand Mixers, Cold Storage' : selectedCategory === 'Caterers' ? 'Buffet Warmers, Live Counters, Crockery Included' : selectedCategory === 'Organisers' ? 'Line Array Sound, Light Trussing, LED Wall' : selectedCategory === 'Developers' ? 'TypeScript, PostgreSQL, Tailwind, Docker' : selectedCategory === 'Models' ? 'Height: 5\'10", Vitals: 34-25-36, High-Fashion Runway, Bridal' : 'Sony A7S III, Canon R5, DJI Mavic 3'} 
                value={equipment} 
                onChangeText={setEquipment} 
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={[proStyles.stepTitle, { color: colors.textPrimary }]}>Location & Rates</Text>
              <View style={{ marginBottom: 16 }}>
                <LocationCascader
                  label="Base Locality (State → District → City/Town)"
                  selectedState={state}
                  selectedDistrict={district}
                  selectedCity={city}
                  onSelect={(s, d, c) => {
                    setState(s);
                    setDistrict(d);
                    setCity(c);
                  }}
                />
              </View>
              <Field 
                label={`Base Rate (₹ / ${regArchetype.rateUnitDefault}) *`} 
                placeholder={`e.g. ${regArchetype.ratePlaceholder}`} 
                value={ratePerDay} 
                onChangeText={setRatePerDay}
                keyboardType="number-pad" 
                autoCapitalize="none" 
              />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={[proStyles.stepTitle, { color: colors.textPrimary }]}>Review & Submit</Text>
              <View style={[proStyles.reviewBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F7F8FA' }]}>
                {reviewRows.map(([k, v]) => (
                  <View key={k} style={proStyles.reviewRow}>
                    <Text style={proStyles.reviewKey}>{k}</Text>
                    <Text style={[proStyles.reviewVal, { color: colors.textPrimary }]} numberOfLines={2}>{v || '—'}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Navigation buttons */}
          <View style={{ flexDirection: 'row', marginTop: 24, gap: 12 }}>
            {step > 0 && (
              <TouchableOpacity
                style={[proStyles.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F5', flex: 1 }]}
                onPress={() => setStep(step - 1)}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[proStyles.navBtn, { flex: 1, overflow: 'hidden', backgroundColor: colors.accent }]}
              onPress={handleNext}
              disabled={loading}
            >
              <View style={proStyles.navBtnGrad}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff' }}>
                  {loading ? 'Please wait…' : step === PRO_STEPS.length - 1 ? 'Submit Application ✓' : 'Continue →'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {step === 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 }}>
              <Text style={{ color: '#888', fontSize: 14 }}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={{ color: '#3fb668', fontSize: 14, fontWeight: '800' }}> Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const proStyles = StyleSheet.create({
  headerArea: { paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '900', marginBottom: 6, textAlign: 'center' },
  heroSub: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  card: {
    marginTop: 10, marginHorizontal: 16, borderRadius: 28,
    padding: 24, shadowColor: '#000', shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 }, shadowRadius: 24, elevation: 16, marginBottom: 32,
  },
  stepTitle: { fontSize: 20, fontWeight: '900', color: '#000000', marginBottom: 20 },
  reviewBox: { backgroundColor: '#F7F8FA', borderRadius: 16, padding: 16, gap: 12 },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start' },
  reviewKey: { fontSize: 12, color: '#888', fontWeight: '700', width: 110, letterSpacing: 0.3 },
  reviewVal: { fontSize: 14, color: '#000000', fontWeight: '700', flex: 1 },
  navBtn: { borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F5' },
  navBtnGrad: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
});
