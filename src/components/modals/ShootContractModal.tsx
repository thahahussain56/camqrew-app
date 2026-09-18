import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Share
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Booking } from '../../types/booking';
import { generateProductionContract, formatContractAsPlainText, ProductionContract } from '../../utils/contractGenerator';
import { bookingApi } from '../../api/bookingApi';
import { 
  X, 
  ShieldCheck, 
  Share2, 
  CheckCircle2, 
  Clock, 
  PenTool, 
  Calendar, 
  MapPin,
  FileText,
  AlertTriangle
} from 'lucide-react-native';

interface ShootContractModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  currentUserId?: string;
  onContractSigned?: () => void;
}

export const ShootContractModal: React.FC<ShootContractModalProps> = ({
  visible,
  booking,
  onClose,
  currentUserId,
  onContractSigned,
}) => {
  const { colors } = useTheme();
  const [signatureName, setSignatureName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signingSuccess, setSigningSuccess] = useState(false);

  if (!booking) return null;

  const contract: ProductionContract = generateProductionContract(booking);
  const isClient = currentUserId === booking.customerId;
  const isPro = currentUserId === booking.professionalId;
  const alreadySigned = isClient ? contract.signatures.clientSigned : isPro ? contract.signatures.proSigned : false;

  const handleShare = async () => {
    try {
      const contractText = formatContractAsPlainText(contract);
      await Share.share({
        title: `Production Contract ${contract.contractId}`,
        message: contractText,
      });
    } catch (err) {
      console.warn('Share error', err);
    }
  };

  const handleSign = async () => {
    if (!signatureName.trim()) {
      Alert.alert('Missing Name', 'Please type your full legal name to digitally sign.');
      return;
    }

    setSigning(true);
    try {
      const role = isPro ? 'professional' : 'customer';
      await bookingApi.signContract(booking.id, signatureName.trim(), role);
      setSigningSuccess(true);
      if (onContractSigned) onContractSigned();
      Alert.alert('Contract Signed! ✍️', 'Your digital signature has been recorded and timestamped under the IT Act 2000.');
    } catch (err: any) {
      Alert.alert('Signing Error', err.message || 'Failed to sign contract.');
    } finally {
      setSigning(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          
          {/* Header Bar */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Shoot Agreement</Text>
              <Text style={[styles.headerRef, { color: colors.accent }]}>{contract.contractId}</Text>
            </View>

            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Share2 size={19} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Document Content */}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Status Pill */}
            <View style={styles.statusRow}>
              <View style={[
                styles.statusBadge,
                contract.status === 'fully_executed' && { backgroundColor: 'rgba(63, 182, 104, 0.15)', borderColor: '#3fb668' },
                contract.status !== 'fully_executed' && { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' },
              ]}>
                <ShieldCheck size={12} color={contract.status === 'fully_executed' ? '#3fb668' : '#f59e0b'} style={{ marginRight: 4 }} />
                <Text style={[
                  styles.statusText,
                  { color: contract.status === 'fully_executed' ? '#3fb668' : '#f59e0b' }
                ]}>
                  {contract.status === 'fully_executed' ? 'FULLY EXECUTED & BINDING' : 'PENDING SIGNATURE'}
                </Text>
              </View>
              <Text style={[styles.dateText, { color: colors.textFaint }]}>{contract.effectiveDate}</Text>
            </View>

            {/* Document Title */}
            <Text style={[styles.docHeading, { color: colors.textPrimary }]}>
              Master Production Service Agreement
            </Text>
            <Text style={[styles.docSub, { color: colors.textSecondary }]}>
              Executed pursuant to the Indian Contract Act, 1872 & Information Technology Act, 2000.
            </Text>

            {/* Parties */}
            <View style={[styles.partiesContainer, { borderColor: colors.borderLight }]}>
              <View style={[styles.partyCard, { backgroundColor: colors.surfaceCard }]}>
                <Text style={[styles.partyRole, { color: colors.accent }]}>CLIENT / PRODUCER</Text>
                <Text style={[styles.partyName, { color: colors.textPrimary }]}>{contract.client.name}</Text>
                <Text style={[styles.partyId, { color: colors.textFaint }]}>ID: {contract.client.id.slice(0, 10)}...</Text>
              </View>

              <View style={[styles.partyCard, { backgroundColor: colors.surfaceCard, marginTop: 8 }]}>
                <Text style={[styles.partyRole, { color: colors.accent }]}>CREATIVE SPECIALIST</Text>
                <Text style={[styles.partyName, { color: colors.textPrimary }]}>{contract.creator.name}</Text>
                <Text style={[styles.partyId, { color: colors.textFaint }]}>{contract.creator.title || 'Verified Creator'}</Text>
              </View>
            </View>

            {/* Scope & Schedule */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
              <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>1. Production Scope & Venue</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Service:</Text>
                <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{booking.serviceTitle}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dates:</Text>
                <Text style={[styles.detailVal, { color: colors.textPrimary }]}>
                  {contract.shootSchedule.startDate} to {contract.shootSchedule.endDate} ({contract.shootSchedule.daysCount} Day/s)
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Hours:</Text>
                <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{contract.shootSchedule.hours}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Venue:</Text>
                <Text style={[styles.detailVal, { color: colors.textPrimary }]}>{contract.shootSchedule.venueAddress}</Text>
              </View>
            </View>

            {/* 3-Tier Escrow Breakdown */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
              <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>2. Escrow Consideration & Milestones</Text>
              <Text style={[styles.escrowTotal, { color: colors.accent }]}>
                Total Contract Fee: ₹{contract.financialTerms.totalFee.toLocaleString('en-IN')}
              </Text>

              <View style={[styles.milestoneMiniRow, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.milestoneMiniTitle, { color: colors.textPrimary }]}>Stage 1: Advance Lock (30%)</Text>
                <Text style={[styles.milestoneMiniAmount, { color: colors.accent }]}>₹{contract.financialTerms.advanceEscrow.toLocaleString('en-IN')}</Text>
              </View>

              <View style={[styles.milestoneMiniRow, { backgroundColor: colors.surfaceElevated, marginTop: 6 }]}>
                <Text style={[styles.milestoneMiniTitle, { color: colors.textPrimary }]}>Stage 2: Shoot Wrap (40%)</Text>
                <Text style={[styles.milestoneMiniAmount, { color: colors.accent }]}>₹{contract.financialTerms.wrapEscrow.toLocaleString('en-IN')}</Text>
              </View>

              <View style={[styles.milestoneMiniRow, { backgroundColor: colors.surfaceElevated, marginTop: 6 }]}>
                <Text style={[styles.milestoneMiniTitle, { color: colors.textPrimary }]}>Stage 3: Final Delivery (30%)</Text>
                <Text style={[styles.milestoneMiniAmount, { color: colors.accent }]}>₹{contract.financialTerms.finalEscrow.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Legal Clauses */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
              <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>3. Legal Clauses & IP Rights</Text>
              {contract.termsAndClauses.map((c) => (
                <View key={c.id} style={{ marginBottom: 12 }}>
                  <Text style={[styles.clauseHeading, { color: colors.textPrimary }]}>{c.title}</Text>
                  <Text style={[styles.clauseContent, { color: colors.textSecondary }]}>{c.content}</Text>
                </View>
              ))}
            </View>

            {/* Signatures Status */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
              <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>4. Execution & Signatures</Text>

              <View style={[styles.sigStatusBox, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.sigRoleTitle, { color: colors.textSecondary }]}>CLIENT SIGNATURE:</Text>
                {contract.signatures.clientSigned ? (
                  <View style={styles.signedRow}>
                    <CheckCircle2 size={16} color="#3fb668" />
                    <Text style={[styles.signedText, { color: colors.textPrimary }]}>
                      Signed by {contract.signatures.clientSignature} on {contract.signatures.clientSignedAt}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.signedRow}>
                    <Clock size={16} color="var(--text-muted)" />
                    <Text style={[styles.pendingText, { color: colors.textFaint }]}>Awaiting Client Signature</Text>
                  </View>
                )}
              </View>

              <View style={[styles.sigStatusBox, { backgroundColor: colors.surfaceElevated, marginTop: 8 }]}>
                <Text style={[styles.sigRoleTitle, { color: colors.textSecondary }]}>CREATIVE SPECIALIST SIGNATURE:</Text>
                {contract.signatures.proSigned ? (
                  <View style={styles.signedRow}>
                    <CheckCircle2 size={16} color="#3fb668" />
                    <Text style={[styles.signedText, { color: colors.textPrimary }]}>
                      Signed by {contract.signatures.proSignature} on {contract.signatures.proSignedAt}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.signedRow}>
                    <Clock size={16} color="var(--text-muted)" />
                    <Text style={[styles.pendingText, { color: colors.textFaint }]}>Awaiting Specialist Signature</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Digital Signing Input (if current user hasn't signed) */}
            {!alreadySigned && (isClient || isPro) && !signingSuccess && (
              <View style={[styles.signingFormBox, { backgroundColor: 'rgba(63, 182, 104, 0.08)', borderColor: '#3fb668' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <PenTool size={18} color="#3fb668" style={{ marginRight: 8 }} />
                  <Text style={[styles.signingFormTitle, { color: colors.textPrimary }]}>
                    Digitally Sign this Agreement
                  </Text>
                </View>
                <Text style={[styles.signingFormSub, { color: colors.textSecondary }]}>
                  Type your legal name below to execute this contract.
                </Text>

                <TextInput
                  style={[styles.nameInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.borderLight }]}
                  placeholder={`Legal Name (e.g. ${isPro ? contract.creator.name : contract.client.name})`}
                  placeholderTextColor={colors.textFaint}
                  value={signatureName}
                  onChangeText={setSignatureName}
                  editable={!signing}
                />

                <TouchableOpacity
                  style={[styles.signConfirmBtn, { backgroundColor: '#3fb668' }]}
                  onPress={handleSign}
                  disabled={signing || !signatureName.trim()}
                  activeOpacity={0.8}
                >
                  {signing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.signConfirmBtnText}>Confirm & Sign Contract ✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {signingSuccess && (
              <View style={[styles.successSignedBox, { backgroundColor: 'rgba(63, 182, 104, 0.15)' }]}>
                <CheckCircle2 size={20} color="#3fb668" style={{ marginRight: 8 }} />
                <Text style={{ color: '#3fb668', fontWeight: '800', fontSize: 13 }}>
                  Contract Successfully Signed!
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerRef: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
  },
  docHeading: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  docSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  partiesContainer: {
    marginBottom: 16,
  },
  partyCard: {
    padding: 12,
    borderRadius: 12,
  },
  partyRole: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '800',
  },
  partyId: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
  },
  detailVal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  escrowTotal: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  milestoneMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
  },
  milestoneMiniTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  milestoneMiniAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
  clauseHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  clauseContent: {
    fontSize: 11,
    lineHeight: 15,
  },
  sigStatusBox: {
    padding: 12,
    borderRadius: 10,
  },
  sigRoleTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  signedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signedText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  pendingText: {
    fontSize: 12,
  },
  signingFormBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  signingFormTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  signingFormSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  signConfirmBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signConfirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  successSignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
});
