import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { CategoryDropdown } from '../../components/forms/CategoryDropdown';
import { supabase } from '../../api/supabaseClient';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react-native';

export const OnboardingDetailsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const { user, login } = useAuthStore();
  const { roleType = 'customer', email: initialEmail = '', phone: initialPhone = '', name: initialName = '' } = route.params || {};

  const [fullName, setFullName] = useState(initialName || user?.name || '');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState(initialEmail || user?.email || '');
  const [phone, setPhone] = useState(initialPhone || user?.phone || '');
  const [password, setPassword] = useState('camcrewPass123!');

  // Location state
  const [locationState, setLocationState] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [locationCity, setLocationCity] = useState('');

  // Creator fields
  const [selectedCategory, setSelectedCategory] = useState('Photographers');
  const [proTitle, setProTitle] = useState('');
  const [ratePerDay, setRatePerDay] = useState('');
  const [experienceYears, setExperienceYears] = useState('3');

  // Studio fields
  const [studioSpecialty, setStudioSpecialty] = useState('Commercials & Ad Films');
  const [teamSize, setTeamSize] = useState('5-15 crew members');
  const [gstin, setGstin] = useState('');

  // Client fields
  const [clientInterests, setClientInterests] = useState<string[]>(['Weddings', 'Commercial Shoots']);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  const showError = (msg: string) => { setToastType('error'); setToast(msg); };
  const showSuccess = (msg: string) => { setToastType('success'); setToast(msg); };

  const toggleInterest = (tag: string) => {
    setClientInterests(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCompleteSetup = async () => {
    if (roleType === 'business' && !companyName.trim()) {
      showError('Please enter your studio or production company name.');
      return;
    }
    if (roleType !== 'business' && !fullName.trim()) {
      showError('Please enter your full name.');
      return;
    }
    if (!locationState || !locationCity) {
      showError('Please select your operating state and city.');
      return;
    }
    if (roleType === 'professional' && (!ratePerDay || Number(ratePerDay) <= 0)) {
      showError('Please specify your standard daily rate.');
      return;
    }

    setLoading(true);

    try {
      const resolvedRole = roleType === 'customer' ? 'customer' : 'professional';
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      // If user is already authenticated in session
      if (user && user.id && !user.id.startsWith('new-')) {
        await supabase.from('users').update({
          name: fullName.trim() || companyName.trim() || user.name,
          role: resolvedRole,
          phone: cleanPhone ? `+91 ${cleanPhone}` : user.phone,
        }).eq('id', user.id);

        if (resolvedRole === 'professional') {
          await supabase.from('professional_profiles').upsert([{
            id: user.id,
            userId: user.id,
            name: fullName.trim() || companyName.trim() || user.name,
            title: roleType === 'business'
              ? `${companyName.trim() || fullName.trim()} • Studio & Production Agency`
              : (proTitle.trim() || 'Visual Storyteller & Creator'),
            city: locationCity,
            district: locationDistrict || locationCity,
            state: locationState,
            rate_per_day: Number(ratePerDay) || 5000,
            experience_years: Number(experienceYears) || 3,
            categories: roleType === 'business' ? ['Organisers', 'Photographers'] : [selectedCategory],
            bio: roleType === 'business'
              ? `${companyName.trim()} is a creative studio specializing in ${studioSpecialty}. Team size: ${teamSize}.`
              : `Experienced ${selectedCategory} based in ${locationCity}, ${locationState}. Available for commercial, wedding, and event projects nationwide.`,
          }]);
        }

        navigation.replace('MainApp');
        return;
      }

      // New registration
      if (resolvedRole === 'customer') {
        const res = await authApi.registerCustomer({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone || '9876543210',
          password: password || 'camcrewPass123!',
        });
        await login(res.user, res.token);
      } else {
        const res = await authApi.registerProfessional({
          name: roleType === 'business' ? (companyName.trim() || fullName.trim()) : fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone || '9876543210',
          password: password || 'camcrewPass123!',
          title: roleType === 'business'
            ? `${companyName.trim() || fullName.trim()} • Production Studio & Rental`
            : (proTitle.trim() || 'Visual Storyteller & Creator'),
          bio: roleType === 'business'
            ? `Premier creative studio & production house based in ${locationCity}. Focus: ${studioSpecialty}. Team capacity: ${teamSize}.`
            : `Creative professional in ${selectedCategory} with ${experienceYears} years of experience in ${locationCity}.`,
          experienceYears: Number(experienceYears) || 3,
          ratePerDay: Number(ratePerDay) || 5000,
          state: locationState,
          district: locationDistrict || locationCity,
          city: locationCity,
          categories: roleType === 'business' ? ['Organisers', 'Photographers'] : [selectedCategory],
        });
        await login(res.user, res.token);
      }

      navigation.replace('MainApp');
    } catch (e: any) {
      showError(e.message || 'Setup submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Toast visible={!!toast} message={toast} type={toastType} onDismiss={() => setToast('')} />

        <View style={[styles.headerNav, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            CAM<Text style={{ color: '#3fb668' }}>CREW</Text>
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 2 of 2 Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.stepLabel, { color: '#3fb668' }]}>Step 2 of 2</Text>
              <Text style={[styles.stepPercent, { color: colors.textSecondary }]}>Final Step • 100%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: '#3fb668' }]} />
            </View>
          </View>

          {/* Dynamic Header */}
          <View style={styles.titleSection}>
            <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>
              {roleType === 'customer'
                ? 'Complete Your Client Profile'
                : roleType === 'business'
                ? 'Setup Your Studio Details'
                : 'Setup Your Creative Pro Profile'}
            </Text>
            <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
              {roleType === 'customer'
                ? 'Provide your contact information and shoot interests to begin hiring verified talent.'
                : roleType === 'business'
                ? 'Enter your studio or production company name, services, and operational base.'
                : 'Set your primary craft, daily rate, and location so clients can book you directly.'}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            
            {/* Name Fields */}
            {roleType === 'business' ? (
              <>
                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PRODUCTION HOUSE / STUDIO NAME *
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <Building2 size={18} color={colors.textFaint} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="e.g. Apex Cinema Works Studios"
                      placeholderTextColor={colors.textFaint}
                      value={companyName}
                      onChangeText={setCompanyName}
                    />
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PRIMARY CONTACT PERSON NAME *
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <User size={18} color={colors.textFaint} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="e.g. Rohit Malhotra"
                      placeholderTextColor={colors.textFaint}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  FULL NAME *
                </Text>
                <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <User size={18} color={colors.textFaint} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="e.g. Rahul Verma"
                    placeholderTextColor={colors.textFaint}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>
            )}

            {/* Email Address */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                EMAIL ADDRESS *
              </Text>
              <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Mail size={18} color={colors.textFaint} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textFaint}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                MOBILE NUMBER (+91) *
              </Text>
              <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Phone size={18} color={colors.textFaint} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  placeholder="9876543210"
                  placeholderTextColor={colors.textFaint}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Operating Location */}
            <View style={{ marginBottom: 16 }}>
              <LocationCascader
                selectedState={locationState}
                selectedDistrict={locationDistrict}
                selectedCity={locationCity}
                onSelect={(st, dist, city) => {
                  setLocationState(st);
                  setLocationDistrict(dist);
                  setLocationCity(city);
                }}
                required
              />
            </View>

            {/* Role Specific: Creator */}
            {roleType === 'professional' && (
              <>
                <View style={{ marginBottom: 16 }}>
                  <CategoryDropdown
                    value={selectedCategory}
                    onSelect={setSelectedCategory}
                    label="Primary Category *"
                    required
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PROFESSIONAL TITLE / HEADLINE *
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="e.g. Commercial Cinematographer & Drone Pilot"
                      placeholderTextColor={colors.textFaint}
                      value={proTitle}
                      onChangeText={setProTitle}
                    />
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    STANDARD DAILY RATE (₹ / DAY) *
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="e.g. 8000"
                      placeholderTextColor={colors.textFaint}
                      value={ratePerDay}
                      onChangeText={setRatePerDay}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.presetChipsRow}>
                    {[5000, 8000, 12000, 18000, 25000].map(val => (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: ratePerDay === String(val) ? 'rgba(63, 182, 104, 0.15)' : colors.inputBackground,
                            borderColor: ratePerDay === String(val) ? '#3fb668' : colors.border,
                          },
                        ]}
                        onPress={() => setRatePerDay(String(val))}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: ratePerDay === String(val) ? '#3fb668' : colors.textSecondary }}>
                          ₹{val.toLocaleString('en-IN')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Role Specific: Studio */}
            {roleType === 'business' && (
              <>
                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PRIMARY PRODUCTION SPECIALTY
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="e.g. Commercials & OTT Films"
                      placeholderTextColor={colors.textFaint}
                      value={studioSpecialty}
                      onChangeText={setStudioSpecialty}
                    />
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    GSTIN / TAX ID (OPTIONAL)
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      placeholderTextColor={colors.textFaint}
                      value={gstin}
                      onChangeText={t => setGstin(t.toUpperCase())}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Role Specific: Client */}
            {roleType === 'customer' && (
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  SHOOT INTERESTS
                </Text>
                <View style={styles.presetChipsRow}>
                  {[
                    'Weddings',
                    'Commercial Shoots',
                    'Music Videos',
                    'Fashion',
                    'Gear Rental',
                    'Drone Shoots'
                  ].map(interest => (
                    <TouchableOpacity
                      key={interest}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: clientInterests.includes(interest) ? 'rgba(63, 182, 104, 0.15)' : colors.inputBackground,
                          borderColor: clientInterests.includes(interest) ? '#3fb668' : colors.border,
                        },
                      ]}
                      onPress={() => toggleInterest(interest)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: clientInterests.includes(interest) ? '#3fb668' : colors.textSecondary }}>
                        {clientInterests.includes(interest) ? '✓ ' : '+ '}{interest}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backActionButton, { borderColor: colors.border, backgroundColor: colors.surfaceCard }]}
            >
              <ArrowLeft size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginLeft: 6 }}>Back</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Button
                title="Complete Setup →"
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleCompleteSetup}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerNav: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  brandTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  progressContainer: { marginBottom: 20 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stepLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  stepPercent: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 999, borderWidth: 1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  titleSection: { marginBottom: 22 },
  mainTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  subTitle: { fontSize: 14, lineHeight: 20 },
  formCard: { marginBottom: 24 },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  textInput: { flex: 1, fontSize: 14, height: 50 },
  presetChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  backActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
});
