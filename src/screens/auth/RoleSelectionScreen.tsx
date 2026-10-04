import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import {
  User,
  Camera,
  Building2,
  CheckCircle2,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';

export type OnboardingRoleType = 'customer' | 'professional' | 'business';

export const RoleSelectionScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const [selectedRole, setSelectedRole] = useState<OnboardingRoleType | null>(null);

  const initialEmail = route?.params?.email || '';
  const initialPhone = route?.params?.phone || '';
  const initialName = route?.params?.name || '';

  const handleContinue = () => {
    if (!selectedRole) return;
    navigation.navigate('OnboardingDetails', {
      roleType: selectedRole,
      email: initialEmail,
      phone: initialPhone,
      name: initialName,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
      >
        {/* Step 1 of 2 Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.stepLabel, { color: '#3fb668' }]}>Step 1 of 2</Text>
            <Text style={[styles.stepPercent, { color: colors.textSecondary }]}>50% Complete</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={[styles.progressFill, { width: '50%', backgroundColor: '#3fb668' }]} />
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>
            Choose your account type
          </Text>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
            Select how you plan to use Camcrew. You can collaborate or switch modes at any time.
          </Text>
        </View>

        {/* 3 Role Selection Cards */}
        <View style={styles.cardsStack}>
          
          {/* 1. Client / Personal */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setSelectedRole('customer')}
            style={[
              styles.card,
              {
                backgroundColor: selectedRole === 'customer'
                  ? (isDark ? 'rgba(63, 182, 104, 0.12)' : 'rgba(45, 164, 90, 0.08)')
                  : colors.surfaceCard,
                borderColor: selectedRole === 'customer' ? '#3fb668' : colors.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: selectedRole === 'customer' ? '#3fb668' : colors.inputBackground }]}>
                <User size={22} color={selectedRole === 'customer' ? '#ffffff' : colors.textPrimary} />
              </View>
              <View style={styles.cardHeaderRight}>
                <View style={styles.badgeWrapper}>
                  <Text style={[styles.typeBadge, { color: selectedRole === 'customer' ? '#3fb668' : colors.textSecondary }]}>
                    HIRE CREW
                  </Text>
                </View>
                <View style={[
                  styles.radioCircle,
                  {
                    borderColor: selectedRole === 'customer' ? '#3fb668' : colors.border,
                    backgroundColor: selectedRole === 'customer' ? '#3fb668' : 'transparent',
                  },
                ]}>
                  {selectedRole === 'customer' && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </View>
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Personal / Client
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              For individuals, brands, and agencies looking to book top creative talent and rent equipment with escrow protection.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <CheckCircle2 size={13} color="#3fb668" />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  Book Photographers, Cinematographers & Crew
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={13} color="#3fb668" />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  100% Escrow Milestone Protection
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. Creator / Professional */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setSelectedRole('professional')}
            style={[
              styles.card,
              {
                backgroundColor: selectedRole === 'professional'
                  ? (isDark ? 'rgba(63, 182, 104, 0.12)' : 'rgba(45, 164, 90, 0.08)')
                  : colors.surfaceCard,
                borderColor: selectedRole === 'professional' ? '#3fb668' : colors.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: selectedRole === 'professional' ? '#3fb668' : colors.inputBackground }]}>
                <Camera size={22} color={selectedRole === 'professional' ? '#ffffff' : colors.textPrimary} />
              </View>
              <View style={styles.cardHeaderRight}>
                <View style={styles.badgeWrapper}>
                  <Text style={[styles.typeBadge, { color: selectedRole === 'professional' ? '#3fb668' : colors.textSecondary }]}>
                    GET BOOKED
                  </Text>
                </View>
                <View style={[
                  styles.radioCircle,
                  {
                    borderColor: selectedRole === 'professional' ? '#3fb668' : colors.border,
                    backgroundColor: selectedRole === 'professional' ? '#3fb668' : 'transparent',
                  },
                ]}>
                  {selectedRole === 'professional' && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </View>
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Creator / Freelancer
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              For filmmakers, photographers, editors, drone pilots, and creative pros offering services and receiving client leads.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <CheckCircle2 size={13} color="#3fb668" />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  Verified Creative Showcase & Day Rates
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={13} color="#3fb668" />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  Guaranteed Escrow Bank / UPI Payouts
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 3. Studio / Business */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setSelectedRole('business')}
            style={[
              styles.card,
              {
                backgroundColor: selectedRole === 'business'
                  ? (isDark ? 'rgba(63, 182, 104, 0.12)' : 'rgba(45, 164, 90, 0.08)')
                  : colors.surfaceCard,
                borderColor: selectedRole === 'business' ? '#3fb668' : colors.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: selectedRole === 'business' ? '#3fb668' : colors.inputBackground }]}>
                <Building2 size={22} color={selectedRole === 'business' ? '#ffffff' : colors.textPrimary} />
              </View>
              <View style={styles.cardHeaderRight}>
                <View style={styles.badgeWrapper}>
                  <Text style={[styles.typeBadge, { color: selectedRole === 'business' ? '#3fb668' : colors.textSecondary }]}>
                    STUDIO & AGENCY
                  </Text>
                </View>
                <View style={[
                  styles.radioCircle,
                  {
                    borderColor: selectedRole === 'business' ? '#3fb668' : colors.border,
                    backgroundColor: selectedRole === 'business' ? '#3fb668' : 'transparent',
                  },
                ]}>
                  {selectedRole === 'business' && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </View>
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Studio / Production House
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              For production houses, media agencies, studios, and rental companies managing multi-member teams and client productions.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <CheckCircle2 size={13} color="#3fb668" />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  Crew Roster & Team Management
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={13} color="#3fb668" />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  GST Invoicing & Equipment Fleet Listings
                </Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>

        {/* Action Button: Disabled until role selected */}
        <View style={styles.actionContainer}>
          <Button
            title={selectedRole ? "Continue to Details (Step 2 of 2) →" : "Select an Account Type"}
            variant="primary"
            size="lg"
            disabled={!selectedRole}
            onPress={handleContinue}
            style={{ width: '100%' }}
          />
        </View>
      </ScrollView>
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
  cardsStack: { gap: 14, marginBottom: 28 },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  typeBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  featuresList: { gap: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12 },
  actionContainer: { marginTop: 4 },
});
