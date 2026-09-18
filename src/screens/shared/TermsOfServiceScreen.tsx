import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  Lock, 
  RotateCcw, 
  Camera, 
  Trash2, 
  AlertTriangle,
  Mail
} from 'lucide-react-native';

type TabKey = 'terms' | 'escrow' | 'cancellation' | 'copyright' | 'privacy' | 'deletion';

export const TermsOfServiceScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const initialTab = (route?.params?.initialTab || 'terms') as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'terms', label: 'Terms of Service', icon: FileText },
    { key: 'escrow', label: '3-Stage Escrow', icon: Lock },
    { key: 'cancellation', label: 'Refunds & Cancel', icon: RotateCcw },
    { key: 'copyright', label: 'Creator IP', icon: Camera },
    { key: 'privacy', label: 'DPDP Privacy', icon: ShieldCheck },
    { key: 'deletion', label: 'Data Erasure', icon: Trash2 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Legal & Compliance</Text>
          <Text style={[styles.headerSub, { color: colors.textFaint }]}>Indian Contract Act & DPDP 2023</Text>
        </View>
      </View>

      {/* Segment Selector */}
      <View style={styles.segmentWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentList}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.segmentItem,
                  isActive && { backgroundColor: 'rgba(63, 182, 104, 0.15)', borderColor: '#3fb668' },
                  !isActive && { borderColor: colors.borderLight }
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Icon size={14} color={isActive ? '#3fb668' : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.segmentText, { color: isActive ? '#3fb668' : colors.textSecondary, fontWeight: isActive ? '800' : '600' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Body */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 1. TERMS OF SERVICE */}
        {activeTab === 'terms' && (
          <Card style={styles.docCard}>
            <Text style={[styles.docRef, { color: colors.textFaint }]}>REF: CC-LEGAL-TOS-2026</Text>
            <Text style={[styles.docTitle, { color: colors.textPrimary }]}>Terms of Service</Text>
            <Text style={[styles.leadText, { color: colors.textSecondary, borderLeftColor: colors.accent }]}>
              By accessing or using the Camcrew mobile application, you agree to be bound by these Terms of Service in compliance with the Information Technology Act, 2000.
            </Text>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>1. Platform Intermediary Role</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                Camcrew operates as a technology intermediary under Section 79 of the IT Act, 2000. We provide an algorithmic talent discovery engine, verified identity badging, milestone escrow holding, and automated production shoot contract generation.
              </Text>
            </View>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>2. Independent Contractor Relationship</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                Creators and Studios listed on Camcrew are independent visual specialists and creative contractors, not employees of Camcrew India Technologies Pvt Ltd. When a booking is confirmed, a direct legal Production Agreement is formed between the Client and Creator.
              </Text>
            </View>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>3. 2.5% Platform Fee</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                Camcrew applies a 2.5% platform technology fee on escrow settlements to maintain automated dispute arbitration, instant UPI gateways, and insured cloud file storage.
              </Text>
            </View>
          </Card>
        )}

        {/* 2. 3-STAGE ESCROW RULES */}
        {activeTab === 'escrow' && (
          <Card style={styles.docCard}>
            <Text style={[styles.docRef, { color: colors.textFaint }]}>REF: CC-LEGAL-ESCROW-2026</Text>
            <Text style={[styles.docTitle, { color: colors.textPrimary }]}>3-Stage Milestone Escrow</Text>
            <Text style={[styles.leadText, { color: colors.textSecondary, borderLeftColor: colors.accent }]}>
              Camcrew eliminates unpaid shoots and abandoned deliverables through our automated 3-stage milestone escrow architecture.
            </Text>

            <View style={[styles.tierCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <View style={styles.tierPillRow}>
                <Text style={[styles.tierPill, { color: colors.accent }]}>STAGE 1 • 30%</Text>
              </View>
              <Text style={[styles.tierTitle, { color: colors.textPrimary }]}>Advance Calendar Lock</Text>
              <Text style={[styles.tierDesc, { color: colors.textSecondary }]}>
                Held in escrow upon booking confirmation to secure dates and prevent last-minute shoot cancellations.
              </Text>
            </View>

            <View style={[styles.tierCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <View style={styles.tierPillRow}>
                <Text style={[styles.tierPill, { color: colors.accent }]}>STAGE 2 • 40%</Text>
              </View>
              <Text style={[styles.tierTitle, { color: colors.textPrimary }]}>Shoot Wrap Milestone</Text>
              <Text style={[styles.tierDesc, { color: colors.textSecondary }]}>
                Released immediately upon completion of principal photography / wrap on set, verified by the client.
              </Text>
            </View>

            <View style={[styles.tierCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <View style={styles.tierPillRow}>
                <Text style={[styles.tierPill, { color: colors.accent }]}>STAGE 3 • 30%</Text>
              </View>
              <Text style={[styles.tierTitle, { color: colors.textPrimary }]}>Final Deliverables Clearance</Text>
              <Text style={[styles.tierDesc, { color: colors.textSecondary }]}>
                Released upon client receipt and approval of high-resolution master video edits or photo archives within the agreed timeline.
              </Text>
            </View>
          </Card>
        )}

        {/* 3. CANCELLATION & REFUNDS */}
        {activeTab === 'cancellation' && (
          <Card style={styles.docCard}>
            <Text style={[styles.docRef, { color: colors.textFaint }]}>REF: CC-LEGAL-REFUNDS-2026</Text>
            <Text style={[styles.docTitle, { color: colors.textPrimary }]}>Cancellation & Refund Policy</Text>
            <Text style={[styles.leadText, { color: colors.textSecondary, borderLeftColor: colors.accent }]}>
              Production shoots require blocking high-demand equipment and crew dates. Our tiered cancellation schedule protects both parties fairly.
            </Text>

            <View style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.tableCellLeft, { color: colors.textPrimary }]}>More than 7 Days before call:</Text>
              <Text style={[styles.tableCellRight, { color: '#3fb668' }]}>90% Escrow Refund</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.tableCellLeft, { color: colors.textPrimary }]}>48 Hours to 7 Days before call:</Text>
              <Text style={[styles.tableCellRight, { color: '#f59e0b' }]}>50% Refund / 50% to Creator</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.tableCellLeft, { color: colors.textPrimary }]}>Less than 48 Hours before call:</Text>
              <Text style={[styles.tableCellRight, { color: '#ef4444' }]}>Advance Escrow Forfeited</Text>
            </View>

            <View style={[styles.clause, { marginTop: 18 }]}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>Bad Weather & Force Majeure</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                Outdoor and drone shoots disrupted by extreme rain, storms, or statutory restrictions may be rescheduled without penalty to a mutually agreeable backup date.
              </Text>
            </View>
          </Card>
        )}

        {/* 4. CREATOR IP */}
        {activeTab === 'copyright' && (
          <Card style={styles.docCard}>
            <Text style={[styles.docRef, { color: colors.textFaint }]}>REF: CC-LEGAL-IP-2026</Text>
            <Text style={[styles.docTitle, { color: colors.textPrimary }]}>Creator IP & Commercial Rights</Text>
            <Text style={[styles.leadText, { color: colors.textSecondary, borderLeftColor: colors.accent }]}>
              Copyright rules established in compliance with the Indian Copyright Act, 1957.
            </Text>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>1. Copyright Prior to Full Payment</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                The Creative Specialist retains master copyright and RAW footage authorship until 100% full final escrow payment is cleared.
              </Text>
            </View>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>2. Commercial License Transfer</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                Upon final escrow release, the Client receives a perpetual, worldwide, commercial license to broadcast, publish, monetize, and edit the final deliverables.
              </Text>
            </View>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>3. Portfolio Showcase Rights</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                Creators retain non-exclusive rights to showcase excerpt clips in their personal showreels and Camcrew profiles unless an explicit NDA was agreed.
              </Text>
            </View>
          </Card>
        )}

        {/* 5. PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <Card style={styles.docCard}>
            <Text style={[styles.docRef, { color: colors.textFaint }]}>REF: CC-LEGAL-DPDP-2026</Text>
            <Text style={[styles.docTitle, { color: colors.textPrimary }]}>Privacy Policy (DPDP 2023)</Text>
            <Text style={[styles.leadText, { color: colors.textSecondary, borderLeftColor: colors.accent }]}>
              Compliant with the Digital Personal Data Protection Act, 2023. We protect your personal, creative, and financial data with enterprise encryption.
            </Text>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>1. Data Collection & Media Access</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                We collect your name, phone number, and email to establish verified communications. Camera and photo library access is used solely when you choose to upload profile avatars or portfolio media.
              </Text>
            </View>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>2. Statutory Grievance Redressal Officer</Text>
              <View style={[styles.grievanceCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <Text style={[styles.clauseText, { color: colors.textPrimary, fontWeight: '700' }]}>Grievance Officer (IT Rules & DPDP Act):</Text>
                <Text style={[styles.clauseText, { color: colors.textSecondary }]}>Name: Thaha Hussain</Text>
                <Text style={[styles.clauseText, { color: colors.textSecondary }]}>Email: grievance@camcrew.in</Text>
                <Text style={[styles.clauseText, { color: colors.textSecondary }]}>Address: Camcrew Studios, Bandra West, Mumbai 400050</Text>
              </View>
            </View>
          </Card>
        )}

        {/* 6. ACCOUNT DELETION */}
        {activeTab === 'deletion' && (
          <Card style={styles.docCard}>
            <Text style={[styles.docRef, { color: colors.textFaint }]}>REF: CC-LEGAL-ERASURE-2026</Text>
            <Text style={[styles.docTitle, { color: colors.textPrimary }]}>Account Deletion & Data Erasure</Text>
            <Text style={[styles.leadText, { color: colors.textSecondary, borderLeftColor: colors.accent }]}>
              In compliance with Apple App Store Guideline 5.1.1(v) and Google Play User Data Policy, you have the right to permanent account deletion.
            </Text>

            <View style={styles.clause}>
              <Text style={[styles.clauseTitle, { color: colors.textPrimary }]}>How to Delete Your Account In-App:</Text>
              <Text style={[styles.clauseText, { color: colors.textSecondary }]}>
                1. Navigate to Settings inside the Camcrew app.{'\n'}
                2. Scroll down to the Danger Zone.{'\n'}
                3. Tap &quot;Delete Account&quot; and confirm your request.{'\n'}
                4. Your profile, portfolio media, and chat sessions are permanently purged immediately.
              </Text>
            </View>

            <View style={[styles.warningBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <AlertTriangle size={18} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={[styles.warningText, { color: colors.textPrimary }]}>
                Account deletion will be rejected if you have active shoots with funds locked in escrow. Complete or cancel active bookings first.
              </Text>
            </View>
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  segmentWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  segmentList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  docCard: {
    padding: 18,
    borderRadius: 16,
  },
  docRef: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  docTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  leadText: {
    fontSize: 13,
    lineHeight: 18,
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 18,
  },
  clause: {
    marginBottom: 16,
  },
  clauseTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  clauseText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tierCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  tierPillRow: {
    marginBottom: 4,
  },
  tierPill: {
    fontSize: 10,
    fontWeight: '800',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  tierDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tableCellLeft: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tableCellRight: {
    fontSize: 12,
    fontWeight: '700',
  },
  grievanceCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    gap: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});

export default TermsOfServiceScreen;
