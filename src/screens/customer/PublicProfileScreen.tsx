import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Dimensions, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { professionalApi, parseVideoUrl } from '../../api/professionalApi';
import { studioApi } from '../../api/studioApi';
import { productApi } from '../../api/productApi';
import { cloudStorageApi } from '../../api/cloudStorageApi';
import { ProfessionalProfile, ReviewItem, VideoReelItem } from '../../types/professional';
import { Product } from '../../types/product';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { Toast } from '../../components/ui/Toast';
import { ProductCard } from '../../components/cards/ProductCard';
import { useCartStore } from '../../store/cartStore';
import { Star, MapPin, X, ArrowLeft, ShieldCheck, Zap, ChevronLeft, ChevronRight, MessageSquare, Briefcase, CheckCircle, Send, MessageCircle, Share2, Film, Play, ExternalLink, Plus, Camera, Trash2, PlusCircle, Image as ImageIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const PublicProfileScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  
  const proId = route?.params?.id || route?.params?.professionalId;
  const bookingType = route?.params?.type || 'professionals';
  const isStudio = bookingType === 'studios' || bookingType === 'studio';

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const { addItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  // In-Profile Instagram-Style Posting State
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showReelModal, setShowReelModal] = useState(false);
  const [newReelUrl, setNewReelUrl] = useState('');
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelCategory, setNewReelCategory] = useState('Showreel');
  const [newReelIsShort, setNewReelIsShort] = useState(false);
  const [submittingReel, setSubmittingReel] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Toast Feedback State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Reviews & Rating State
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!proId) {
      professionalApi.getProfessionals().then(list => {
        if (list && list.length > 0) setProfile(list[0]);
        setLoading(false);
      });
      return;
    }

    setLoading(true);
    const fetcher = isStudio ? studioApi.getStudioById(proId) : professionalApi.getProfileById(proId);
    
    fetcher.then(p => {
      setProfile(p);
      setReviews(p.reviews || []);
      return productApi.getProductsByOwner(p.id);
    }).then(prods => {
      setProducts(prods || []);
      setLoading(false);
    }).catch(e => {
      console.warn(e);
      setLoading(false);
    });
  }, [proId, isStudio]);

  const handleOpenReview = () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to write a review and rate this creator.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('SignIn') }
        ]
      );
      return;
    }
    setSelectedRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!profile) return;
    if (!reviewComment.trim()) {
      Alert.alert('Missing Review', 'Please write a brief comment describing your experience.');
      return;
    }

    setSubmittingReview(true);
    try {
      const newRev = await professionalApi.addReview(profile.id, selectedRating, reviewComment);
      setReviews(prev => [newRev, ...prev]);
      
      // Update profile review stats locally
      const updatedCount = (profile.reviewCount || 0) + 1;
      const currentRating = profile.rating || 5.0;
      const updatedRating = Number(((currentRating * (profile.reviewCount || 0) + selectedRating) / updatedCount).toFixed(1));
      
      setProfile(prev => prev ? {
        ...prev,
        rating: updatedRating,
        reviewCount: updatedCount,
        reviews: [newRev, ...(prev.reviews || [])]
      } : null);

      setShowReviewModal(false);
      setReviewComment('');
      Alert.alert('Review Submitted! ⭐', 'Thank you! Your verified rating and review have been published.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShareProfile = async () => {
    if (!profile) return;
    try {
      const shareUrl = `https://camqrew.in/creators/${profile.id}`;
      const title = `Check out ${profile.name} on Camqrew`;
      const message = `🎬 Check out ${profile.name} (${profile.title || 'Creator'}) on Camqrew!\n⭐ ${(profile.rating ?? 5.0).toFixed(1)} Rating • ₹${(profile.ratePerDay || 15000).toLocaleString('en-IN')}/day\n📍 ${profile.city}, ${profile.state}\n\nView portfolio, showreels, and book directly:\n${shareUrl}`;
      await Share.share({
        title,
        message,
        url: shareUrl,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  // ── Instagram-Style In-Profile Posting Handlers ──
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
      setToastMessage('Uploading photo to your portfolio...');
      setToastVisible(true);

      // Upload to Supabase Storage
      let finalUrl = uri;
      try {
        const uploaded = await cloudStorageApi.uploadImage(uri, 'portfolio');
        if (uploaded?.url) {
          finalUrl = uploaded.url;
        }
      } catch (uploadErr) {
        console.warn('Cloud storage upload warning:', uploadErr);
      }

      const currentPortfolio = profile?.portfolio || [];
      const updatedPortfolio = [finalUrl, ...currentPortfolio];

      // Optimistically update profile state
      setProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : null);

      // Persist to database
      await professionalApi.updateProfile({ portfolio: updatedPortfolio });

      setToastType('success');
      setToastMessage('📸 Photo added to your portfolio!');
      setToastVisible(true);
    } catch (err: any) {
      console.error('Failed to add photo:', err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to add photo.');
      setToastVisible(true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePostReel = async () => {
    if (!newReelUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter a valid YouTube or Vimeo URL.');
      return;
    }
    setSubmittingReel(true);
    try {
      const parsed = parseVideoUrl(newReelUrl.trim());
      const newReel: VideoReelItem = {
        id: 'reel_' + Date.now(),
        title: newReelTitle.trim() || (parsed.isShort ? 'Video Reel' : 'Featured Showreel'),
        url: newReelUrl.trim(),
        type: parsed.type,
        embedUrl: parsed.embedUrl,
        thumbnailUrl: parsed.thumbnailUrl,
        category: newReelCategory,
        isShort: newReelIsShort || parsed.isShort,
      };

      const currentReels = profile?.videoReels || [];
      const updatedReels = [newReel, ...currentReels];

      // Optimistically update profile state
      setProfile(prev => prev ? { ...prev, videoReels: updatedReels } : null);

      // Persist to database
      await professionalApi.updateProfile({ videoReels: updatedReels });

      setShowReelModal(false);
      setNewReelUrl('');
      setNewReelTitle('');
      setNewReelIsShort(false);
      setToastType('success');
      setToastMessage('🎬 Video reel posted to your profile!');
      setToastVisible(true);
    } catch (err: any) {
      console.error('Failed to post reel:', err);
      Alert.alert('Error', err.message || 'Failed to post reel.');
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
              const currentPortfolio = profile?.portfolio || [];
              const updatedPortfolio = currentPortfolio.filter((_, i) => i !== index);
              setProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : null);
              setSelectedImgIndex(null);
              await professionalApi.updateProfile({ portfolio: updatedPortfolio });
              setToastType('info');
              setToastMessage('Photo removed from portfolio.');
              setToastVisible(true);
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
              const currentReels = profile?.videoReels || [];
              const updatedReels = currentReels.filter(r => r.id !== reelId);
              setProfile(prev => prev ? { ...prev, videoReels: updatedReels } : null);
              await professionalApi.updateProfile({ videoReels: updatedReels });
              setToastType('info');
              setToastMessage('Video reel removed.');
              setToastVisible(true);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete reel.');
            }
          }
        }
      ]
    );
  };

  if (loading || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const safeServices = profile.services && profile.services.length > 0 ? profile.services : [
    {
      id: 'srv_default',
      title: isStudio ? 'Full Day Studio Access' : 'Full Day Shoot Package',
      category: profile.categories[0] || 'Creative Service',
      rate: profile.ratePerDay || 15000,
      unit: 'per day',
      description: isStudio 
        ? 'Includes full access to the studio bay, basic grip equipment, and green room.'
        : 'Includes full day coverage with high resolution deliverables.',
    }
  ];

  const safePortfolio = profile.portfolio && profile.portfolio.length > 0 ? profile.portfolio : [
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800',
  ];

  const isOwnProfile = Boolean(user?.id && (user.id === profile.id || user.id === profile.userId));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ── Cinematic Hero Banner ── */}
        <View style={styles.headerBanner}>
          <Image source={{ uri: profile.bannerImage }} style={styles.banner} />
          <View style={styles.bannerOverlay} />

          {/* Top Floating Header Controls */}
          <View style={styles.topControlRow}>
            <TouchableOpacity style={styles.roundBackBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color="#ffffff" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {isOwnProfile && (
                <TouchableOpacity
                  style={[styles.roundBackBtn, { backgroundColor: '#3fb668' }]}
                  onPress={() => setShowCreateSheet(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={22} color="#ffffff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.roundBackBtn} onPress={handleShareProfile} activeOpacity={0.8}>
                <Share2 size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.avatarWrapper}>
            <Avatar source={profile.avatar} size={100} verified={profile.verified} />
          </View>
        </View>

        {/* ── Profile Overview Card ── */}
        <View style={styles.profileMeta}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.name}</Text>
            {profile.verified && (
              <View style={styles.verifiedTagRow}>
                <ShieldCheck size={16} color={colors.accent} />
              </View>
            )}
          </View>
          <Text style={[styles.title, { color: colors.accent }]}>{isStudio ? 'Creative Studio Bay' : profile.title}</Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              {profile.city}, {profile.state}
            </Text>
            <View style={[styles.dotSeparator, { backgroundColor: colors.borderLight }]} />
            <Briefcase size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              {profile.experienceYears || 2}+ Years Exp
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <View style={[styles.ratingPill, { backgroundColor: colors.surfaceCard }]}>
              <Star size={14} color={colors.warning} fill={colors.warning} style={{ marginRight: 4 }} />
              <Text style={[styles.ratingVal, { color: colors.textPrimary }]}>{(profile.rating ?? 4.9).toFixed(1)}</Text>
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>({profile.reviewCount ?? 18} reviews)</Text>
            </View>
          </View>
        </View>

        {/* ── Floating Action Bar ── */}
        <View style={[styles.actionCard, { backgroundColor: colors.surfaceCard }]}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity 
                style={[styles.messageBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => setShowCreateSheet(true)}
                activeOpacity={0.8}
              >
                <PlusCircle size={18} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.messageBtnText, { color: colors.accent }]}>+ Post Content</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.bookBtn, { backgroundColor: colors.accent }]}
                onPress={handleShareProfile}
                activeOpacity={0.8}
              >
                <Share2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.bookBtnText}>Share Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.messageBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => navigation.navigate('Chat', { otherUserId: profile.id, otherUserName: profile.name, otherUserAvatar: profile.avatar })}
                activeOpacity={0.8}
              >
                <MessageSquare size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
                <Text style={[styles.messageBtnText, { color: colors.textPrimary }]}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.bookBtn, { backgroundColor: colors.accent }]}
                onPress={() => navigation.navigate('Booking', { proId: profile.id, type: bookingType })}
                activeOpacity={0.8}
              >
                <Zap size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.bookBtnText}>Book Now • ₹{(profile.ratePerDay || 15000).toLocaleString('en-IN')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── About Section ── */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About {isStudio ? 'the Studio' : 'the Creator'}</Text>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>{profile.bio}</Text>
        </Card>

        {/* ── Services & Packages ── */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Packages & Rates</Text>
          {safeServices.map(srv => (
            <View key={srv.id} style={[styles.serviceBox, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.serviceHeader}>
                <Text style={[styles.serviceTitle, { color: colors.textPrimary }]}>{srv.title}</Text>
                <Text style={[styles.serviceRate, { color: colors.accent }]}>
                  ₹{(srv.rate || 15000).toLocaleString('en-IN')} <Text style={[styles.serviceUnit, { color: colors.textFaint }]}>/{srv.unit}</Text>
                </Text>
              </View>
              {srv.description ? (
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>{srv.description}</Text>
              ) : null}
              {srv.deliverables ? (
                <View style={[styles.deliverablesBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.deliverablesLabel, { color: colors.textPrimary }]}>Deliverables:</Text>
                  <Text style={[styles.deliverablesText, { color: colors.textSecondary }]}>{srv.deliverables}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </Card>

        {/* ── Showreels & Video Reels ── */}
        {profile.videoReels && profile.videoReels.length > 0 ? (
          <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.reelsHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Film size={18} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Showreels & Video Reels</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Badge label={`${profile.videoReels.length} ${profile.videoReels.length === 1 ? 'Reel' : 'Reels'}`} variant="info" />
                {isOwnProfile && (
                  <TouchableOpacity
                    style={{ backgroundColor: 'rgba(63,182,104,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => setShowReelModal(true)}
                    activeOpacity={0.8}
                  >
                    <Plus size={12} color="#3fb668" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#3fb668', fontSize: 11, fontWeight: '800' }}>Add Reel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18, marginTop: 12 }}>
              <View style={{ width: 18 }} />
              {isOwnProfile && (
                <TouchableOpacity 
                  activeOpacity={0.85} 
                  onPress={() => setShowReelModal(true)} 
                  style={[styles.addReelCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}
                >
                  <View style={[styles.addPhotoIconCircle, { backgroundColor: 'rgba(63,182,104,0.15)' }]}>
                    <Film size={22} color={colors.accent} />
                  </View>
                  <Text style={[styles.addPhotoCardText, { color: colors.textPrimary }]}>+ Post Reel</Text>
                  <Text style={[styles.addPhotoCardSub, { color: colors.textSecondary }]}>YouTube / Shorts</Text>
                </TouchableOpacity>
              )}
              {profile.videoReels.map((reel) => {
                const isShort = reel.isShort;
                return (
                  <View key={reel.id} style={{ position: 'relative' }}>
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => {
                        if (reel.url) {
                          Linking.openURL(reel.url).catch(() => {
                            Alert.alert('Unable to open video', 'Please verify your internet connection or URL.');
                          });
                        }
                      }}
                      style={[
                        styles.reelCard,
                        isShort ? styles.reelCardVertical : styles.reelCardCinema,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }
                      ]}
                    >
                      {reel.thumbnailUrl ? (
                        <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelThumbnail} resizeMode="cover" />
                      ) : (
                        <View style={[styles.reelPlaceholder, { backgroundColor: '#111827' }]}>
                          <Film size={32} color={colors.accent} />
                        </View>
                      )}
                      <View style={styles.reelVignette} />

                      {/* Play Button Badge */}
                      <View style={styles.reelPlayBtn}>
                        <Play size={16} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
                      </View>

                      {/* Top Badges */}
                      <View style={styles.reelTopBadges}>
                        <View style={[styles.reelBadgePill, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                          <Text style={styles.reelBadgeText}>
                            {reel.type === 'youtube' ? (isShort ? '⚡ Short' : 'YouTube') : reel.type === 'vimeo' ? 'Vimeo' : 'Video'}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom Info */}
                      <View style={styles.reelInfo}>
                        {reel.category ? (
                          <Text style={[styles.reelCategory, { color: colors.accent }]} numberOfLines={1}>
                            {reel.category.toUpperCase()}
                          </Text>
                        ) : null}
                        <Text style={styles.reelTitle} numberOfLines={2}>
                          {reel.title}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Owner In-Profile Delete Button */}
                    {isOwnProfile && (
                      <TouchableOpacity
                        style={styles.reelDeleteBtn}
                        onPress={() => handleDeleteReel(reel.id, reel.title)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={13} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              <View style={{ width: 18 }} />
            </ScrollView>
          </Card>
        ) : isOwnProfile ? (
          <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.reelsHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Film size={18} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Showreels & Video Reels</Text>
              </View>
            </View>
            <View style={{ alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12 }}>
              <Film size={34} color={colors.accent} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>No Video Reels Added Yet</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 14 }}>
                Showcase your cinematic work! Embed YouTube videos, 9:16 Shorts, and Vimeo reels directly on your profile.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setShowReelModal(true)}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Post Your First Video Reel</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : null}

        {/* ── Cinematic Portfolio Gallery ── */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
          <View style={styles.reelsHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ImageIcon size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Portfolio Highlights</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Badge label={`${profile.portfolio?.length || safePortfolio.length} Photos`} variant="info" />
              {isOwnProfile && (
                <TouchableOpacity
                  style={{ backgroundColor: 'rgba(63,182,104,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                  onPress={handlePostPhoto}
                  activeOpacity={0.8}
                >
                  <Plus size={12} color="#3fb668" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#3fb668', fontSize: 11, fontWeight: '800' }}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18, marginTop: 12 }}>
            <View style={{ width: 18 }} />
            {isOwnProfile && (
              <TouchableOpacity 
                activeOpacity={0.85} 
                onPress={handlePostPhoto} 
                style={[styles.addPhotoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <View style={[styles.addPhotoIconCircle, { backgroundColor: 'rgba(63,182,104,0.15)' }]}>
                      <Camera size={22} color={colors.accent} />
                    </View>
                    <Text style={[styles.addPhotoCardText, { color: colors.textPrimary }]}>+ Post Photo</Text>
                    <Text style={[styles.addPhotoCardSub, { color: colors.textSecondary }]}>Add to Gallery</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {safePortfolio.map((img, idx) => (
              <TouchableOpacity 
                key={idx} 
                activeOpacity={0.88} 
                onPress={() => setSelectedImgIndex(idx)} 
                style={styles.portfolioItemCinematic}
              >
                <Image source={{ uri: img }} style={styles.portfolioImage} />
              </TouchableOpacity>
            ))}
            <View style={{ width: 18 }} />
          </ScrollView>
        </Card>

        {/* ── Equipment / Amenities ── */}
        {profile.equipment && profile.equipment.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{isStudio ? 'Studio Amenities' : 'Equipment Roster'}</Text>
            <View style={styles.chipsWrap}>
              {profile.equipment.map((eq, i) => (
                <Badge key={i} label={eq} variant="info" />
              ))}
            </View>
          </Card>
        )}

        {/* ── Client Reviews & Star Ratings Section ── */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
          <View style={styles.reviewsHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 2 }]}>Client Reviews & Ratings</Text>
              <View style={styles.reviewsSubRatingRow}>
                <Star size={16} color={colors.warning} fill={colors.warning} style={{ marginRight: 4 }} />
                <Text style={[styles.reviewsScoreText, { color: colors.textPrimary }]}>
                  {(profile.rating ?? 5.0).toFixed(1)}
                </Text>
                <Text style={[styles.reviewsTotalCount, { color: colors.textSecondary }]}>
                  • {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.writeReviewBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={handleOpenReview}
              activeOpacity={0.8}
            >
              <Star size={14} color={colors.accent} fill={colors.accent} style={{ marginRight: 6 }} />
              <Text style={[styles.writeReviewBtnText, { color: colors.textPrimary }]}>Write a Review</Text>
            </TouchableOpacity>
          </View>

          {reviews.length === 0 ? (
            <View style={[styles.emptyReviewsBox, { backgroundColor: colors.background }]}>
              <MessageCircle size={32} color={colors.textFaint} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyReviewsTitle, { color: colors.textPrimary }]}>No reviews yet</Text>
              <Text style={[styles.emptyReviewsDesc, { color: colors.textSecondary }]}>
                Be the first to share your experience working with {profile.name}!
              </Text>
              <TouchableOpacity
                style={[styles.beFirstBtn, { backgroundColor: colors.accent }]}
                onPress={handleOpenReview}
              >
                <Text style={styles.beFirstBtnText}>Rate & Review Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reviewsListContainer}>
              {reviews.map((rev, i) => (
                <View key={rev.id || i} style={[styles.reviewItemCard, { borderBottomColor: colors.border }]}>
                  <View style={styles.reviewAuthorRow}>
                    <View style={styles.reviewerMeta}>
                      {rev.clientAvatar ? (
                        <Image source={{ uri: rev.clientAvatar }} style={styles.reviewerAvatar} />
                      ) : (
                        <View style={[styles.reviewerInitials, { backgroundColor: colors.accent }]}>
                          <Text style={styles.reviewerInitialText}>
                            {rev.clientName ? rev.clientName[0].toUpperCase() : 'C'}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>{rev.clientName}</Text>
                        <Text style={[styles.reviewDate, { color: colors.textFaint }]}>{rev.date}</Text>
                      </View>
                    </View>

                    {/* Star Rating Badge */}
                    <View style={[styles.reviewStarsPill, { backgroundColor: colors.surfaceElevated }]}>
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <Star
                          key={starVal}
                          size={13}
                          color={starVal <= rev.rating ? '#F5A623' : colors.textFaint}
                          fill={starVal <= rev.rating ? '#F5A623' : 'transparent'}
                          style={{ marginHorizontal: 1 }}
                        />
                      ))}
                    </View>
                  </View>

                  <Text style={[styles.reviewCommentText, { color: colors.textSecondary }]}>
                    {rev.comment}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ── Gear for Sale & Rent ── */}
        {products && products.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Gear for Sale & Rent</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {products.map(prod => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onPress={() => navigation.navigate('ProductDetail', { product: prod })}
                  onAddToCart={() => addItem(prod)}
                />
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Lightbox Modal */}
      <Modal visible={selectedImgIndex !== null} transparent animationType="fade" onRequestClose={() => setSelectedImgIndex(null)}>
        <View style={styles.modalBg}>
          <View style={styles.lightboxTopBar}>
            {isOwnProfile && selectedImgIndex !== null && (
              <TouchableOpacity 
                style={styles.deletePhotoBtn} 
                onPress={() => handleDeletePhoto(safePortfolio[selectedImgIndex], selectedImgIndex)}
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

          {selectedImgIndex !== null && (
            <View style={styles.lightboxContainer}>
              <Text style={styles.lightboxCounter}>
                {selectedImgIndex + 1} / {safePortfolio.length}
              </Text>
              
              <Image source={{ uri: safePortfolio[selectedImgIndex] }} style={styles.fullImage} resizeMode="contain" />

              <View style={styles.slideshowControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.navArrow}
                  onPress={() => setSelectedImgIndex(prev => (prev !== null ? (prev > 0 ? prev - 1 : safePortfolio.length - 1) : null))}
                >
                  <ChevronLeft size={36} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.navArrow}
                  onPress={() => setSelectedImgIndex(prev => (prev !== null ? (prev < safePortfolio.length - 1 ? prev + 1 : 0) : null))}
                >
                  <ChevronRight size={36} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
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
                <Text style={[styles.createOptionTitle, { color: colors.textPrimary }]}>Post Video Reel / Showreel</Text>
                <Text style={[styles.createOptionDesc, { color: colors.textSecondary }]}>
                  Embed YouTube, 9:16 Shorts, or Vimeo reels directly to your profile
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
            {/* Modal Header */}
            <View style={styles.reelModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Film size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.reelModalTitle, { color: colors.textPrimary }]}>Post Video Reel</Text>
              </View>
              <TouchableOpacity onPress={() => !submittingReel && setShowReelModal(false)} style={{ padding: 4 }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: Dimensions.get('window').height * 0.7 }}>
              <Text style={[styles.reelModalSub, { color: colors.textSecondary }]}>
                Embed YouTube videos, 9:16 vertical Shorts, or Vimeo showreels directly to your profile.
              </Text>

              <Input
                label="Video URL (YouTube, Shorts, or Vimeo)"
                placeholder="https://youtube.com/shorts/... or https://vimeo.com/..."
                value={newReelUrl}
                onChangeText={setNewReelUrl}
              />

              {/* Detected format feedback */}
              {newReelUrl.trim().length > 0 && (() => {
                const p = parseVideoUrl(newReelUrl.trim());
                return (
                  <View style={[styles.detectedFormatBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} color="#3fb668" />
                      <Text style={{ color: '#3fb668', fontSize: 12, fontWeight: '800' }}>
                        Detected: {p.type === 'youtube' ? (p.isShort ? '9:16 YouTube Short' : 'YouTube Video') : p.type === 'vimeo' ? 'Vimeo Video' : 'Direct Video'}
                      </Text>
                    </View>
                    {p.thumbnailUrl && (
                      <Image source={{ uri: p.thumbnailUrl }} style={styles.previewThumb} />
                    )}
                  </View>
                );
              })()}

              <Input
                label="Reel Title (Optional)"
                placeholder="e.g. 2026 Commercial Highlights"
                value={newReelTitle}
                onChangeText={setNewReelTitle}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {['Showreel', 'Wedding', 'Commercial', 'Fashion', 'Music Video', 'Short Film', 'Drone Reel'].map(cat => (
                  <Chip
                    key={cat}
                    label={cat}
                    active={newReelCategory === cat}
                    onPress={() => setNewReelCategory(cat)}
                  />
                ))}
              </ScrollView>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}
                onPress={() => setNewReelIsShort(!newReelIsShort)}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: newReelIsShort ? '#3fb668' : colors.textFaint,
                    backgroundColor: newReelIsShort ? '#3fb668' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  {newReelIsShort && <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>✓</Text>}
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                  Vertical 9:16 format (Shorts / Reels)
                </Text>
              </TouchableOpacity>

              <Button
                title={submittingReel ? 'Posting Reel...' : 'Post Reel to Profile'}
                variant="primary"
                size="md"
                disabled={submittingReel || !newReelUrl.trim()}
                icon={submittingReel ? <ActivityIndicator size="small" color="#ffffff" /> : <Film size={16} color="#ffffff" />}
                onPress={handlePostReel}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="fade" onRequestClose={() => !submittingReview && setShowReviewModal(false)}>
        <View style={styles.reviewModalOverlay}>
          <View style={[styles.reviewModalCard, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.reviewModalHeader}>
              <View>
                <Text style={[styles.reviewModalTitle, { color: colors.textPrimary }]}>Rate & Review</Text>
                <Text style={[styles.reviewModalSub, { color: colors.textSecondary }]}>Share your experience working with {profile?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => !submittingReview && setShowReviewModal(false)} style={styles.reviewCloseBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)} style={styles.starTouchItem}>
                  <Star
                    size={32}
                    color={star <= selectedRating ? '#F5A623' : colors.border}
                    fill={star <= selectedRating ? '#F5A623' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.starRatingLabel, { color: colors.accent }]}>
              {selectedRating === 5 ? '⭐⭐⭐⭐⭐ Outstanding (5.0)' :
               selectedRating === 4 ? '⭐⭐⭐⭐ Very Good (4.0)' :
               selectedRating === 3 ? '⭐⭐⭐ Good (3.0)' :
               selectedRating === 2 ? '⭐⭐ Fair (2.0)' : '⭐ Needs Improvement (1.0)'}
            </Text>

            <Text style={[styles.commentInputLabel, { color: colors.textSecondary }]}>Your Feedback</Text>
            <TextInput
              style={[styles.commentTextInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight, color: colors.textPrimary }]}
              placeholder="Tell other clients about communication, creativity, and delivery quality..."
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
              textAlignVertical="top"
            />

            <View style={styles.reviewModalActions}>
              <TouchableOpacity
                style={[styles.reviewCancelBtn, { borderColor: colors.borderLight }]}
                onPress={() => setShowReviewModal(false)}
                disabled={submittingReview}
              >
                <Text style={[styles.reviewCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Send size={15} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.reviewSubmitBtnText}>Submit Review</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Feedback */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: 50,
  },
  
  // Cinematic Banner
  headerBanner: {
    height: 280,
    position: 'relative',
    backgroundColor: '#000000',
  },
  banner: { width: '100%', height: '100%' },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topControlRow: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  roundBackBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -50,
    left: '50%',
    marginLeft: -50,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },

  // Overview Meta
  profileMeta: {
    padding: 20,
    paddingTop: 64,
    alignItems: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 28, fontWeight: '900' },
  verifiedTagRow: { marginLeft: 6 },
  title: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  locationText: { fontSize: 14, fontWeight: '600' },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 10 },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12,
  },
  ratingVal: { fontSize: 14, fontWeight: '900' },
  reviewCount: { fontSize: 12, marginLeft: 6, fontWeight: '600' },

  // Floating Action Card
  actionCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 8,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 8,
  },
  messageBtnText: { fontSize: 15, fontWeight: '800' },
  bookBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  bookBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },

  // Section Cards
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 0,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2,
  },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 16 },
  bioText: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  
  // Services
  serviceBox: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  serviceRate: { fontSize: 18, fontWeight: '900' },
  serviceUnit: { fontSize: 13 },
  serviceDesc: { fontSize: 14, lineHeight: 20, marginTop: 12 },
  deliverablesBox: { marginTop: 12, padding: 10, borderRadius: 8 },
  deliverablesLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  deliverablesText: { fontSize: 13, lineHeight: 18 },

  // Portfolio
  portfolioItemCinematic: {
    width: 260,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  portfolioImage: { width: '100%', height: '100%' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

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

  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsSubRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reviewsScoreText: {
    fontSize: 16,
    fontWeight: '800',
  },
  reviewsTotalCount: {
    fontSize: 13,
    marginLeft: 4,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  writeReviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyReviewsBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyReviewsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyReviewsDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 260,
  },
  beFirstBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  beFirstBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewsListContainer: {
    marginTop: 4,
  },
  reviewItemCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewerInitials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitialText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 11,
    marginTop: 1,
  },
  reviewStarsPill: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewCommentText: {
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 46,
  },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  reviewModalCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reviewModalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  reviewModalSub: {
    fontSize: 13,
    marginTop: 2,
  },
  reviewCloseBtn: {
    padding: 4,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  starTouchItem: {
    padding: 6,
  },
  starRatingLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  commentInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  commentTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  reviewModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewSubmitBtn: {
    flex: 1.6,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  reelsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reelCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    position: 'relative',
    borderWidth: 1,
  },
  reelCardVertical: {
    width: 170,
    height: 270,
  },
  reelCardCinema: {
    width: 270,
    height: 180,
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
  reelVignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  reelPlayBtn: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: -21,
    marginTop: -21,
    backgroundColor: '#3fb668',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  reelTopBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
  },
  reelBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  reelBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  reelInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  reelCategory: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reelTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },

  // In-Profile Creation & Deletion Styles
  reelDeleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  addPhotoCard: {
    width: 130,
    height: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    padding: 12,
  },
  addReelCard: {
    width: 130,
    height: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    padding: 12,
  },
  addPhotoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addPhotoCardText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  addPhotoCardSub: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
  },
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
  },
  reelModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reelModalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  reelModalSub: {
    fontSize: 13,
    marginBottom: 16,
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
});