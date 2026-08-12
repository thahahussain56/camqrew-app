import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Booking } from '../../types/booking';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Calendar, MapPin, DollarSign, Check, X, CreditCard, Clock } from 'lucide-react-native';

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
  const { colors } = useTheme();

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'accepted':
        return <Badge label="Accepted (Pay Now)" variant="warning" />;
      case 'escrow_held':
        return <Badge label="Escrow Protected 🔒" variant="info" />;
      case 'confirmed':
        return <Badge label="Paid & Confirmed" variant="success" />;
      case 'completed':
        return <Badge label="Completed ✨" variant="success" />;
      case 'cancelled':
        return <Badge label="Cancelled" variant="danger" />;
      case 'pending':
      default:
        return <Badge label="Pending Approval" variant="warning" />;
    }
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={!onPress}>
        <View style={styles.header}>
          <View style={styles.proRow}>
            <Avatar source={booking.professionalAvatar} size={42} />
            <View style={styles.proMeta}>
              <Text style={[styles.proName, { color: colors.textPrimary }]}>
                {isProfessionalMode ? (booking.customerName || 'Client Request') : booking.professionalName}
              </Text>
              <Text style={[styles.serviceTitle, { color: colors.textSecondary }]}>
                {booking.serviceTitle}
              </Text>
            </View>
          </View>
          {getStatusBadge()}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Calendar size={14} color="#fc8019" style={{ marginRight: 6 }} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {booking.startDate} ({booking.daysCount}d) {booking.startTime ? `• ${booking.startTime}` : ''}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <MapPin size={14} color="#fc8019" style={{ marginRight: 6 }} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {booking.location}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <DollarSign size={14} color="#fc8019" style={{ marginRight: 6 }} />
            <Text style={[styles.metaText, { color: colors.textPrimary, fontWeight: '800' }]}>
              ₹{booking.totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Contract Signature Badge */}
        {booking.contractSignature && (
          <View style={styles.contractBadge}>
            <Text style={[styles.contractText, { color: colors.textSecondary }]}>
              ✍️ Signed by: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{booking.contractSignature}</Text>
            </Text>
          </View>
        )}

        {/* 3-Tier Milestone Escrow List (When Escrow is Held) */}
        {(booking.status === 'escrow_held' || booking.status === 'completed' || (booking.milestones && booking.milestones.length > 0)) && (
          <View style={styles.milestoneBox}>
            <Text style={[styles.milestoneHeading, { color: colors.textPrimary }]}>🔒 Escrow Protection Milestones</Text>
            {(booking.milestones || [
              { id: 'm1', title: 'Advance Escrow (30%)', percentage: 30, amount: Math.round(booking.totalAmount * 0.3), status: 'released' },
              { id: 'm2', title: 'Shoot Wrap Escrow (40%)', percentage: 40, amount: Math.round(booking.totalAmount * 0.4), status: 'held' },
              { id: 'm3', title: 'Final Deliverables Escrow (30%)', percentage: 30, amount: Math.round(booking.totalAmount * 0.3), status: 'held' },
            ]).map(m => (
              <View key={m.id} style={[styles.milestoneRow, { backgroundColor: colors.surfaceCard }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.milestoneTitle, { color: colors.textPrimary }]}>{m.title}</Text>
                  <Text style={[styles.milestoneAmt, { color: '#fc8019' }]}>₹{m.amount.toLocaleString('en-IN')}</Text>
                </View>

                {m.status === 'released' ? (
                  <View style={styles.releasedBadge}>
                    <Check size={12} color="#16a34a" style={{ marginRight: 4 }} />
                    <Text style={styles.releasedText}>Released</Text>
                  </View>
                ) : !isProfessionalMode && onReleaseMilestone ? (
                  <TouchableOpacity
                    style={styles.releaseBtn}
                    onPress={() => onReleaseMilestone(m.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.releaseBtnText}>Release 💸</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: colors.textFaint, fontSize: 11, fontWeight: '700' }}>Held in Escrow</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Creator Acceptance Actions (Professional Mode for Pending Requests) */}
        {isProfessionalMode && booking.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <Check size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.btnText}>Accept Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
              onPress={onDecline}
              activeOpacity={0.8}
            >
              <X size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Pay Now Button (When Creator Has Accepted the Booking) */}
        {!isProfessionalMode && booking.status === 'accepted' && (
          <View style={styles.payActionBox}>
            <Text style={[styles.payNotice, { color: colors.textSecondary }]}>
              🎉 Creator accepted your booking! Complete payment to lock into Escrow Protection.
            </Text>
            <Button
              title={`Pay Now • ₹${booking.totalAmount.toLocaleString('en-IN')}`}
              variant="primary"
              size="md"
              icon={<CreditCard size={16} color="#ffffff" style={{ marginRight: 6 }} />}
              onPress={onPay}
              style={{ backgroundColor: '#fc8019', marginTop: 8 }}
            />
          </View>
        )}

        {/* Direct Chat Button (When Booking is Confirmed/Escrow Held) */}
        {onChat && (booking.status === 'escrow_held' || booking.status === 'confirmed' || booking.status === 'completed') && (
          <Button
            title="Chat with Creator 💬"
            variant="outline"
            size="md"
            onPress={onChat}
            style={{ marginTop: 10 }}
          />
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  proMeta: {
    marginLeft: 10,
    flex: 1,
  },
  proName: {
    fontSize: 15,
    fontWeight: '800',
  },
  serviceTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  metaGrid: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
  },
  contractBadge: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(252,128,25,0.08)',
  },
  contractText: {
    fontSize: 11,
  },
  milestoneBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  milestoneHeading: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneAmt: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  releasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(22,163,74,0.15)',
  },
  releasedText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '800',
  },
  releaseBtn: {
    backgroundColor: '#fc8019',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  releaseBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  payActionBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  payNotice: {
    fontSize: 12,
    fontWeight: '600',
  },
});
