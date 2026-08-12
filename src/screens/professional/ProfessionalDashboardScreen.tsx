import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { bookingApi } from '../../api/bookingApi';
import { ProfessionalProfile } from '../../types/professional';
import { Booking } from '../../types/booking';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingCard } from '../../components/cards/BookingCard';
import { EarningsChart } from '../../components/charts/EarningsChart';
import { BookingsDonut } from '../../components/charts/BookingsDonut';
import { Toast } from '../../components/ui/Toast';
import { ListProductModal } from '../../components/forms/ListProductModal';
import { DollarSign, Calendar, Eye, Star, Edit3, Bell, PlusCircle } from 'lucide-react-native';

export const ProfessionalDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [showListGearModal, setShowListGearModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useFocusEffect(
    useCallback(() => {
      professionalApi.getProfileById('mohammad_thaha_hussain_2').then(setProfile);
      bookingApi.getProfessionalBookings().then(res => setUpcomingBookings(Array.isArray(res) ? res : []));
    }, [])
  );

  const safeBookings = Array.isArray(upcomingBookings) ? upcomingBookings : [];

  if (!profile) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMsg} message={toastMsg} type="success" onDismiss={() => setToastMsg('')} />

      {/* Brand Logo Header */}
      <View style={styles.brandHeaderRow}>
        <Image
          source={
            isDark
              ? require('../../../assets/camcrew-logo-white.png')
              : require('../../../assets/camcrew-logo-dark.png')
          }
          style={styles.brandLogo}
        />
      </View>

      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: '#fc8019' }]}>PRO STUDIO DASHBOARD</Text>
          <Text style={[styles.proName, { color: colors.textPrimary }]}>{profile.name}</Text>
        </View>

        <View style={styles.topRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surfaceCard }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Action Banner: List Equipment for Sale/Rent */}
      <TouchableOpacity
        style={styles.listGearBanner}
        activeOpacity={0.88}
        onPress={() => setShowListGearModal(true)}
      >
        <View style={styles.listGearIconBox}>
          <PlusCircle size={24} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listGearTitle}>Sell or Rent Your Camera Gear</Text>
          <Text style={styles.listGearSub}>Post equipment to the Camcrew Gear Store & earn</Text>
        </View>
        <View style={styles.listGearPill}>
          <Text style={styles.listGearPillText}>List Now +</Text>
        </View>
      </TouchableOpacity>

      {/* Stats Cards Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <DollarSign size={16} color="#fc8019" />
            <Text style={[styles.statTitle, { color: colors.textFaint }]}>Total Earnings</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            ₹{(profile.totalEarnings || 380000).toLocaleString('en-IN')}
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Calendar size={16} color="#fc8019" />
            <Text style={[styles.statTitle, { color: colors.textFaint }]}>This Month</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>8 Bookings</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Eye size={16} color="#fc8019" />
            <Text style={[styles.statTitle, { color: colors.textFaint }]}>Profile Views</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{profile.views || 1420}</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Star size={16} color="#f59e0b" fill="#f59e0b" />
            <Text style={[styles.statTitle, { color: colors.textFaint }]}>Avg. Rating</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {(profile.rating ?? 4.9).toFixed(1)} ★
          </Text>
        </Card>
      </ScrollView>

      {/* Charts Section */}
      <Card style={styles.chartCard}>
        <EarningsChart />
      </Card>

      <Card style={styles.chartCard}>
        <BookingsDonut />
      </Card>

      {/* Upcoming Bookings */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Bookings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Availability')}>
          <Text style={[styles.seeAll, { color: '#fc8019' }]}>Calendar →</Text>
        </TouchableOpacity>
      </View>

      {safeBookings.map((b, idx) => (
        <BookingCard
          key={b.id ? `bk-${b.id}` : `bk-idx-${idx}`}
          booking={b}
          isProfessionalMode={true}
          onAccept={async () => {
            await bookingApi.acceptBooking(b.id);
            setToastMsg(`Accepted booking request! Client notified for payment.`);
            bookingApi.getProfessionalBookings().then(res => setUpcomingBookings(Array.isArray(res) ? res : []));
          }}
          onDecline={async () => {
            await bookingApi.declineBooking(b.id);
            setToastMsg(`Declined booking request.`);
            bookingApi.getProfessionalBookings().then(res => setUpcomingBookings(Array.isArray(res) ? res : []));
          }}
        />
      ))}

      {/* Quick Action Grid */}
      <Card style={styles.quickCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <Button
            title="My Studio Page"
            variant="secondary"
            size="md"
            onPress={() => navigation.navigate('MyProfileTab')}
            style={{ flex: 1 }}
          />
          <Button
            title="List Gear for Sale/Rent 📦"
            variant="primary"
            size="md"
            onPress={() => setShowListGearModal(true)}
            style={{ flex: 1.2, backgroundColor: '#fc8019' }}
          />
        </View>
      </Card>

      {/* Modal */}
      <ListProductModal
        visible={showListGearModal}
        onClose={() => setShowListGearModal(false)}
        onSuccess={msg => setToastMsg(msg)}
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
    paddingTop: 64,
    paddingBottom: 115,
  },
  brandHeaderRow: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  brandLogo: {
    width: 160,
    height: 34,
    resizeMode: 'contain',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  proName: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  listGearBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  listGearIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fc8019',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listGearTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  listGearSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  listGearPill: {
    backgroundColor: '#fc8019',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },
  listGearPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  statsScroll: {
    marginBottom: 16,
  },
  statCard: {
    width: 155,
    padding: 16,
    marginRight: 10,
    borderWidth: 0,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
  },
  chartCard: {
    marginBottom: 16,
    borderWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickCard: {
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 0,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
});
