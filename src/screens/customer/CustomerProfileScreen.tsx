import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Dimensions, Modal, KeyboardAvoidingView, Platform, Linking,
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
import { professionalApi, parseVideoUrl } from '../../api/professionalApi';
import { Booking } from '../../types/booking';
import { Order } from '../../types/order';
import { JobRequest } from '../../types/job';
import { ProfessionalProfile, VideoReelItem } from '../../types/professional';
import { BookingCard } from '../../components/cards/BookingCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { Toast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import {
  Calendar, ShoppingBag, CreditCard, Gift, LogOut, ChevronRight,
  Camera, Pencil, Star, Briefcase, Eye, Plus, PlusCircle, Film,
  Play, Trash2, X, ChevronLeft, ChevronRight as ChevronRightIcon,
  Image as ImageIcon, CheckCircle, User, UploadCloud, Video,
  Smartphone, RefreshCw,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../../api/supabaseClient';
import { cloudStorageApi } from '../../api/cloudStorageApi';
import { isCustomAvatar } from '../../utils/avatarUtils';

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
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);

  // In-Profile Instagram-Style Creator Posting State
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showReelModal, setShowReelModal] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState('');
  const [selectedVideoSize, setSelectedVideoSize] = useState('');
  const [selectedVideoReel, setSelectedVideoReel] = useState<VideoReelItem | null>(null);
  const [newReelUrl, setNewReelUrl] = useState('');
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelCategory, setNewReelCategory] = useState('Showreel');
  const [newReelIsShort, setNewReelIsShort] = useState(true);
  const [submittingReel, setSubmittingReel] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);

  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // Local URI shown immediately after picking — before upload finishes
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      bookingApi.getCustomerBookings().then(r => setBookings(Array.isArray(r) ? r : []));
      orderApi.getOrders().then(r => setOrders(Array.isArray(r) ? r : []));
      if (user?.id) {
        jobApi.getClientJobs(user.id).then(r => setJobs(Array.isArray(r) ? r : []));
        if (user.role === 'professional') {
          professionalApi.getProfileById(user.id).then(p => {
            if (p) setProProfile(p);
          }).catch(console.warn);
        }
      }
    }, [user?.id, user?.role])
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

  // ── Instagram-Style Creator Posting Handlers ──
  const handlePostPhoto = async () => {
    setShowCreateSheet(false);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access photo gallery is required to add photos to your portfolio!');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images' as const],
        allowsEditing: true,
        quality: 0.85,
      });

      if (res.canceled || !res.assets?.[0]) return;

      const uri = res.assets[0].uri;
      setUploadingPhoto(true);
      setToastType('info');
      setToast('Uploading photo to your portfolio...');

      let finalUrl = uri;
      try {
        const uploaded = await cloudStorageApi.uploadImage(uri, 'portfolio');
        if (uploaded?.url) {
          finalUrl = uploaded.url;
        }
      } catch (uploadErr) {
        console.warn('Cloud storage upload warning:', uploadErr);
      }

      const currentPortfolio = proProfile?.portfolio || [];
      const updatedPortfolio = [finalUrl, ...currentPortfolio];

      setProProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : ({ portfolio: updatedPortfolio } as any));

      await professionalApi.updateProfile({ portfolio: updatedPortfolio });

      setToastType('success');
      setToast('📸 Photo added to your portfolio!');
    } catch (err: any) {
      console.error('Failed to add photo:', err);
      setToastType('error');
      setToast(err.message || 'Failed to add photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePickVideoForReel = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery access is required to select a video.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedVideoUri(asset.uri);
        const name = asset.fileName || asset.uri.split('/').pop() || 'Video Reel';
        setSelectedVideoName(name);
        if (asset.fileSize) {
          setSelectedVideoSize(`${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB`);
        } else {
          setSelectedVideoSize('Video File');
        }
        if (!newReelTitle) {
          setNewReelTitle(name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select video');
    }
  };

  const handlePostReel = async () => {
    if (!selectedVideoUri && !newReelUrl.trim()) {
      Alert.alert('Missing Video', 'Please pick a video file from your gallery.');
      return;
    }
    setSubmittingReel(true);
    try {
      let finalUrl = '';
      let finalType: 'direct' | 'youtube' | 'vimeo' = 'direct';
      let finalEmbedUrl = '';

      if (selectedVideoUri) {
        const uploadRes = await cloudStorageApi.uploadVideo(selectedVideoUri, 'reels');
        finalUrl = uploadRes.url;
        finalEmbedUrl = uploadRes.url;
        finalType = 'direct';
      } else if (newReelUrl.trim()) {
        const parsed = parseVideoUrl(newReelUrl.trim());
        finalUrl = newReelUrl.trim();
        finalType = parsed.type;
        finalEmbedUrl = parsed.embedUrl;
      }

      const newReel: VideoReelItem = {
        id: 'reel_' + Date.now(),
        title: newReelTitle.trim() || (selectedVideoName ? selectedVideoName.replace(/\.[^/.]+$/, '') : (newReelIsShort ? 'Video Reel' : 'Featured Showreel')),
        url: finalUrl,
        type: finalType,
        embedUrl: finalEmbedUrl,
        thumbnailUrl: '',
        category: newReelCategory,
        isShort: newReelIsShort,
      };

      const currentReels = proProfile?.videoReels || [];
      const updatedReels = [newReel, ...currentReels];

      setProProfile(prev => prev ? { ...prev, videoReels: updatedReels } : ({ videoReels: updatedReels } as any));

      await professionalApi.updateProfile({ videoReels: updatedReels });

      setShowReelModal(false);
      setSelectedVideoUri(null);
      setSelectedVideoName('');
      setSelectedVideoSize('');
      setNewReelUrl('');
      setNewReelTitle('');
      setNewReelIsShort(true);
      setToastType('success');
      setToast('🎬 Video reel posted to your profile!');
    } catch (err: any) {
      console.error('Failed to post reel:', err);
      Alert.alert('Error', err.message || 'Failed to upload video reel.');
    } finally {
      setSubmittingReel(false);
    }
  };

  const handleDeletePhoto = (photoUrl: string, index: number) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to remove this photo from your portfolio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentPortfolio = proProfile?.portfolio || [];
              const updatedPortfolio = currentPortfolio.filter((_, i) => i !== index);
              setProProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : null);
              setSelectedImgIndex(null);
              await professionalApi.updateProfile({ portfolio: updatedPortfolio });
              setToastType('info');
              setToast('Photo removed from portfolio.');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to remove photo.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteReel = (reelId: string, reelTitle: string) => {
    Alert.alert(
      'Delete Reel',
      `Are you sure you want to remove "${reelTitle}" from your profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentReels = proProfile?.videoReels || [];
              const updatedReels = currentReels.filter(r => r.id !== reelId);
              setProProfile(prev => prev ? { ...prev, videoReels: updatedReels } : null);
              await professionalApi.updateProfile({ videoReels: updatedReels });
              setToastType('info');
              setToast('Video reel removed.');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete reel.');
            }
          }
        }
      ]
    );
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {user?.role === 'professional' && (
              <TouchableOpacity
                onPress={() => setShowCreateSheet(true)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#3fb668',
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Plus size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')}
              style={{ width: 24, height: 20, justifyContent: 'space-between', alignItems: 'flex-end' }}
            >
              <View style={{ height: 2.5, width: '100%', backgroundColor: colors.textPrimary, borderRadius: 2 }} />
              <View style={{ height: 2.5, width: '60%', backgroundColor: colors.textPrimary, borderRadius: 2 }} />
              <View style={{ height: 2.5, width: '30%', backgroundColor: colors.textPrimary, borderRadius: 2 }} />
            </TouchableOpacity>
          </View>
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
            {/* Priority: local pick URI > stored custom remote URL > clean Person icon */}
            {localAvatarUri || (user?.avatar && isCustomAvatar(user.avatar)) ? (
              <Image
                source={{ uri: localAvatarUri || user!.avatar! }}
                style={styles.avatarImg}
                onError={() => {
                  // Remote URL failed to load — fall back to local or clear
                  if (!localAvatarUri) updateUser({ avatar: undefined as any });
                }}
              />
            ) : (
              <View style={[styles.avatarImg, { backgroundColor: isDark ? '#1a2228' : '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
                <User size={38} color={colors.textSecondary} />
              </View>
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
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1.2,
                  }}
                  onPress={() => setShowCreateSheet(true)}
                >
                  <PlusCircle size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>+ Post Content</Text>
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
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', marginLeft: 5 }}>Edit Profile</Text>
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

        {/* ── Creator Showcase: Video Reels & Showreels ── */}
        {user?.role === 'professional' && (
          <>
            <View style={styles.profileSection}>
              <View style={styles.homeSectionHeader}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.homeSectionTitle, { color: colors.textPrimary }]}>
                    Showreels & Reels
                  </Text>
                  <Text style={[styles.homeSectionSub, { color: colors.textSecondary }]}>
                    9:16 vertical clips & cinema showreels
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowReelModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.homeSectionAction}
                >
                  <Text style={[styles.homeSectionActionText, { color: colors.accent }]}>+ Add Reel</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.horizontalCarouselContent}
              >
                {/* Minimal Upload Card: Post Reel */}
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => setShowReelModal(true)} 
                  style={[
                    styles.minimalUploadCard, 
                    { 
                      backgroundColor: colors.surfaceCard, 
                      borderColor: colors.borderLight,
                    }
                  ]}
                >
                  <View style={[styles.minimalUploadIconCircle, { backgroundColor: colors.accentGlow }]}>
                    <Film size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.minimalUploadTitle, { color: colors.textPrimary }]}>Add Reel</Text>
                  <Text style={[styles.minimalUploadSub, { color: colors.textSecondary }]}>Video Clip</Text>
                </TouchableOpacity>

                {(proProfile?.videoReels || []).map((reel) => {
                  const isShort = reel.isShort;
                  return (
                    <View key={reel.id} style={{ position: 'relative' }}>
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => {
                          if (reel.url || reel.embedUrl) {
                            setSelectedVideoReel(reel);
                          }
                        }}
                        style={[
                          styles.reelCard,
                          isShort ? styles.reelCardVertical : styles.reelCardCinema,
                          { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }
                        ]}
                      >
                        {reel.thumbnailUrl ? (
                          <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelThumbnail} resizeMode="cover" />
                        ) : (
                          <View style={[styles.reelPlaceholder, { backgroundColor: isDark ? '#10141d' : '#f1f5f9' }]}>
                            <Film size={26} color={colors.accent} />
                          </View>
                        )}
                        <LinearGradient
                          colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.85)']}
                          locations={[0, 0.45, 1]}
                          style={StyleSheet.absoluteFill}
                        />

                        {/* Centered Minimal Play Button */}
                        <View style={styles.reelPlayBtn}>
                          <Play size={13} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
                        </View>

                        {/* Top Badge */}
                        <View style={styles.reelTopBadges}>
                          <View style={[styles.reelBadgePill, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                            <Text style={styles.reelBadgeText}>{isShort ? '9:16' : 'Cinema'}</Text>
                          </View>
                        </View>

                        {/* Bottom Metadata */}
                        <View style={styles.reelInfo}>
                          {reel.category ? (
                            <Text style={[styles.reelCategory, { color: colors.accent }]} numberOfLines={1}>
                              {reel.category.toUpperCase()}
                            </Text>
                          ) : null}
                          <Text style={styles.reelTitle} numberOfLines={1}>
                            {reel.title}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reelDeleteBtn}
                        onPress={() => handleDeleteReel(reel.id, reel.title)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={12} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Creator Showcase: Portfolio Highlights ── */}
            <View style={styles.profileSection}>
              <View style={styles.homeSectionHeader}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.homeSectionTitle, { color: colors.textPrimary }]}>
                    Portfolio Highlights
                  </Text>
                  <Text style={[styles.homeSectionSub, { color: colors.textSecondary }]}>
                    High-resolution photography & stills
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handlePostPhoto}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.homeSectionAction}
                >
                  <Text style={[styles.homeSectionActionText, { color: colors.accent }]}>+ Add Photo</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.horizontalCarouselContent}
              >
                {/* Minimal Upload Card: Post Photo (Identical to Reel Card) */}
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={handlePostPhoto} 
                  style={[
                    styles.minimalUploadCard, 
                    { 
                      backgroundColor: colors.surfaceCard, 
                      borderColor: colors.borderLight,
                    }
                  ]}
                >
                  {uploadingPhoto ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color={colors.accent} />
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.accent, marginTop: 6 }}>Uploading</Text>
                    </View>
                  ) : (
                    <>
                      <View style={[styles.minimalUploadIconCircle, { backgroundColor: colors.accentGlow }]}>
                        <Camera size={20} color={colors.accent} />
                      </View>
                      <Text style={[styles.minimalUploadTitle, { color: colors.textPrimary }]}>Add Photo</Text>
                      <Text style={[styles.minimalUploadSub, { color: colors.textSecondary }]}>From Gallery</Text>
                    </>
                  )}
                </TouchableOpacity>

                {(proProfile?.portfolio || []).map((img, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    activeOpacity={0.88} 
                    onPress={() => setSelectedImgIndex(idx)} 
                    style={[styles.portfolioItem, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}
                  >
                    <Image source={{ uri: img }} style={styles.portfolioImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

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

      {/* Lightbox Modal */}
      <Modal visible={selectedImgIndex !== null} transparent animationType="fade" onRequestClose={() => setSelectedImgIndex(null)}>
        <View style={styles.modalBg}>
          <View style={styles.lightboxTopBar}>
            {selectedImgIndex !== null && proProfile?.portfolio && (
              <TouchableOpacity 
                style={styles.deletePhotoBtn} 
                onPress={() => handleDeletePhoto(proProfile.portfolio![selectedImgIndex], selectedImgIndex)}
                activeOpacity={0.8}
              >
                <Trash2 size={18} color="#ff4d4f" />
                <Text style={{ color: '#ff4d4f', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImgIndex(null)}>
              <X size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {selectedImgIndex !== null && proProfile?.portfolio && (
            <View style={styles.lightboxContainer}>
              <Text style={styles.lightboxCounter}>
                {selectedImgIndex + 1} / {proProfile.portfolio.length}
              </Text>
              
              <Image source={{ uri: proProfile.portfolio[selectedImgIndex] }} style={styles.fullImage} resizeMode="contain" />

              <View style={styles.slideshowControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.navArrow}
                  onPress={() => setSelectedImgIndex(prev => (prev !== null ? (prev > 0 ? prev - 1 : proProfile.portfolio!.length - 1) : null))}
                >
                  <ChevronLeft size={36} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.navArrow}
                  onPress={() => setSelectedImgIndex(prev => (prev !== null ? (prev < proProfile.portfolio!.length - 1 ? prev + 1 : 0) : null))}
                >
                  <ChevronRightIcon size={36} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ── Fullscreen Video Reel Player Modal ── */}
      <Modal 
        visible={selectedVideoReel !== null} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setSelectedVideoReel(null)}
      >
        <View style={styles.videoModalBg}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.videoModalSafe}>
            <View style={styles.videoModalTopBar}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.videoModalTitle} numberOfLines={1}>
                  {selectedVideoReel?.title || 'Video Reel'}
                </Text>
                {selectedVideoReel?.category ? (
                  <Text style={styles.videoModalCategory}>
                    {selectedVideoReel.category.toUpperCase()} • {selectedVideoReel.isShort ? '9:16 Reel' : 'Cinema Video'}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity 
                style={styles.videoModalCloseBtn} 
                onPress={() => setSelectedVideoReel(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={[
              styles.videoPlayerBox,
              selectedVideoReel?.isShort ? styles.videoPlayerBoxVertical : styles.videoPlayerBoxCinema
            ]}>
              {selectedVideoReel && (() => {
                const isDirect = selectedVideoReel.type === 'direct' || 
                  selectedVideoReel.url?.includes('.mp4') || 
                  selectedVideoReel.embedUrl?.includes('.mp4') ||
                  selectedVideoReel.url?.includes('.mov') ||
                  selectedVideoReel.url?.includes('.webm');
                const videoSrc = selectedVideoReel.url || selectedVideoReel.embedUrl;

                const html = isDirect
                  ? `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
                        html, body { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000; }
                        video { width: 100%; height: 100%; object-fit: contain; }
                      </style>
                    </head>
                    <body>
                      <video 
                        src="${videoSrc}" 
                        autoplay 
                        controls 
                        playsinline 
                        webkit-playsinline
                      ></video>
                    </body>
                  </html>
                  `
                  : `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
                        html, body { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000; }
                        iframe { width: 100%; height: 100%; border: none; }
                      </style>
                    </head>
                    <body>
                      <iframe 
                        src="${selectedVideoReel.embedUrl || selectedVideoReel.url}" 
                        allow="autoplay; fullscreen; encrypted-media" 
                        allowfullscreen
                      ></iframe>
                    </body>
                  </html>
                  `;

                return (
                  <WebView
                    key={selectedVideoReel.id}
                    originWhitelist={['*']}
                    source={{ html }}
                    style={{ flex: 1, backgroundColor: '#000000' }}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled
                    domStorageEnabled
                  />
                );
              })()}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Instagram-Style In-Profile Create Post Action Sheet ── */}
      <Modal visible={showCreateSheet} transparent animationType="slide" onRequestClose={() => setShowCreateSheet(false)}>
        <TouchableOpacity 
          style={styles.sheetOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCreateSheet(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.createSheetCard, { backgroundColor: colors.surfaceCard }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.createSheetTitle, { color: colors.textPrimary }]}>Create New Post</Text>
            <Text style={[styles.createSheetSubtitle, { color: colors.textSecondary }]}>
              Post photography and video reels directly to your Camqrew profile
            </Text>

            {/* Post Photo Option */}
            <TouchableOpacity 
              style={[styles.createOptionRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
              onPress={handlePostPhoto}
              activeOpacity={0.8}
            >
              <View style={[styles.createOptionIconWrap, { backgroundColor: 'rgba(63,182,104,0.15)' }]}>
                <Camera size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.createOptionTitle, { color: colors.textPrimary }]}>Post Photo to Portfolio</Text>
                <Text style={[styles.createOptionDesc, { color: colors.textSecondary }]}>
                  Upload high-res stills or project photos from your camera roll
                </Text>
              </View>
            </TouchableOpacity>

            {/* Post Video Reel Option */}
            <TouchableOpacity 
              style={[styles.createOptionRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
              onPress={() => {
                setShowCreateSheet(false);
                setTimeout(() => setShowReelModal(true), 250);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.createOptionIconWrap, { backgroundColor: 'rgba(63,182,104,0.15)' }]}>
                <Film size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.createOptionTitle, { color: colors.textPrimary }]}>Upload Video Reel / Showreel</Text>
                <Text style={[styles.createOptionDesc, { color: colors.textSecondary }]}>
                  Upload video clips, 9:16 vertical reels, and showreels from your gallery
                </Text>
              </View>
            </TouchableOpacity>

            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={() => setShowCreateSheet(false)}
              style={{ marginTop: 8 }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── In-Profile Video Reel Composer Modal ── */}
      <Modal visible={showReelModal} transparent animationType="slide" onRequestClose={() => !submittingReel && setShowReelModal(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.sheetOverlay}
        >
          <View style={[styles.reelModalCard, { backgroundColor: colors.surfaceCard }]}>
            {/* Sheet Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* Modal Header */}
            <View style={styles.reelModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.modalHeaderIconWrap, { backgroundColor: 'rgba(63,182,104,0.15)' }]}>
                  <Film size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.reelModalTitle, { color: colors.textPrimary }]}>Upload Video Reel</Text>
                  <Text style={[styles.reelModalSub, { color: colors.textSecondary }]}>
                    All video formats supported (MP4, MOV, WebM, etc.)
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => !submittingReel && setShowReelModal(false)} 
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceElevated }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: Dimensions.get('window').height * 0.72 }}>
              {/* Native Video File Picker */}
              {!selectedVideoUri ? (
                <TouchableOpacity
                  style={[
                    styles.modalDropzone,
                    {
                      backgroundColor: isDark ? 'rgba(63,182,104,0.06)' : 'rgba(63,182,104,0.04)',
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={handlePickVideoForReel}
                  activeOpacity={0.75}
                >
                  <View style={[styles.dropzoneIconRing, { backgroundColor: 'rgba(63,182,104,0.15)', borderColor: 'rgba(63,182,104,0.3)' }]}>
                    <UploadCloud size={30} color={colors.accent} />
                  </View>
                  <Text style={[styles.dropzoneMainText, { color: colors.textPrimary }]}>
                    Choose Video File
                  </Text>
                  <Text style={[styles.dropzoneSubText, { color: colors.textSecondary }]}>
                    Tap to browse videos from your device
                  </Text>
                  <View style={styles.dropzonePillRow}>
                    <View style={[styles.dropzoneFormatBadge, { backgroundColor: 'rgba(63,182,104,0.18)' }]}>
                      <Text style={{ color: colors.accent, fontSize: 10.5, fontWeight: '800' }}>✓ ALL FORMATS ACCEPTED</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 5 }}>
                    MP4 • MOV • WebM • AVI • MKV • FLV • WMV • 3GP
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.modalSelectedCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <View style={[styles.modalSelectedIconCircle, { backgroundColor: 'rgba(63,182,104,0.15)' }]}>
                      <Film size={22} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
                        {selectedVideoName}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginRight: 6 }} />
                        <Text style={{ fontSize: 11.5, color: colors.accent, fontWeight: '700' }}>
                          Ready to upload {selectedVideoSize ? `• ${selectedVideoSize}` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={handlePickVideoForReel}
                      disabled={submittingReel}
                      style={[styles.modalChangeBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedVideoUri(null);
                        setSelectedVideoName('');
                        setSelectedVideoSize('');
                      }}
                      disabled={submittingReel}
                      style={[styles.modalRemoveBtn, { backgroundColor: 'rgba(255,77,79,0.12)' }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={15} color="#ff4d4f" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Input
                label="Reel Title"
                placeholder="e.g. 2026 Commercial Highlights, Drone Reel"
                value={newReelTitle}
                onChangeText={setNewReelTitle}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {['Showreel', 'Wedding', 'Commercial', 'Fashion', 'Music Video', 'Short Film', 'Drone Reel', 'Event'].map(cat => (
                  <Chip
                    key={cat}
                    label={cat}
                    active={newReelCategory === cat}
                    onPress={() => setNewReelCategory(cat)}
                  />
                ))}
              </ScrollView>

              {/* Vertical 9:16 Format Toggle Card */}
              <TouchableOpacity
                style={[
                  styles.modalFormatCard,
                  {
                    backgroundColor: newReelIsShort ? (isDark ? 'rgba(63,182,104,0.1)' : 'rgba(63,182,104,0.06)') : colors.surfaceElevated,
                    borderColor: newReelIsShort ? colors.accent : colors.borderLight,
                  },
                ]}
                onPress={() => setNewReelIsShort(!newReelIsShort)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                  <View style={[styles.modalFormatIconWrap, { backgroundColor: newReelIsShort ? 'rgba(63,182,104,0.2)' : 'rgba(0,0,0,0.05)' }]}>
                    <Smartphone size={18} color={newReelIsShort ? colors.accent : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                      Vertical 9:16 Reel Format
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                      Optimized for full-screen immersive playback in Reels feed
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: newReelIsShort ? colors.accent : colors.textFaint,
                    backgroundColor: newReelIsShort ? colors.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {newReelIsShort && <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>✓</Text>}
                </View>
              </TouchableOpacity>

              {/* Uploading Progress Indicator Banner */}
              {submittingReel && (
                <View style={[styles.modalProgressBanner, { backgroundColor: 'rgba(63,182,104,0.12)', borderColor: 'rgba(63,182,104,0.3)' }]}>
                  <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.accent }}>
                      Uploading Video to Cloud Storage...
                    </Text>
                    <Text style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 1 }}>
                      Please wait while your video is uploaded and linked
                    </Text>
                  </View>
                </View>
              )}

              <Button
                title={submittingReel ? 'Uploading Reel...' : 'Post Reel to Profile'}
                variant="primary"
                size="md"
                disabled={submittingReel || (!selectedVideoUri && !newReelUrl.trim())}
                icon={submittingReel ? <ActivityIndicator size="small" color="#ffffff" /> : <UploadCloud size={16} color="#ffffff" />}
                onPress={handlePostReel}
                style={{ marginTop: 6 }}
              />

              <Button
                title="Cancel"
                variant="outline"
                size="md"
                disabled={submittingReel}
                onPress={() => setShowReelModal(false)}
                style={{ marginTop: 8, marginBottom: 12 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // ── Creator Showcase & In-Profile Posting Styles ──
  // ── Creator Showcase (Minimal Home-Page Design System) ──
  profileSection: {
    marginTop: 24,
  },
  homeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  homeSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  homeSectionSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  homeSectionAction: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  homeSectionActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  horizontalCarouselContent: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Minimal Upload Card (Identical for Reel & Photo)
  minimalUploadCard: {
    width: 122,
    height: 175,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  minimalUploadIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  minimalUploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  minimalUploadSub: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },

  // Reel Card
  reelCard: {
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  reelCardVertical: {
    width: 122,
    height: 175,
  },
  reelCardCinema: {
    width: 235,
    height: 175,
  },
  reelThumbnail: {
    width: '100%',
    height: '100%',
  },
  reelPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelPlayBtn: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: -17,
    marginTop: -17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelTopBadges: {
    position: 'absolute',
    top: 7,
    left: 7,
    flexDirection: 'row',
  },
  reelBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reelBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  reelInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  reelCategory: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  reelTitle: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  reelDeleteBtn: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Portfolio Item
  portfolioItem: {
    width: 135,
    height: 175,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Lightbox
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.98)', justifyContent: 'center', alignItems: 'center' },
  lightboxTopBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 25 },
  deletePhotoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 77, 79, 0.18)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ff4d4f' },
  closeBtn: { padding: 8 },
  lightboxContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  lightboxCounter: { color: '#ffffff', fontSize: 16, fontWeight: '800', position: 'absolute', top: 60, alignSelf: 'center' },
  fullImage: { width: '100%', height: '70%' },
  slideshowControls: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16, zIndex: 15 },
  navArrow: { backgroundColor: 'rgba(0, 0, 0, 0.5)', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // Create Sheet & Reel Modal
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  createSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  createSheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  createSheetSubtitle: {
    fontSize: 13,
    marginBottom: 18,
  },
  createOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  createOptionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOptionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  createOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  reelModalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 36,
  },
  reelModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reelModalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  reelModalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Dropzone
  modalDropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dropzoneIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropzoneMainText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  dropzoneSubText: {
    fontSize: 12,
    marginBottom: 10,
  },
  dropzonePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropzoneFormatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // Selected Video Card
  modalSelectedCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalSelectedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalChangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Format Toggle Card
  modalFormatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  modalFormatIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Progress Banner
  modalProgressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  detectedFormatBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewThumb: {
    width: 52,
    height: 38,
    borderRadius: 6,
  },
  videoModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  videoModalSafe: {
    flex: 1,
    justifyContent: 'center',
  },
  videoModalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  videoModalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  videoModalCategory: {
    color: '#3fb668',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  videoModalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerBox: {
    width: '100%',
    backgroundColor: '#000000',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  videoPlayerBoxVertical: {
    flex: 1,
    maxHeight: Dimensions.get('window').height * 0.82,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  videoPlayerBoxCinema: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
