import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { professionalApi } from '../../api/professionalApi';
import { bookingApi } from '../../api/bookingApi';
import { productApi } from '../../api/productApi';
import { ProfessionalProfile } from '../../types/professional';
import { Product } from '../../types/product';
import { Booking } from '../../types/booking';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingCard } from '../../components/cards/BookingCard';
import { ProductCard } from '../../components/cards/ProductCard';
import { EarningsChart } from '../../components/charts/EarningsChart';
import { BookingsDonut } from '../../components/charts/BookingsDonut';
import { Toast } from '../../components/ui/Toast';
import { ListProductModal } from '../../components/forms/ListProductModal';
import { DollarSign, Calendar, Eye, Star, Edit3, Bell, PlusCircle, LayoutDashboard, ShoppingBag, FolderGit2 } from 'lucide-react-native';

type DashTab = 'overview' | 'bookings' | 'sales_rentals' | 'listings';

export const ProfessionalDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [showListGearModal, setShowListGearModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeTab, setActiveTab] = useState<DashTab>('overview');

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (user?.id) {
        setLoading(true);
        professionalApi.getProfileById(user.id)
          .then(data => {
            if (isMounted) setProfile(data);
          })
          .catch(err => {
            console.warn('Failed to load professional profile:', err);
            // Fallback for UI testing if profile row doesn't exist
            if (isMounted) {
              setProfile({
                id: user.id,
                userId: user.id,
                name: user.name || 'Creative Studio',
                title: 'Professional Creator',
                bio: 'Creator profile.',
                experienceYears: 1,
                avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
                bannerImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
                verified: true,
                rating: 5.0,
                reviewCount: 0,
                city: 'Mumbai',
                state: 'Maharashtra',
                district: 'Mumbai',
                locations: ['Mumbai'],
                categories: ['Photography'],
                ratePerDay: 15000,
                equipment: [],
                certifications: [],
                portfolio: [],
                services: [],
                reviews: [],
                weeklyAvailability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
                blockedDates: []
              } as ProfessionalProfile);
            }
          })
          .finally(() => {
            if (isMounted) setLoading(false);
          });
      } else {
        setLoading(false);
      }
      bookingApi.getProfessionalBookings().then(res => {
        if (isMounted) setUpcomingBookings(Array.isArray(res) ? res : []);
      });
      productApi.getUserProducts().then(res => {
        if (isMounted) setUserProducts(Array.isArray(res) ? res : []);
      });
      return () => { isMounted = false; };
    }, [user?.id])
  );

  const safeBookings = Array.isArray(upcomingBookings) ? upcomingBookings : [];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Profile not found.</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 10 }}>Please complete your creator onboarding.</Text>
      </View>
    );
  }

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
          <Text style={[styles.welcomeText, { color: '#3fb668' }]}>PRO STUDIO DASHBOARD</Text>
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

      {/* Tabs Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {(['overview', 'bookings', 'sales_rentals', 'listings'] as DashTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
              backgroundColor: activeTab === tab ? colors.accent : colors.surfaceCard,
              marginRight: 8, borderWidth: 1, borderColor: activeTab === tab ? colors.accent : colors.borderLight,
            }}
          >
            <Text style={{
              color: activeTab === tab ? '#fff' : colors.textSecondary,
              fontSize: 13, fontWeight: '700', textTransform: 'capitalize'
            }}>
              {tab === 'sales_rentals' ? 'Sales & Rentals' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <DollarSign size={16} color="#3fb668" />
                <Text style={[styles.statTitle, { color: colors.textFaint }]}>Total Earnings</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                ₹{(profile.totalEarnings || 380000).toLocaleString('en-IN')}
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Calendar size={16} color="#3fb668" />
                <Text style={[styles.statTitle, { color: colors.textFaint }]}>This Month</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>8 Bookings</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Eye size={16} color="#3fb668" />
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

          <Card style={styles.chartCard}>
            <EarningsChart />
          </Card>
          <Card style={styles.chartCard}>
            <BookingsDonut />
          </Card>
        </>
      )}

      {/* ── BOOKINGS TAB ── */}
      {activeTab === 'bookings' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Availability')}>
              <Text style={[styles.seeAll, { color: '#3fb668' }]}>Manage Calendar →</Text>
            </TouchableOpacity>
          </View>
          {safeBookings.length > 0 ? safeBookings.map((b, idx) => (
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
              onChat={() => navigation.navigate('Chat', { otherUserId: b.customerId, otherUserName: b.customerName })}
            />
          )) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40 }}>📅</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 10 }}>No bookings yet</Text>
            </View>
          )}
        </>
      )}

      {/* ── SALES & RENTALS TAB ── */}
      {activeTab === 'sales_rentals' && (
        <View style={{ padding: 40, alignItems: 'center', backgroundColor: colors.surfaceCard, borderRadius: 20 }}>
          <ShoppingBag size={40} color={colors.textFaint} />
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 10 }}>No Orders Yet</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
            Incoming sale orders and rental requests for your listed gear will appear here.
          </Text>
        </View>
      )}

      {/* ── LISTINGS TAB ── */}
      {activeTab === 'listings' && (
        <>
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
              <Text style={styles.listGearTitle}>Sell or Rent Your Gear</Text>
              <Text style={styles.listGearSub}>Post equipment to the Camqrew Store</Text>
            </View>
            <View style={styles.listGearPill}>
              <Text style={styles.listGearPillText}>List Now +</Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {userProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onPress={() => {}}
                onAddToCart={() => {}}
              />
            ))}
          </View>
          
          {userProducts.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary }}>No products listed yet.</Text>
            </View>
          )}

          <Card style={styles.quickCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Manage Studio</Text>
            
            <TouchableOpacity style={styles.manageRow} onPress={() => navigation.navigate('ProfessionalEdit')}>
              <View style={styles.manageIcon}><FolderGit2 size={20} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>Update Portfolio</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Add new photos/videos to your public profile</Text>
              </View>
              <Edit3 size={16} color={colors.textFaint} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.manageRow} onPress={() => navigation.navigate('ProfessionalEdit')}>
              <View style={styles.manageIcon}><Star size={20} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>Edit Services & Pricing</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Update your day rates and specialties</Text>
              </View>
              <Edit3 size={16} color={colors.textFaint} />
            </TouchableOpacity>

            <Button
              title="View Public Profile"
              variant="outline"
              size="md"
              onPress={() => navigation.navigate('PublicProfile', { professionalId: user?.id })}
              style={{ marginTop: 10 }}
            />
          </Card>
        </>
      )}

      {/* Modal */}
      <ListProductModal
        visible={showListGearModal}
        onClose={() => setShowListGearModal(false)}
        onSuccess={(msg) => {
          setToastMsg(msg);
          productApi.getUserProducts().then(res => {
            setUserProducts(Array.isArray(res) ? res : []);
          });
        }}
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
    backgroundColor: '#3fb668',
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
    backgroundColor: '#3fb668',
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
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  manageIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(63, 182, 104, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
});
