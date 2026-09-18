import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { Booking } from '../../types/booking';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  X, Calendar, MapPin, ShieldCheck, Check, Clock, CreditCard,
  MessageSquare, ChevronRight, FileText, Lock
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShootContractModal } from './ShootContractModal';

interface BookingDetailModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onPay?: () => void;
  onChat?: () => void;
  onReleaseMilestone?: (milestoneId: string) => void;
  isProfessionalMode?: boolean;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  visible,
  booking,
  onClose,
  onPay,
  onChat,
  onReleaseMilestone,
  isProfessionalMode = false,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const [showContract, setShowContract] = useState(false);

  if (!booking) return null;

  const isPaid = booking.status === 'confirmed' || booking.status === 'escrow_held' || booking.status === 'completed';
  const isAccepted = booking.status === 'accepted';
  const isPending = booking.status === 'pending';

  // Format date helper
  const formatDate = (rawDate: string) => {
    if (!rawDate) return 'Date TBD';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return rawDate;
    }
  };

  const formattedStartDate = formatDate(booking.startDate);
  const formattedEndDate = formatDate(booking.endDate);
  const isSameDay = formattedStartDate === formattedEndDate;

  // Normalized 3-tier milestones
  const tot = booking.totalAmount || 20000;
  const defaultMilestones = [
    { id: 'm1', title: 'Advance Escrow (30%)', amount: Math.round(tot * 0.3), status: isPaid ? 'released' : 'held' },
    { id: 'm2', title: 'Shoot Wrap Escrow (40%)', amount: Math.round(tot * 0.4), status: 'held' },
    { id: 'm3', title: 'Final Deliverables Escrow (30%)', amount: tot - Math.round(tot * 0.3) - Math.round(tot * 0.4), status: 'held' },
  ];

  // If booking has db milestones, deduplicate them or use them
  const rawMilestones = (booking.milestones && booking.milestones.length > 0) ? booking.milestones : defaultMilestones;
  
  // Deduplicate milestones by title if duplicate inserts occurred in DB
  const seenTitles = new Set<string>();
  const milestones = rawMilestones.filter(m => {
    if (seenTitles.has(m.title)) return false;
    seenTitles.add(m.title);
    return true;
  });

  const releasedCount = milestones.filter(m => m.status === 'released').length;

  const handleReleasePress = (milestoneId: string, title: string, amount: number) => {
    Alert.alert(
      'Release Milestone Funds',
      `Are you sure you want to release ₹${amount.toLocaleString('en-IN')} for "${title}" to ${booking.professionalName}?\n\nThis will transfer the funds from Escrow to the creator's payout wallet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Release 💸',
          style: 'default',
          onPress: () => onReleaseMilestone?.(milestoneId),
        },
      ]
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
          {/* Top Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View style={[styles.dragHandle, { backgroundColor: colors.borderLight }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Booking & Escrow</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>ID: {booking.id.slice(0, 8)}...</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Host Card */}
            <View style={[styles.hostCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight, borderWidth: 1 }]}>
              <Avatar source={booking.professionalAvatar} size={54} />
              <View style={styles.hostMeta}>
                <Text style={[styles.hostName, { color: colors.textPrimary }]}>
                  {isProfessionalMode ? (booking.customerName || 'Client') : booking.professionalName}
                </Text>
                <Text style={[styles.serviceTitle, { color: colors.accent }]}>
                  {booking.serviceTitle || 'Professional Booking'}
                </Text>
              </View>
              <View style={styles.badgeWrapper}>
                {isPaid && (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(63,182,104,0.15)', borderColor: '#3fb668' }]}>
                    <ShieldCheck size={13} color="#3fb668" style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: '#3fb668' }]}>PAID & SECURED</Text>
                  </View>
                )}
                {isAccepted && !isPaid && (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#f59e0b' }]}>ACCEPTED • PAY</Text>
                  </View>
                )}
                {isPending && (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(156,163,175,0.15)', borderColor: '#9ca3af' }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>PENDING</Text>
                  </View>
                )}
                {booking.status === 'completed' && (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(63,182,104,0.15)', borderColor: '#3fb668' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#3fb668' }]}>COMPLETED ✨</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Escrow Banner */}
            {isPaid ? (
              <View style={[styles.escrowBanner, { backgroundColor: 'rgba(63,182,104,0.1)', borderColor: '#3fb668' }]}>
                <ShieldCheck size={20} color="#3fb668" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.escrowBannerTitle, { color: colors.textPrimary }]}>100% Escrow Protected</Text>
                  <Text style={[styles.escrowBannerSub, { color: colors.textSecondary }]}>
                    Your funds of ₹{booking.totalAmount.toLocaleString('en-IN')} are safely locked. Release milestones as the creator completes the work.
                  </Text>
                </View>
              </View>
            ) : isAccepted ? (
              <View style={[styles.escrowBanner, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: '#f59e0b' }]}>
                <Clock size={20} color="#f59e0b" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.escrowBannerTitle, { color: colors.textPrimary }]}>Host Accepted Your Request</Text>
                  <Text style={[styles.escrowBannerSub, { color: colors.textSecondary }]}>
                    Deposit funds into Escrow to confirm the shoot date and unlock real-time chat.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Schedule & Venue Section */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight, borderWidth: 1 }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📅 Schedule & Location</Text>
              
              <View style={styles.detailRow}>
                <Calendar size={16} color={colors.accent} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {formattedStartDate} {isSameDay ? '' : `- ${formattedEndDate}`} ({booking.daysCount || 1} Day)
                </Text>
              </View>

              {booking.startTime && (
                <View style={styles.detailRow}>
                  <Clock size={16} color={colors.accent} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Hours:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {booking.startTime} - {booking.endTime || 'Wrap'}
                  </Text>
                </View>
              )}

              {Boolean(booking.location) && (
                <View style={styles.detailRow}>
                  <MapPin size={16} color={colors.accent} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Venue:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={2}>
                    {booking.location}
                  </Text>
                </View>
              )}

              {/* Shoot Contract Review / Signed Info */}
              <TouchableOpacity 
                style={[styles.viewContractBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                activeOpacity={0.8}
                onPress={() => setShowContract(true)}
              >
                <FileText size={15} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.viewContractBtnText, { color: colors.textPrimary }]}>
                  {booking.contractSignature ? '📄 View Signed Shoot Contract' : '📄 Review & Sign Shoot Contract'}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              {Boolean(booking.contractSignature) && (
                <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 10, marginTop: 6 }]}>
                  <FileText size={16} color={colors.accent} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Contract:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary, fontWeight: '700' }]}>
                    ✍️ Signed by {booking.contractSignature}
                  </Text>
                </View>
              )}
            </View>

            {/* Escrow Milestones Controller */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight, borderWidth: 1 }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🔒 Escrow Milestones</Text>
                {isPaid && (
                  <Text style={[styles.progressTag, { color: colors.accent }]}>
                    {releasedCount}/{milestones.length} Released
                  </Text>
                )}
              </View>

              {/* Progress visual bar */}
              {isPaid && (
                <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceElevated }]}>
                  <View style={[styles.progressBarFill, { width: `${(releasedCount / milestones.length) * 100}%`, backgroundColor: colors.accent }]} />
                </View>
              )}

              {milestones.map((m, index) => {
                const isReleased = m.status === 'released';
                return (
                  <View key={m.id || index} style={[styles.milestoneItem, { backgroundColor: colors.surfaceElevated, borderColor: isReleased ? '#3fb668' : 'transparent', borderWidth: 1 }]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.milestoneItemTitle, { color: colors.textPrimary }]}>
                        {m.title}
                      </Text>
                      <Text style={[styles.milestoneItemAmount, { color: colors.accent }]}>
                        ₹{Number(m.amount).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {isReleased ? (
                      <View style={styles.releasedPill}>
                        <Check size={12} color="#16a34a" style={{ marginRight: 4 }} />
                        <Text style={styles.releasedPillText}>Released ✓</Text>
                      </View>
                    ) : isPaid && !isProfessionalMode ? (
                      <TouchableOpacity
                        style={styles.releaseActionBtn}
                        onPress={() => handleReleasePress(m.id, m.title, Number(m.amount))}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.releaseActionText}>Release 💸</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.heldPill, { backgroundColor: colors.borderLight }]}>
                        <Lock size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
                        <Text style={[styles.heldPillText, { color: colors.textSecondary }]}>Held</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Financial Breakdown */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight, borderWidth: 1 }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💰 Payment Summary</Text>
              
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Creative Service Base</Text>
                <Text style={[styles.calcVal, { color: colors.textPrimary }]}>₹{(tot - 499 - Math.round(tot * 0.15)).toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Platform Safety Fee</Text>
                <Text style={[styles.calcVal, { color: colors.textPrimary }]}>₹499</Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>GST (18%)</Text>
                <Text style={[styles.calcVal, { color: colors.textPrimary }]}>₹{Math.round(tot * 0.15).toLocaleString('en-IN')}</Text>
              </View>

              <View style={[styles.totalDivider, { backgroundColor: colors.borderLight }]} />

              <View style={styles.calcRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Amount</Text>
                <Text style={[styles.totalVal, { color: colors.accent }]}>₹{tot.toLocaleString('en-IN')}</Text>
              </View>

              <View style={[styles.paidStatusRow, { backgroundColor: isPaid ? 'rgba(63,182,104,0.1)' : 'rgba(245,158,11,0.1)' }]}>
                {isPaid ? (
                  <>
                    <Check size={14} color="#3fb668" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#3fb668', fontWeight: '800', fontSize: 13 }}>Payment Completed in Full ✓</Text>
                  </>
                ) : (
                  <>
                    <Clock size={14} color="#f59e0b" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 13 }}>Payment Pending Deposit</Text>
                  </>
                )}
              </View>
            </View>

          </ScrollView>

          {/* Bottom Actions Bar */}
          <View style={[styles.bottomBar, { borderTopColor: colors.borderLight, backgroundColor: colors.surfaceCard }]}>
            {/* If Paid: Show Direct Chat Button ONLY (Never ask for payment again) */}
            {isPaid && onChat && (
              <TouchableOpacity
                style={[styles.chatBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onChat();
                }}
              >
                <MessageSquare size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.chatBtnText}>Chat with Creator 💬</Text>
              </TouchableOpacity>
            )}

            {/* If Accepted & Unpaid: Show Pay Now Button */}
            {isAccepted && !isPaid && onPay && (
              <TouchableOpacity
                style={[styles.chatBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onPay();
                }}
              >
                <CreditCard size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.chatBtnText}>Pay Escrow Deposit • ₹{tot.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>
            )}

            {/* If Pending */}
            {isPending && (
              <View style={styles.pendingBar}>
                <Clock size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                  Waiting for host confirmation
                </Text>
              </View>
            )}
          </View>

        </View>
      </View>
      </Modal>

      {/* Shoot Contract Modal */}
      <ShootContractModal
        visible={showContract}
        booking={booking}
        currentUserId={user?.id}
        onClose={() => setShowContract(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 8,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  hostMeta: {
    marginLeft: 12,
    flex: 1,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '800',
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  escrowBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  escrowBannerSub: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  sectionBox: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTag: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 6,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  viewContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 6,
  },
  viewContractBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  milestoneItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  milestoneItemAmount: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  releasedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,163,74,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  releasedPillText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '800',
  },
  releaseActionBtn: {
    backgroundColor: '#3fb668',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  releaseActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  heldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heldPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calcLabel: {
    fontSize: 13,
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalDivider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
  },
  totalVal: {
    fontSize: 17,
    fontWeight: '900',
  },
  paidStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  pendingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
