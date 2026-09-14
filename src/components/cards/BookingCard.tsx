import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Booking } from '../../types/booking';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  Calendar, MapPin, ShieldCheck, Check, X, CreditCard,
  MessageSquare, ChevronRight, Lock, Clock
} from 'lucide-react-native';
import { BookingDetailModal } from '../modals/BookingDetailModal';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onPay?: () => void;
  onChat?: () => void;
  onReleaseMilestone?: (milestoneId: string) => void;
  isProfessionalMode?: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  onAccept,
  onDecline,
  onPay,
  onChat,
  onReleaseMilestone,
  isProfessionalMode = false,
}) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const isPaid = booking.status === 'confirmed' || booking.status === 'escrow_held' || booking.status === 'completed';
  const isAccepted = booking.status === 'accepted';
  const isPending = booking.status === 'pending';

  // Format clean date string (e.g. "22 Aug 2026 • 1 Day")
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

  const getStatusBadge = () => {
    if (isPaid) {
      return (
        <View style={[styles.badgePill, { backgroundColor: 'rgba(63,182,104,0.15)', borderColor: '#3fb668' }]}>
          <ShieldCheck size={12} color="#3fb668" style={{ marginRight: 3 }} />
          <Text style={[styles.badgeText, { color: '#3fb668' }]}>PAID & CONFIRMED</Text>
        </View>
      );
    }
    if (isAccepted) {
      return (
        <View style={[styles.badgePill, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b' }]}>
          <Text style={[styles.badgeText, { color: '#f59e0b' }]}>ACCEPTED • PAY NOW</Text>
        </View>
      );
    }
    if (booking.status === 'completed') {
      return (
        <View style={[styles.badgePill, { backgroundColor: 'rgba(63,182,104,0.15)', borderColor: '#3fb668' }]}>
          <Text style={[styles.badgeText, { color: '#3fb668' }]}>COMPLETED ✨</Text>
        </View>
      );
    }
    if (booking.status === 'cancelled') {
      return (
        <View style={[styles.badgePill, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' }]}>
          <Text style={[styles.badgeText, { color: '#ef4444' }]}>CANCELLED</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badgePill, { backgroundColor: 'rgba(156,163,175,0.15)', borderColor: '#9ca3af' }]}>
        <Clock size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>PENDING APPROVAL</Text>
      </View>
    );
  };

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      setModalVisible(true);
    }
  };

  return (
    <>
      <Card style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight, borderWidth: 1 }]}>
        {/* Tappable Card Body */}
        <TouchableOpacity activeOpacity={0.88} onPress={handleCardPress}>
          
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Avatar source={booking.professionalAvatar} size={46} />
            <View style={styles.proMeta}>
              <Text style={[styles.proName, { color: colors.textPrimary }]} numberOfLines={1}>
                {isProfessionalMode ? (booking.customerName || 'Client Request') : booking.professionalName}
              </Text>
              <Text style={[styles.serviceTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {booking.serviceTitle || 'Creative Service Booking'}
              </Text>
            </View>
            {getStatusBadge()}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Basic Summary Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Calendar size={14} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={[styles.detailText, { color: colors.textPrimary }]}>
                {formattedStartDate} {isSameDay ? '' : `- ${formattedEndDate}`} • {booking.daysCount || 1}d
                {booking.startTime ? ` • ${booking.startTime}` : ''}
              </Text>
            </View>

            {Boolean(booking.location) && (
              <View style={styles.detailItem}>
                <MapPin size={14} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {booking.location}
                </Text>
              </View>
            )}
          </View>

          {/* Amount & Escrow Banner in Card */}
          <View style={[styles.amountRow, { backgroundColor: colors.surfaceElevated }]}>
            <View>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Total Amount</Text>
              <Text style={[styles.amountVal, { color: colors.accent }]}>
                ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.escrowPill}>
              {isPaid ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ShieldCheck size={14} color="#3fb668" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#3fb668' }}>Escrow Protected</Text>
                  <ChevronRight size={14} color="#3fb668" style={{ marginLeft: 2 }} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>View Details</Text>
                  <ChevronRight size={14} color={colors.textSecondary} style={{ marginLeft: 2 }} />
                </View>
              )}
            </View>
          </View>

        </TouchableOpacity>

        {/* Action Button Section */}

        {/* 1. If Paid / Confirmed: Show Chat with Creator Button ONLY (Never ask for payment again) */}
        {isPaid && onChat && (
          <TouchableOpacity
            style={[styles.actionBtnPrimary, { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={onChat}
          >
            <MessageSquare size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Chat with Creator 💬</Text>
          </TouchableOpacity>
        )}

        {/* 2. If Accepted & Unpaid: Show Pay Now Button */}
        {!isProfessionalMode && isAccepted && !isPaid && onPay && (
          <TouchableOpacity
            style={[styles.actionBtnPrimary, { backgroundColor: '#3fb668' }]}
            activeOpacity={0.85}
            onPress={onPay}
          >
            <CreditCard size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Pay Escrow Deposit • ₹{Number(booking.totalAmount).toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
        )}

        {/* 3. Professional Mode: Accept / Decline for Pending Requests */}
        {isProfessionalMode && isPending && (
          <View style={styles.proActionRow}>
            <TouchableOpacity
              style={[styles.proActionBtn, { backgroundColor: '#16a34a' }]}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <Check size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.proActionText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.proActionBtn, { backgroundColor: '#ef4444' }]}
              onPress={onDecline}
              activeOpacity={0.8}
            >
              <X size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.proActionText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Control Popup Modal */}
      <BookingDetailModal
        visible={modalVisible}
        booking={booking}
        onClose={() => setModalVisible(false)}
        onPay={onPay}
        onChat={onChat}
        onReleaseMilestone={onReleaseMilestone}
        isProfessionalMode={isProfessionalMode}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proMeta: {
    marginLeft: 12,
    flex: 1,
    marginRight: 6,
  },
  proName: {
    fontSize: 16,
    fontWeight: '800',
  },
  serviceTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  detailsGrid: {
    gap: 6,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },
  escrowPill: {
    alignItems: 'flex-end',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  proActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  proActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  proActionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
