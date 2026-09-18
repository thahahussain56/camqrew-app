import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { bookingApi } from '../../api/bookingApi';
import { orderApi } from '../../api/orderApi';
import { jobApi } from '../../api/jobApi';
import { Booking } from '../../types/booking';
import { Order } from '../../types/order';
import { JobRequest } from '../../types/job';
import { BookingCard } from '../../components/cards/BookingCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { Toast } from '../../components/ui/Toast';
import { Calendar, ShoppingBag, CreditCard, Gift, LogOut, ChevronRight, Camera, Pencil, Star, Briefcase, Eye } from 'lucide-react-native';
import { supabase } from '../../api/supabaseClient';
import { cloudStorageApi } from '../../api/cloudStorageApi';

// ── Tab config ──────────────────────────────────────────────────
const TABS = [
  { key: 'bookings', label: 'Bookings', icon: Calendar },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'payments', label: 'Cards', icon: CreditCard },
  { key: 'rewards', label: 'Rewards', icon: Gift },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Stat pill ───────────────────────────────────────────────────
const Stat: React.FC<{ n: number; label: string; color: string; labelColor: string }> = ({ n, label, color, labelColor }) => (
  <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
    <Text style={{ fontSize: 24, fontWeight: '900', color }}>{n}</Text>
    <Text style={{ fontSize: 12, color: labelColor, fontWeight: '600', marginTop: 2 }}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────
export const CustomerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, updateUser, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // Local URI shown immediately after picking — before upload finishes
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      bookingApi.getCustomerBookings().then(r => setBookings(Array.isArray(r) ? r : []));
      orderApi.getOrders().then(r => setOrders(Array.isArray(r) ? r : []));
      if (user?.id) {
        jobApi.getClientJobs(user.id).then(r => setJobs(Array.isArray(r) ? r : []));
      }
    }, [user?.id])
  );

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const completedCount = safeBookings.filter(b => b.status === 'completed').length;
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images' as const],
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;

      // ✅ Show the local file immediately — user sees their photo right away
      setLocalAvatarUri(uri);
      setUploadingAvatar(true);

      // Upload to Supabase Storage in background
      const uploaded = await cloudStorageApi.uploadImage(uri, 'avatars');
      const avatarUrl = uploaded.url;

      // Persist remote URL to users table
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await supabase.from('users').update({ avatar: avatarUrl }).eq('id', authData.user.id);
      }

      // Save remote URL in store (keep localAvatarUri as visual source)
      updateUser({ avatar: avatarUrl });

      setToastType('success');
      setToast('Profile picture updated!');
    } catch (e: any) {
      // On failure, clear local preview and show error
      setLocalAvatarUri(null);
      setToastType('error');
      setToast(e.message || 'Failed to upload image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  const EmptyState: React.FC<{
    emoji: string; title: string; hint: string; cta: string; onCta: () => void;
  }> = ({ emoji, title, hint, cta, onCta }) => (
    <View style={[styles.emptyBox, { backgroundColor: colors.surfaceCard }]}>
      <Text style={{ fontSize: 44, marginBottom: 14 }}>{emoji}</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 22 }}>{hint}</Text>
      <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.accent }]} onPress={onCta}>
        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>{cta} →</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <Toast visible={!!toast} message={toast} type={toastType} onDismiss={() => setToast('')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}  // extra bottom padding for tab bar
      >

        {/* ── Brand Logo Header ──────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16, paddingHorizontal: 16 }}>
          <Image
            source={isDark ? require('../../../assets/camcrew-logo-white.png') : require('../../../assets/camcrew-logo-dark.png')}
            style={{ width: 140, height: 32 }}
            resizeMode="contain"
          />
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')}
            style={{ width: 24, height: 20, justifyContent: 'space-between', alignItems: 'flex-end' }}
          >
            <View style={{ height: 2.5, width: '100%', backgroundColor: colors.textPrimary, borderRadius: 2 }} />
            <View style={{ height: 2.5, width: '60%', backgroundColor: colors.textPrimary, borderRadius: 2 }} />
            <View style={{ height: 2.5, width: '30%', backgroundColor: colors.textPrimary, borderRadius: 2 }} />
          </TouchableOpacity>
        </View>

        {/* ── Prime Upgrade Banner ──────────────────────────────── */}
        {user?.subscription_tier !== 'prime' && (
          <TouchableOpacity 
            style={[styles.primeBanner, { backgroundColor: '#FFD70020', borderColor: '#FFD70050', borderWidth: 1 }]}
            onPress={() => navigation.navigate('PrimeSubscription')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Star size={20} color="#FFD700" style={{ marginRight: 10 }} />
              <View>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>Upgrade to Camqrew Prime</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Free Delivery & 50% Off Deposits</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Profile Card (Light) ──────────────────────────────── */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceCard }]}>
          {/* Edit Profile and Dashboard buttons are now below the role pill */}

          {/* Avatar with camera overlay */}
          <TouchableOpacity onPress={handlePickAvatar} style={[styles.avatarWrap, { borderColor: colors.surfaceCard }]} activeOpacity={0.85}>
            {/* Priority: local pick URI > stored remote URL > initials gradient */}
            {localAvatarUri || user?.avatar ? (
              <Image
                source={{ uri: localAvatarUri || user!.avatar! }}
                style={styles.avatarImg}
                onError={() => {
                  // Remote URL failed to load — fall back to local or clear
                  if (!localAvatarUri) updateUser({ avatar: undefined as any });
                }}
              />
            ) : (
              <LinearGradient colors={[colors.accent, colors.accent]} style={styles.avatarImg}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#ffffff' }}>{initials}</Text>
              </LinearGradient>
            )}
            {uploadingAvatar && (
              <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 42 }}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.name || 'Customer'}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>

          <View style={[styles.rolePill, { backgroundColor: colors.accentGlow, borderColor: 'rgba(63, 182, 104, 0.25)' }]}>
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
              ✦ {user?.role === 'professional' ? 'CREATOR' : 'CUSTOMER'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', paddingHorizontal: 12, marginBottom: 20 }}>
            {user?.role === 'professional' && (
              <>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.accent,
                    borderRadius: 12,
                    paddingVertical: 11,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                  }}
                  onPress={() => navigation.navigate('PublicProfile', { id: user?.id, professionalId: user?.id })}
                >
                  <Eye size={15} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginLeft: 5 }}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.borderLight,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingVertical: 11,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                  }}
                  onPress={() => navigation.navigate('ProDashboard')}
                >
                  <Camera size={15} color={colors.accent} />
                  <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '800', marginLeft: 5 }}>Dashboard</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: colors.accentGlow,
                borderColor: 'rgba(63, 182, 104, 0.2)',
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 11,
                paddingHorizontal: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flex: user?.role === 'professional' ? 0.9 : 1,
              }}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Pencil size={15} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', marginLeft: 5 }}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* ── Divider ── */}
          <View style={[styles.statsDivider, { backgroundColor: colors.borderLight }]} />

          {/* ── Stats row inside the card ── */}
          <View style={styles.statsRow}>
            <Stat n={safeBookings.length} label="Bookings" color={colors.accent} labelColor={colors.textSecondary} />
            <View style={[styles.statSep, { backgroundColor: colors.borderLight }]} />
            <Stat n={safeOrders.length} label="Orders" color={colors.accent} labelColor={colors.textSecondary} />
            <View style={[styles.statSep, { backgroundColor: colors.borderLight }]} />
            <Stat n={completedCount} label="Completed" color={colors.success} labelColor={colors.textSecondary} />
          </View>
        </View>

        {/* ── Tab Bar ──────────────────────────────────────────── */}
        <View style={[styles.tabBar, { backgroundColor: colors.surfaceCard }]}>
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key)}
                style={[styles.tabBtn, active && { backgroundColor: colors.surfaceElevated }]}
              >
                <Icon size={16} color={active ? colors.accent : colors.textSecondary} />
                <Text style={[styles.tabLabel, { color: active ? colors.accent : colors.textSecondary }]}>{label}</Text>
                {active && <View style={[styles.tabDot, { backgroundColor: colors.accent }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab Content ──────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Bookings */}
          {activeTab === 'bookings' && (
            safeBookings.length > 0 ? safeBookings.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onPay={async () => {
                  await bookingApi.payAndConfirmBooking(b.id);
                  setToastType('success');
                  setToast(`₹${b.totalAmount.toLocaleString('en-IN')} locked in Escrow!`);
                  bookingApi.getCustomerBookings().then(r => setBookings(Array.isArray(r) ? r : []));
                }}
                onChat={() => navigation.navigate('Chat', { creatorId: b.professionalId, creatorName: b.professionalName, isPaidUnlocked: true })}
                onReleaseMilestone={async (mId) => {
                  await bookingApi.releaseMilestone(b.id, mId);
                  setToastType('success');
                  setToast('Milestone funds released!');
                  bookingApi.getCustomerBookings().then(r => setBookings(Array.isArray(r) ? r : []));
                }}
              />
            )) : <EmptyState emoji="📅" title="No Bookings Yet" hint="Browse photographers and videographers to book your first shoot." cta="Explore Professionals" onCta={() => navigation.navigate('HomeTab')} />
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            safeOrders.length > 0 ? safeOrders.map(o => (
              <OrderCard key={o.id} order={o} onPress={() => navigation.navigate('OrderDetail', { id: o.id, orderType: o.orderType })} />
            )) : <EmptyState emoji="🛒" title="No Orders Yet" hint="Browse the Gear Store for cameras, lenses, and more." cta="Go to Gear Store" onCta={() => navigation.navigate('MarketplaceTab')} />
          )}

          {/* Jobs */}
          {activeTab === 'jobs' && (
            safeJobs.length > 0 ? safeJobs.map(j => (
              <View key={j.id} style={[styles.infoCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight, borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '900', flex: 1 }}>{j.title}</Text>
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: j.status === 'booked' ? colors.accentGlow : (j.status === 'reviewing' ? 'rgba(245, 166, 35, 0.15)' : 'rgba(63, 182, 104, 0.15)')
                  }}>
                    <Text style={{
                      color: j.status === 'booked' ? colors.accent : (j.status === 'reviewing' ? '#F5A623' : colors.success),
                      fontWeight: '800',
                      fontSize: 11
                    }}>
                      {j.status === 'reviewing' ? 'APPLICANT READY' : j.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 15 }}>
                    ₹{j.budget.toLocaleString('en-IN')}
                  </Text>
                  {j.location ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      📍 {j.location}
                    </Text>
                  ) : null}
                </View>

                {j.status === 'reviewing' && j.accepted_by && (
                  <View style={{ marginTop: 14, backgroundColor: colors.surfaceElevated, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.accent }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 14, marginBottom: 4 }}>
                      🎉 Creator Accepted Your Lead!
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12, lineHeight: 18 }}>
                      A verified creator pitched for your request at your agreed price of ₹{j.budget.toLocaleString('en-IN')}.
                    </Text>
                    
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TouchableOpacity 
                        style={{ flex: 1.4, backgroundColor: colors.accent, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => navigation.navigate('Booking', {
                          proId: j.accepted_by,
                          professionalId: j.accepted_by,
                          type: 'professionals',
                          jobId: j.id,
                          jobTitle: j.title,
                          jobBudget: j.budget,
                          jobLocation: j.location,
                          jobRequirements: j.requirements,
                          jobState: j.state,
                          jobDistrict: j.district,
                          jobCity: j.city,
                        })}
                      >
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Accept & Book →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderLight, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => navigation.navigate('JobReview', {
                          jobId: j.id,
                          acceptedBy: j.accepted_by,
                          jobTitle: j.title,
                          budget: j.budget,
                          location: j.location,
                          requirements: j.requirements,
                        })}
                      >
                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Review Pro</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={{ paddingVertical: 6, alignItems: 'center' }}
                      onPress={() => {
                        Alert.alert(
                          'Decline & Reopen Job',
                          'Are you sure you want to decline this creator and reopen the broadcast for other local pros?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Decline & Reopen',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await jobApi.rejectPro(j.id, j.accepted_by!);
                                  setToast('Job reopened for other local creators.');
                                  jobApi.getClientJobs(user!.id).then(r => setJobs(r as any));
                                } catch (e: any) {
                                  Alert.alert('Error', e.message || 'Could not reopen job.');
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 12 }}>Reject & Reopen Job</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {j.status === 'booked' && (
                  <View style={{ marginTop: 12, backgroundColor: colors.accentGlow, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13 }}>
                      ✓ Booking Confirmed & Locked
                    </Text>
                    <TouchableOpacity onPress={() => setActiveTab('bookings')}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 12, textDecorationLine: 'underline' }}>
                        View in Bookings
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )) : <EmptyState emoji="📢" title="No Job Requests" hint="Post a custom job request to get pitches from local pros." cta="Post a Job Request" onCta={() => navigation.navigate('CreateJob')} />
          )}

          {/* Payments */}
          {activeTab === 'payments' && (
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>💳 Saved Payment Methods</Text>
              {[
                { icon: '💳', title: 'HDFC Bank Credit Card (•••• 4892)', sub: 'Expires 08/29 · Primary Card', subColor: colors.textSecondary },
                { icon: '⚡', title: 'UPI: thaha@okicici', sub: '✓ Verified Fast Checkout', subColor: colors.success },
              ].map((item, i) => (
                <View key={i} style={[styles.payRow, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{item.title}</Text>
                    <Text style={{ fontSize: 12, color: item.subColor, marginTop: 2 }}>{item.sub}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </View>
              ))}
              <TouchableOpacity style={[styles.addPayBtn, { borderTopColor: colors.borderLight }]}>
                <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 14 }}>+ Add New Method</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Rewards */}
          {activeTab === 'rewards' && (
            <View>
              <LinearGradient colors={[colors.accent, colors.accent]} style={styles.rewardBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>LOYALTY POINTS</Text>
                  <Text style={{ color: '#ffffff', fontSize: 44, fontWeight: '900', marginTop: 4 }}>450</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>≈ ₹45 cashback value</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>TIER</Text>
                  <Text style={{ color: '#ffffff', fontSize: 26, fontWeight: '900', marginTop: 4 }}>🥈 Silver</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>75% to Gold</Text>
                </View>
              </LinearGradient>

              <View style={[styles.infoCard, { backgroundColor: colors.surfaceCard }]}>
                <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>🎟️ Active Coupons</Text>
                <View style={[styles.couponRow, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: colors.accent }}>CREATOR20</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>20% OFF on first gear rental</Text>
                  </View>
                  <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.accent }]}>
                    <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 12 }}>COPY</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Sign Out ─────────────────────────────────────────── */}
        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.danger }]} onPress={handleLogout}>
          <LogOut size={17} color={colors.danger} />
          <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 15, marginLeft: 8 }}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};


// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // Profile card — light white with soft shadow
  profileCard: {
    marginHorizontal: 16,
    marginTop: 60,
    borderRadius: 28,
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
  },
  editBtn: {
    // Deprecated, removed absolute positioning
  },
  avatarWrap: {
    position: 'absolute',
    top: -40,             // half-out of the card top edge
    width: 84, height: 84,
    borderRadius: 42,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%', height: '100%',
    borderRadius: 42,
    justifyContent: 'center', alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 26, height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  profileName: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  profileEmail: { fontSize: 13, marginBottom: 12 },
  rolePill: {
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1,
    marginBottom: 20,
  },
  statsDivider: { width: '85%', height: 1, marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statSep: { width: 1, height: 36 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 18,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 13, gap: 3, position: 'relative',
  },
  tabLabel: { fontSize: 10, fontWeight: '700' },
  tabDot: {
    position: 'absolute', bottom: 5,
    width: 4, height: 4, borderRadius: 2,
  },

  // Content
  content: { paddingHorizontal: 16, marginTop: 16 },

  // Empty state
  emptyBox: {
    alignItems: 'center', padding: 32,
    borderRadius: 20,
  },
  emptyBtn: {
    borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },

  // Info card
  infoCard: {
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
    marginBottom: 12,
  },
  infoCardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  payRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14,
    padding: 14, marginBottom: 10,
  },
  addPayBtn: {
    paddingVertical: 14, alignItems: 'center',
    borderTopWidth: 1, marginTop: 4,
  },

  // Rewards
  rewardBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 20, padding: 24, marginBottom: 12,
  },
  primeBanner: {
    marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16,
  },
  couponRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, padding: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  copyBtn: {
    borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 24,
    borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
});
