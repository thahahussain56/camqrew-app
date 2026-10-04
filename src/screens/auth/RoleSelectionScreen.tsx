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
  User,
  Camera,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Tag,
} from 'lucide-react-native';

export type OnboardingRoleType = 'customer' | 'professional' | 'business';

const CLIENT_INTEREST_TAGS = [
  'Weddings',
  'Commercial Shoots',
  'Fashion & Portraits',
  'Music Videos',
  'Events & Parties',
  'Corporate & Interviews',
  'Drone & Aerial',
  'Film & Documentaries',
];

const EXPERIENCE_OPTIONS = [
  { label: '1 - 2 yrs', value: '1' },
  { label: '3 - 5 yrs', value: '3' },
  { label: '6 - 10 yrs', value: '6' },
  { label: '10+ yrs', value: '10' },
];

export const RoleSelectionScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const { user, login, updateUser, setActiveRole } = useAuthStore();

  const initialRole = (route?.params?.roleType as OnboardingRoleType) || 'customer';
  const initialEmail = route?.params?.email || user?.email || '';
  const initialPhone = route?.params?.phone || user?.phone || '';
  const initialName = route?.params?.name || user?.name || '';

  // Account Type Selection
  const [selectedRoleType, setSelectedRoleType] = useState<OnboardingRoleType>(initialRole);

  // Common Fields
  const [fullName, setFullName] = useState(initialName);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState('camqrewPass123!');

  // Location State
  const [locationState, setLocationState] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [locationCity, setLocationCity] = useState('');

  // Creator Fields
  const [selectedCategory, setSelectedCategory] = useState('Photographers');
  const [proTitle, setProTitle] = useState('');
  const [ratePerDay, setRatePerDay] = useState('');
  const [experienceYears, setExperienceYears] = useState('3');

  // Studio Fields
  const [studioSpecialty, setStudioSpecialty] = useState('Commercials & Ad Films');
  const [teamSize, setTeamSize] = useState('5-15 crew members');
  const [gstin, setGstin] = useState('');

  // Client Fields
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
    if (selectedRoleType === 'business' && !companyName.trim()) {
      showError('Please enter your studio or production company name.');
      return;
    }
    if (selectedRoleType !== 'business' && !fullName.trim()) {
      showError('Please enter your full name.');
      return;
    }
    if (!locationState || !locationCity) {
      showError('Please select your operating state and city.');
      return;
    }
    if (selectedRoleType === 'professional' && (!ratePerDay || Number(ratePerDay) <= 0)) {
      showError('Please specify your standard daily rate.');
      return;
    }

    setLoading(true);

    try {
      const resolvedRole = selectedRoleType === 'customer' ? 'customer' : 'professional';
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const formattedPhone = cleanPhone ? `+91 ${cleanPhone}` : (user?.phone || '+91 9876543210');
      const resolvedName = fullName.trim() || companyName.trim() || user?.name || 'User';

      // 1. If user is already authenticated (e.g. from Google SSO or phone session)
      if (user && user.id && !user.id.startsWith('new-') && !user.id.startsWith('demo-')) {
        setActiveRole(resolvedRole);

        await supabase.from('users').upsert([{
          id: user.id,
          name: resolvedName,
          email: user.email || email.trim(),
          phone: formattedPhone,
          role: resolvedRole,
          avatar: user.avatar || null,
        }], { onConflict: 'id' });

        updateUser({
          name: resolvedName,
          phone: formattedPhone,
          role: resolvedRole,
        });

        if (resolvedRole === 'professional') {
          const proPayload: any = {
            id: user.id,
            userId: user.id,
            name: resolvedName,
            avatar: user.avatar || '',
            title: selectedRoleType === 'business'
              ? `${companyName.trim() || resolvedName} • Studio & Production Agency`
              : (proTitle.trim() || 'Visual Storyteller & Creator'),
            city: locationCity,
            district: locationDistrict || locationCity,
            state: locationState,
            rate_per_day: Number(ratePerDay) || 5000,
            experience_years: Number(experienceYears) || 3,
            categories: selectedRoleType === 'business' ? ['Organisers', 'Photographers'] : [selectedCategory],
            bio: selectedRoleType === 'business'
              ? `${companyName.trim()} is a creative studio specializing in ${studioSpecialty}. Team size: ${teamSize}.`
              : `Experienced ${selectedCategory} based in ${locationCity}, ${locationState}. Available for commercial, wedding, and event projects nationwide.`,
          };

          await supabase.from('professional_profiles').upsert([proPayload]);
        }

        navigation.replace('MainApp');
        return;
      }

      // 2. Fresh registration via email & password
      if (resolvedRole === 'customer') {
        const res = await authApi.registerCustomer({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone || '9876543210',
          password: password || 'camqrewPass123!',
        });
        await login(res.user, res.token);
      } else {
        const proPayload = {
          name: fullName.trim() || companyName.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone || '9876543210',
          password: password || 'camqrewPass123!',
          title: selectedRoleType === 'business'
            ? `${companyName.trim() || fullName.trim()} • Studio & Production Agency`
            : (proTitle.trim() || 'Visual Storyteller & Creator'),
          city: locationCity,
          district: locationDistrict || locationCity,
          state: locationState,
          ratePerDay: Number(ratePerDay) || 5000,
          experienceYears: Number(experienceYears) || 3,
          categories: selectedRoleType === 'business' ? ['Organisers', 'Photographers'] : [selectedCategory],
          bio: selectedRoleType === 'business'
            ? `${companyName.trim()} is a creative studio specializing in ${studioSpecialty}. Team size: ${teamSize}.`
            : `Experienced ${selectedCategory} based in ${locationCity}, ${locationState}. Available for commercial, wedding, and event projects nationwide.`,
        };

        const res = await authApi.registerProfessional(proPayload);
        await login(res.user, res.token);
      }

      navigation.replace('MainApp');
    } catch (err: any) {
      showError(err.message || 'Setup failed. Please check your details and try again.');
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
        {/* Header Nav */}
        <View style={[styles.headerNav, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            CAM<Text style={{ color: '#3fb668' }}>QREW</Text>
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Toast visible={!!toast} message={toast} type={toastType} onDismiss={() => setToast('')} />

          {/* Title Area */}
          <View style={styles.titleSection}>
            <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>
              Complete Your Profile
            </Text>
            <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
              Choose your account type and fill in your details to get started.
            </Text>
          </View>

          {/* 1. Account Type Selector (Stroke-Free Minimal Row) */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>ACCOUNT TYPE</Text>
            <View style={styles.roleGrid}>
              
              {/* Client */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedRoleType('customer')}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: selectedRoleType === 'customer'
                      ? (isDark ? 'rgba(63, 182, 104, 0.16)' : 'rgba(63, 182, 104, 0.10)')
                      : colors.surfaceCard,
                  },
                ]}
              >
                <View style={[
                  styles.roleIconBox,
                  { backgroundColor: selectedRoleType === 'customer' ? '#3fb668' : colors.inputBackground }
                ]}>
                  <User size={16} color={selectedRoleType === 'customer' ? '#ffffff' : colors.textPrimary} />
                </View>
                <Text style={[styles.roleCardTitle, { color: selectedRoleType === 'customer' ? '#3fb668' : colors.textPrimary }]}>
                  Client
                </Text>
                <Text style={[styles.roleCardSub, { color: colors.textSecondary }]}>
                  Book & Rent
                </Text>
              </TouchableOpacity>

              {/* Creator */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedRoleType('professional')}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: selectedRoleType === 'professional'
                      ? (isDark ? 'rgba(63, 182, 104, 0.16)' : 'rgba(63, 182, 104, 0.10)')
                      : colors.surfaceCard,
                  },
                ]}
              >
                <View style={[
                  styles.roleIconBox,
                  { backgroundColor: selectedRoleType === 'professional' ? '#3fb668' : colors.inputBackground }
                ]}>
                  <Camera size={16} color={selectedRoleType === 'professional' ? '#ffffff' : colors.textPrimary} />
                </View>
                <Text style={[styles.roleCardTitle, { color: selectedRoleType === 'professional' ? '#3fb668' : colors.textPrimary }]}>
                  Creator
                </Text>
                <Text style={[styles.roleCardSub, { color: colors.textSecondary }]}>
                  Get Booked
                </Text>
              </TouchableOpacity>

              {/* Studio */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedRoleType('business')}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: selectedRoleType === 'business'
                      ? (isDark ? 'rgba(63, 182, 104, 0.16)' : 'rgba(63, 182, 104, 0.10)')
                      : colors.surfaceCard,
                  },
                ]}
              >
                <View style={[
                  styles.roleIconBox,
                  { backgroundColor: selectedRoleType === 'business' ? '#3fb668' : colors.inputBackground }
                ]}>
                  <Building2 size={16} color={selectedRoleType === 'business' ? '#ffffff' : colors.textPrimary} />
                </View>
                <Text style={[styles.roleCardTitle, { color: selectedRoleType === 'business' ? '#3fb668' : colors.textPrimary }]}>
                  Studio
                </Text>
                <Text style={[styles.roleCardSub, { color: colors.textSecondary }]}>
                  Fleet & Crew
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* 2. Common Details */}
          {selectedRoleType === 'business' ? (
            <>
              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>STUDIO / AGENCY NAME *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder="e.g. Apex Cinema Works"
                  placeholderTextColor={colors.textFaint}
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>CONTACT PERSON *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder="e.g. Rohit Malhotra"
                  placeholderTextColor={colors.textFaint}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </>
          ) : (
            <View style={styles.fieldBlock}>
              <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>FULL NAME *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                placeholder="e.g. Rahul Verma"
                placeholderTextColor={colors.textFaint}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          )}

          {/* Email & Phone */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
              placeholder="name@example.com"
              placeholderTextColor={colors.textFaint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>MOBILE (WHATSAPP) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.textFaint}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Operating Location */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>OPERATING LOCATION (INDIA) *</Text>
            <LocationCascader
              selectedState={locationState}
              selectedDistrict={locationDistrict}
              selectedCity={locationCity}
              onSelect={(state, district, city) => {
                setLocationState(state);
                setLocationDistrict(district);
                setLocationCity(city);
              }}
              label="Select State & City"
              required
            />
          </View>

          {/* 3. Contextual Fields: CREATOR */}
          {selectedRoleType === 'professional' && (
            <>
              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>PRIMARY CRAFT *</Text>
                <CategoryDropdown
                  value={selectedCategory}
                  onSelect={setSelectedCategory}
                  placeholder="Select primary category"
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>EXPERIENCE LEVEL</Text>
                <View style={styles.chipRow}>
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setExperienceYears(opt.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: experienceYears === opt.value
                            ? '#3fb668'
                            : colors.inputBackground,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: experienceYears === opt.value ? '#fff' : colors.textPrimary }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>PROFESSIONAL HEADLINE *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder="e.g. Commercial & Fashion Photographer"
                  placeholderTextColor={colors.textFaint}
                  value={proTitle}
                  onChangeText={setProTitle}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>STANDARD DAY RATE (INR) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder="e.g. 8000"
                  placeholderTextColor={colors.textFaint}
                  value={ratePerDay}
                  onChangeText={setRatePerDay}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          {/* 4. Contextual Fields: STUDIO */}
          {selectedRoleType === 'business' && (
            <>
              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>STUDIO SPECIALTY</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder="e.g. Commercials, Ad Films, Rentals"
                  placeholderTextColor={colors.textFaint}
                  value={studioSpecialty}
                  onChangeText={setStudioSpecialty}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>TEAM SIZE</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder="e.g. 5-15 crew members"
                  placeholderTextColor={colors.textFaint}
                  value={teamSize}
                  onChangeText={setTeamSize}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>GSTIN (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder="22AAAAA0000A1Z5"
                  placeholderTextColor={colors.textFaint}
                  value={gstin}
                  onChangeText={setGstin}
                  autoCapitalize="characters"
                />
              </View>
            </>
          )}

          {/* 5. Contextual Fields: CLIENT */}
          {selectedRoleType === 'customer' && (
            <View style={styles.fieldBlock}>
              <Text style={[styles.fadedLabel, { color: colors.textSecondary }]}>PROJECT INTERESTS</Text>
              <View style={styles.chipWrap}>
                {CLIENT_INTEREST_TAGS.map(tag => {
                  const active = clientInterests.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleInterest(tag)}
                      style={[
                        styles.interestChip,
                        {
                          backgroundColor: active ? (isDark ? 'rgba(63, 182, 104, 0.2)' : 'rgba(63, 182, 104, 0.12)') : colors.inputBackground,
                        },
                      ]}
                    >
                      <Text style={[styles.interestChipText, { color: active ? '#3fb668' : colors.textSecondary }]}>
                        {active ? '✓ ' : '+ '}{tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Submit Action */}
          <View style={styles.actionContainer}>
            <Button
              title="Complete Setup →"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleCompleteSetup}
              style={{ width: '100%' }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerNav: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  brandTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  titleSection: { marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  subTitle: { fontSize: 13, lineHeight: 18 },
  fieldBlock: { marginBottom: 16 },
  fadedLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  roleCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  roleCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  roleCardSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
});
