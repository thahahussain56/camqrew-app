import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { bookingApi } from '../../api/bookingApi';
import { orderApi } from '../../api/orderApi';
import { Booking } from '../../types/booking';
import { Order } from '../../types/order';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { BookingCard } from '../../components/cards/BookingCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { Settings, Calendar, ShoppingBag, LogOut } from 'lucide-react-native';

export const CustomerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'bookings' | 'orders' | 'payments' | 'rewards'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      bookingApi.getCustomerBookings().then(res => setBookings(Array.isArray(res) ? res : []));
      orderApi.getOrders().then(res => setOrders(Array.isArray(res) ? res : []));
    }, [])
  );

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMessage} message={toastMessage} type="success" onDismiss={() => setToastMessage('')} />
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.userRow}>
          <Avatar source={user?.avatar} size={64} />
          <View style={styles.userMeta}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'Customer Profile'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || 'customer@camcrew.in'}</Text>
            <Text style={[styles.userRole, { color: colors.accent }]}>Role: Customer</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs: Bookings vs Gear Orders */}
      <View style={[styles.tabBar, { backgroundColor: colors.chipBg, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bookings' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab('bookings')}
        >
          <Calendar size={16} color={activeTab === 'bookings' ? '#000000' : colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, { color: activeTab === 'bookings' ? '#000000' : colors.textSecondary }]}>
            My Bookings ({safeBookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'payments' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'payments' ? '#000000' : colors.textSecondary }]}>
            Payments 💳
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'rewards' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'rewards' ? '#000000' : colors.textSecondary }]}>
            Rewards 🎁
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.listContent}>
        {activeTab === 'bookings' ? (
          safeBookings.length > 0 ? (
            safeBookings.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onPay={async () => {
                  await bookingApi.payAndConfirmBooking(b.id);
                  setToastMessage(`Payment of ₹${b.totalAmount.toLocaleString('en-IN')} complete! Locked in Escrow Protection.`);
                  bookingApi.getCustomerBookings().then(res => setBookings(Array.isArray(res) ? res : []));
                }}
                onChat={() => navigation.navigate('Chat', { creatorId: b.professionalId, creatorName: b.professionalName, isPaidUnlocked: true })}
                onReleaseMilestone={async (mId) => {
                  await bookingApi.releaseMilestone(b.id, mId);
                  setToastMessage('Milestone escrow funds released to creator!');
                  bookingApi.getCustomerBookings().then(res => setBookings(Array.isArray(res) ? res : []));
                }}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textFaint }]}>No bookings placed yet.</Text>
          )
        ) : activeTab === 'orders' ? (
          safeOrders.length > 0 ? (
            safeOrders.map(o => (
              <OrderCard
                key={o.id}
                order={o}
                onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textFaint }]}>No gear orders placed yet.</Text>
          )
        ) : activeTab === 'payments' ? (
          <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surfaceCard }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: 10 }}>Saved Payment Methods</Text>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.chipBg, marginBottom: 8 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>💳 HDFC Bank Credit Card (•••• 4892)</Text>
              <Text style={{ color: colors.textFaint, fontSize: 11, marginTop: 2 }}>Expires 08/29 • Primary Saved Card</Text>
            </View>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.chipBg }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>⚡ UPI VPA: thaha@okicici</Text>
              <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '800', marginTop: 2 }}>✓ Verified Fast Checkout</Text>
            </View>
          </View>
        ) : (
          <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surfaceCard }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>Loyalty Rewards & Coupons 🎁</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 }}>
              <View>
                <Text style={{ color: colors.textFaint, fontSize: 11, fontWeight: '700' }}>LOYALTY POINTS</Text>
                <Text style={{ color: '#fc8019', fontWeight: '900', fontSize: 24 }}>450 Points</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.textFaint, fontSize: 11, fontWeight: '700' }}>TIER</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>🥈 Silver Tier (75%)</Text>
              </View>
            </View>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(252,128,25,0.08)', borderWidth: 1, borderColor: '#fc8019' }}>
              <Text style={{ color: '#fc8019', fontWeight: '900', fontSize: 14 }}>Coupon: CREATOR20</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Get 20% OFF on your first camera gear rental!</Text>
            </View>
          </View>
        )}
      </View>

      <Button
        title="Sign Out"
        variant="ghost"
        size="md"
        icon={<LogOut size={16} color={colors.danger} />}
        onPress={() => {
          logout();
          navigation.replace('Auth');
        }}
        style={{ marginTop: 30 }}
        textStyle={{ color: colors.danger }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 68,
  },
  header: {
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userMeta: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  settingsBtn: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    marginVertical: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 14,
  },
});
