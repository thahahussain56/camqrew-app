import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Dimensions, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform, Share, Linking, LayoutAnimation, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { professionalApi } from '../../api/professionalApi';
import { studioApi } from '../../api/studioApi';
import { productApi } from '../../api/productApi';
import { ProfessionalProfile, ReviewItem, VideoReelItem, MenuDishItem, ServiceItem } from '../../types/professional';
import { Product } from '../../types/product';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProductCard } from '../../components/cards/ProductCard';
import { DishCard } from '../../components/cards/DishCard';
import { ServiceCard } from '../../components/cards/ServiceCard';
import { getServiceImage } from '../../utils/serviceUtils';
import { useCartStore } from '../../store/cartStore';
import { Star, MapPin, X, ArrowLeft, ShieldCheck, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MessageSquare, Briefcase, CheckCircle, Send, MessageCircle, Share2, Film, Play, ExternalLink, ThumbsUp, Check, Award, UtensilsCrossed, Plus, Minus, Clock, Gift, ShoppingBag, Sparkles, Eye, Camera, Info } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { getArchetype } from '../../constants/categories';

type ProfileTab = 'images' | 'videos' | 'services' | 'products' | 'reviews' | 'details';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

export const PublicProfileScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  
  const proId = route?.params?.id || route?.params?.professionalId;
  const bookingType = route?.params?.type || 'professionals';
  const isStudio = bookingType === 'studios' || bookingType === 'studio';

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('images');
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const [selectedVideoReel, setSelectedVideoReel] = useState<VideoReelItem | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const { addItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const handleBookService = (srv: ServiceItem) => {
    if (!profile) return;
    const cleanUnit = (srv.unit || 'event').toLowerCase().replace(/^per\s+/i, '').trim();
    const notes = `Service: ${srv.title}\nCategory: ${srv.category}\nRate: ₹${(srv.rate || 15000).toLocaleString('en-IN')}/${cleanUnit}\nDescription: ${srv.description || ''}${srv.deliverables ? `\nDeliverables: ${srv.deliverables}` : ''}`;
    navigation.navigate('Booking', {
      proId: profile.id,
      professionalId: profile.id,
      professionalName: profile.name,
      professionalTitle: profile.title,
      ratePerDay: srv.rate,
      serviceTitle: srv.title,
      notes,
    });
  };

  // Accordion Expand/Collapse State
  const [capabilitiesExpanded, setCapabilitiesExpanded] = useState(true);
  const [certificationsExpanded, setCertificationsExpanded] = useState(false);

  const toggleCapabilities = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCapabilitiesExpanded(prev => !prev);
  };

  const toggleCertifications = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCertificationsExpanded(prev => !prev);
  };

  // Menu Section State (Caterers)
  const [menuExpanded, setMenuExpanded] = useState(true);
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');
  const [menuSelections, setMenuSelections] = useState<Record<string, number>>({});
  const MENU_CATEGORIES = ['All', 'Starter', 'Main Course', 'Dessert', 'Beverage', 'Live Counter', 'Other'];

  const menuTotal = Object.entries(menuSelections).reduce((sum, [id, qty]) => {
    const dish = profile?.menuItems?.find(d => d.id === id);
    return sum + (dish ? dish.pricePerPlate * qty : 0);
  }, 0);
  const menuItemCount = Object.values(menuSelections).reduce((a, b) => a + b, 0);

  const adjustMenuQty = (id: string, delta: number) => {
    setMenuSelections(prev => {
      const next = (prev[id] || 0) + delta;
      return { ...prev, [id]: Math.max(0, next) };
    });
  };

  // Reviews & Rating State
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [userVotedHelpful, setUserVotedHelpful] = useState<Record<string, boolean>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const QUICK_TAGS = [
    'Punctual & Reliable',
    'Exceptional Quality',
    'Great Communication',
    'Creative Direction',
    'Fast Turnaround',
    'Escrow Verified Work',
  ];

  const getRatingSentiment = (r: number) => {
    switch (r) {
      case 5: return { label: 'Exceptional Work! 🌟', color: '#10b981' };
      case 4: return { label: 'Very Good! 👍', color: '#3fb668' };
      case 3: return { label: 'Satisfactory 👌', color: '#f59e0b' };
      case 2: return { label: 'Could Be Better 👎', color: '#f97316' };
      case 1: return { label: 'Disappointing Experience ⚠️', color: '#ef4444' };
      default: return { label: 'Select Rating', color: colors.textSecondary };
    }
  };

  const handleToggleHelpful = (reviewId: string) => {
    setUserVotedHelpful(prev => {
      const isAlreadyVoted = !!prev[reviewId];
      const updatedState = !isAlreadyVoted;
      
      setHelpfulVotes(vPrev => ({
        ...vPrev,
        [reviewId]: Math.max(0, (vPrev[reviewId] || 0) + (updatedState ? 1 : -1)),
      }));

      return {
        ...prev,
        [reviewId]: updatedState,
      };
    });
  };

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
    setSelectedTags([]);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!profile) return;
    if (!reviewComment.trim() && selectedTags.length === 0) {
      Alert.alert('Missing Feedback', 'Please write a comment or select highlights describing your experience.');
      return;
    }

    setSubmittingReview(true);
    try {
      const tagSuffix = selectedTags.length > 0 ? `\n\nHighlights: ${selectedTags.join(' • ')}` : '';
      const finalComment = `${reviewComment.trim()}${tagSuffix}`.trim();

      const newRev = await professionalApi.addReview(profile.id, selectedRating, finalComment);
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
      setSelectedTags([]);
      Alert.alert('Review Published! ⭐', 'Thank you! Your verified rating and review have been published.');
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

  const proArchetype = getArchetype(profile?.categories);
  const isBaker = proArchetype.archetype === 'home_baker';
  const isCrafts = proArchetype.archetype === 'crafts_gifting';
  const isItemCatalog = isBaker || isCrafts;

  const displayProducts = useMemo(() => {
    if (products.length > 0) return products;
    if (isCrafts && profile?.menuItems && profile.menuItems.length > 0) {
      return profile.menuItems.filter(m => m.isAvailable).map(m => ({
        id: m.id,
        name: m.name,
        brand: 'Handcrafted',
        category: m.category || 'Crafts & Gifting',
        type: 'sale' as const,
        price: m.pricePerPlate,
        condition: 'New',
        image: m.imageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800',
        gallery: m.imageUrl ? [m.imageUrl] : [],
        description: m.description || '',
        specs: {},
        inStock: true,
        rating: 4.9,
        codEnabled: true,
      }));
    }
    return [];
  }, [products, isCrafts, profile?.menuItems]);

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
      title: isStudio ? 'Full Day Studio Access' : `${proArchetype.serviceTitlePlaceholder.replace('e.g. ', '')}`,
      category: profile.categories[0] || proArchetype.label,
      rate: profile.ratePerDay || Number(proArchetype.ratePlaceholder),
      unit: `per ${proArchetype.rateUnitDefault.toLowerCase()}`,
      description: isStudio 
        ? 'Includes full access to the studio bay, basic grip equipment, and green room.'
        : `Includes complete ${proArchetype.roleNoun.toLowerCase()} service coverage and deliverables.`,
    }
  ];

  const safePortfolio = profile.portfolio && profile.portfolio.length > 0 ? profile.portfolio : [
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800',
  ];

  // Ratings Breakdown & Filter calculations
  const starCounts = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => Math.round(r.rating) === stars).length;
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, count, percentage };
  });

  const filteredReviews = ratingFilter === 'all'
    ? reviews
    : reviews.filter(r => Math.round(r.rating) === ratingFilter);

  const filterOptions: { label: string; value: 'all' | number; count?: number }[] = [
    { label: 'All', value: 'all', count: reviews.length },
    { label: '5 ★', value: 5, count: reviews.filter(r => Math.round(r.rating) === 5).length },
    { label: '4 ★', value: 4, count: reviews.filter(r => Math.round(r.rating) === 4).length },
    { label: '3 ★', value: 3, count: reviews.filter(r => Math.round(r.rating) === 3).length },
    { label: '2 ★', value: 2, count: reviews.filter(r => Math.round(r.rating) === 2).length },
    { label: '1 ★', value: 1, count: reviews.filter(r => Math.round(r.rating) === 1).length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top Floating Navigation Controls (Safe Notch Aware) ── */}
      <SafeAreaView edges={['top']} style={styles.topControlSafeArea}>
        <View style={styles.topControlRow}>
          <TouchableOpacity 
            style={[styles.roundControlBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roundControlBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} 
            onPress={handleShareProfile} 
            activeOpacity={0.8}
          >
            <Share2 size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Cinematic Hero Banner ── */}
        <View style={styles.headerBanner}>
          <Image source={{ uri: profile.bannerImage }} style={styles.banner} />
          <View style={styles.bannerOverlay} />
        </View>

        {/* ── Profile Identity & Overview Sheet ── */}
        <View style={[styles.profileSheet, { backgroundColor: colors.background }]}>
          {/* Avatar and Quick Stats Row */}
          <View style={styles.avatarHeaderRow}>
            <View style={styles.avatarWrap}>
              <Avatar source={profile.avatar} size={64} verified={profile.verified} />
            </View>
            <View style={styles.quickMetricsRow}>
              <View style={[styles.metricPill, { backgroundColor: colors.surfaceCard }]}>
                <Star size={13} color="#FFB800" fill="#FFB800" />
                <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{(profile.rating ?? 4.9).toFixed(1)}</Text>
                <Text style={[styles.metricSub, { color: colors.textSecondary }]}>({profile.reviewCount ?? 18})</Text>
              </View>
              <View style={[styles.metricPill, { backgroundColor: colors.surfaceCard }]}>
                <Briefcase size={13} color={colors.accent} />
                <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{profile.experienceYears || 2}+</Text>
                <Text style={[styles.metricSub, { color: colors.textSecondary }]}>yrs</Text>
              </View>
            </View>
          </View>

          {/* Name & Title */}
          <View style={styles.identityMeta}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.name}</Text>
              {profile.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.accentGlow }]}>
                  <ShieldCheck size={14} color={colors.accent} />
                  <Text style={[styles.verifiedBadgeText, { color: colors.accent }]}>Verified</Text>
                </View>
              )}
            </View>

            <Text style={[styles.title, { color: colors.accent }]}>
              {isStudio ? 'Creative Studio Bay' : profile.title}
            </Text>

            {/* Location & Categories tags */}
            <View style={styles.tagsRow}>
              <View style={[styles.tagPill, { backgroundColor: colors.surfaceElevated }]}>
                <MapPin size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  {profile.city}, {profile.state}
                </Text>
              </View>
              {profile.categories && profile.categories.length > 0 && (
                <View style={[styles.tagPill, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                    {profile.categories[0]}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── About Section ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            About {isStudio ? 'the Studio' : `the ${proArchetype.roleNoun}`}
          </Text>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>
            {profile.bio}
          </Text>
        </View>

        {/* ── Switchable Section Tabs (6 Icon-Only Buttons Packed in Single Row) ── */}
        <View style={styles.tabBarSection}>
          <View style={styles.tabBarRow}>
            {/* 1. Images */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.tabIconBtn,
                { backgroundColor: activeTab === 'images' ? (isDark ? 'rgba(63, 182, 104, 0.2)' : 'rgba(16, 185, 129, 0.14)') : colors.surfaceCard }
              ]}
              onPress={() => setActiveTab('images')}
            >
              <Camera size={19} color={activeTab === 'images' ? colors.accent : colors.textSecondary} />
            </TouchableOpacity>

            {/* 2. Videos */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.tabIconBtn,
                { backgroundColor: activeTab === 'videos' ? (isDark ? 'rgba(63, 182, 104, 0.2)' : 'rgba(16, 185, 129, 0.14)') : colors.surfaceCard }
              ]}
              onPress={() => setActiveTab('videos')}
            >
              <Film size={19} color={activeTab === 'videos' ? colors.accent : colors.textSecondary} />
            </TouchableOpacity>

            {/* 3. Services */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.tabIconBtn,
                { backgroundColor: activeTab === 'services' ? (isDark ? 'rgba(63, 182, 104, 0.2)' : 'rgba(16, 185, 129, 0.14)') : colors.surfaceCard }
              ]}
              onPress={() => setActiveTab('services')}
            >
              <Sparkles size={19} color={activeTab === 'services' ? colors.accent : colors.textSecondary} />
            </TouchableOpacity>

            {/* 4. Products catalogue / menu / Food products / Rentals */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.tabIconBtn,
                { backgroundColor: activeTab === 'products' ? (isDark ? 'rgba(63, 182, 104, 0.2)' : 'rgba(16, 185, 129, 0.14)') : colors.surfaceCard }
              ]}
              onPress={() => setActiveTab('products')}
            >
              <ShoppingBag size={19} color={activeTab === 'products' ? colors.accent : colors.textSecondary} />
            </TouchableOpacity>

            {/* 5. Rating */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.tabIconBtn,
                { backgroundColor: activeTab === 'reviews' ? (isDark ? 'rgba(63, 182, 104, 0.2)' : 'rgba(16, 185, 129, 0.14)') : colors.surfaceCard }
              ]}
              onPress={() => setActiveTab('reviews')}
            >
              <Star size={19} color={activeTab === 'reviews' ? colors.accent : colors.textSecondary} fill={activeTab === 'reviews' ? colors.accent : 'transparent'} />
            </TouchableOpacity>

            {/* 6. other Details */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.tabIconBtn,
                { backgroundColor: activeTab === 'details' ? (isDark ? 'rgba(63, 182, 104, 0.2)' : 'rgba(16, 185, 129, 0.14)') : colors.surfaceCard }
              ]}
              onPress={() => setActiveTab('details')}
            >
              <Info size={19} color={activeTab === 'details' ? colors.accent : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TAB 1: IMAGES (PORTFOLIO GALLERY) ── */}
        {activeTab === 'images' && (
          <View style={styles.tabContentContainer}>
            <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Camera size={16} color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Portfolio Gallery</Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>{safePortfolio.length} photos</Text>
                </View>
              </View>

              {safePortfolio.length === 0 ? (
                <View style={styles.emptyTabBox}>
                  <Camera size={28} color={colors.textFaint} />
                  <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>No portfolio images uploaded yet.</Text>
                </View>
              ) : (
                <View style={styles.portfolioGrid}>
                  {safePortfolio.map((img, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      activeOpacity={0.88} 
                      onPress={() => setSelectedImgIndex(idx)} 
                      style={styles.portfolioGridItem}
                    >
                      <Image source={{ uri: img }} style={styles.portfolioGridImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── TAB 2: VIDEOS (SHOWREELS & REELS) ── */}
        {activeTab === 'videos' && (
          <View style={styles.tabContentContainer}>
            <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Film size={16} color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Showreels & Video Reels</Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>{profile.videoReels?.length || 0}</Text>
                </View>
              </View>

              {(!profile.videoReels || profile.videoReels.length === 0) ? (
                <View style={styles.emptyTabBox}>
                  <Film size={32} color={colors.textFaint} />
                  <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>No video reels uploaded yet.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -14, marginTop: 10 }}>
                  <View style={{ width: 14 }} />
                  {profile.videoReels.map((reel) => {
                    const isShort = reel.isShort;
                    return (
                      <TouchableOpacity
                        key={reel.id}
                        activeOpacity={0.88}
                        onPress={() => {
                          if (reel.url || reel.embedUrl) {
                            setSelectedVideoReel(reel);
                          }
                        }}
                        style={[
                          styles.reelCard,
                          isShort ? styles.reelCardVertical : styles.reelCardCinema,
                          { backgroundColor: colors.surfaceElevated }
                        ]}
                      >
                        {reel.thumbnailUrl ? (
                          <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelThumbnail} resizeMode="cover" />
                        ) : (
                          <View style={[styles.reelPlaceholder, { backgroundColor: '#111827' }]}>
                            <Film size={26} color={colors.accent} />
                          </View>
                        )}
                        <View style={styles.reelVignette} />

                        {/* Play Button Badge */}
                        <View style={[styles.reelPlayBtn, { backgroundColor: colors.accent }]}>
                          <Play size={13} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
                        </View>

                        {/* Top Badges */}
                        <View style={styles.reelTopBadges}>
                          <View style={[styles.reelBadgePill, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                            <Text style={styles.reelBadgeText}>
                              {isShort ? '9:16 REEL' : 'VIDEO'}
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
                    );
                  })}
                  <View style={{ width: 14 }} />
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* ── TAB 3: SERVICES & PACKAGES (PRODUCT CARDS) ── */}
        {activeTab === 'services' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.servicesSectionContainer}>
              <View style={styles.servicesHeaderBox}>
                <View style={styles.servicesTitleRow}>
                  <Sparkles size={16} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={[styles.servicesHeading, { color: colors.textPrimary }]}>
                    Services & Packages
                  </Text>
                  <View style={[styles.servicesCountBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }]}>
                    <Text style={[styles.servicesCountBadgeText, { color: colors.textSecondary }]}>
                      {safeServices.length} {safeServices.length === 1 ? 'service' : 'services'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.servicesSubtitle, { color: colors.textSecondary }]}>
                  Standardized creative offerings and customizable packages with milestone escrow protection.
                </Text>
              </View>

              {safeServices.length === 0 ? (
                <View style={styles.emptyTabBox}>
                  <Sparkles size={28} color={colors.textFaint} />
                  <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>No custom services listed yet.</Text>
                </View>
              ) : (
                <View style={styles.servicesCardsList}>
                  {safeServices.map(srv => (
                    <ServiceCard
                      key={srv.id}
                      service={srv}
                      creatorName={profile.name}
                      creatorRating={profile.rating || 5.0}
                      creatorBanner={profile.bannerImage}
                      onPressView={() => setSelectedService(srv)}
                      onPressBook={() => handleBookService(srv)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── TAB 4: PRODUCTS CATALOGUE / MENU / FOOD PRODUCTS / RENTALS ── */}
        {activeTab === 'products' && (
          <View style={styles.tabContentContainer}>
            {/* Menu & Dishes Catalog (Catering / Food / Cakes & Bakes) */}
            {profile.menuItems && profile.menuItems.filter(d => d.isAvailable).length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setMenuExpanded(prev => !prev)}
                  style={styles.accordionHeaderBtn}
                >
                  <View style={styles.accordionTitleCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {isCrafts ? (
                        <Gift size={16} color={colors.accent} style={{ marginRight: 8 }} />
                      ) : (
                        <UtensilsCrossed size={16} color={colors.accent} style={{ marginRight: 8 }} />
                      )}
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                        {isCrafts ? 'Crafts, Hampers & Gift Catalog' : (isBaker ? 'Cakes, Bakes & Food Menu' : 'Menu & Dishes')}
                      </Text>
                      <View style={[styles.countBadge, { backgroundColor: colors.accentGlow, marginLeft: 8 }]}>
                        <Text style={[styles.countBadgeText, { color: colors.accent }]}>
                          {profile.menuItems.filter(d => d.isAvailable).length}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.accordionChevronCircle, { backgroundColor: colors.surfaceElevated }]}>
                    {menuExpanded ? (
                      <ChevronUp size={18} color={colors.accent} />
                    ) : (
                      <ChevronDown size={18} color={colors.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>

                {menuExpanded && (
                  <View style={styles.accordionBody}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                      {MENU_CATEGORIES.filter(cat =>
                        cat === 'All' || profile.menuItems!.some(d => d.isAvailable && d.category === cat)
                      ).map(cat => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setMenuCategoryFilter(cat)}
                          style={[
                            styles.menuCatChip,
                            {
                              backgroundColor: menuCategoryFilter === cat
                                ? 'rgba(63, 182, 104, 0.16)'
                                : colors.surfaceElevated,
                            },
                          ]}
                        >
                          <Text style={[
                            styles.menuCatChipText,
                            { color: menuCategoryFilter === cat ? colors.accent : colors.textSecondary },
                          ]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {profile.menuItems
                      .filter(d => d.isAvailable && (menuCategoryFilter === 'All' || d.category === menuCategoryFilter))
                      .map(dish => (
                        <DishCard
                          key={dish.id}
                          dish={dish}
                          quantity={menuSelections[dish.id] || 0}
                          onAdjustQty={(delta) => adjustMenuQty(dish.id, delta)}
                          isBaker={isBaker}
                        />
                      ))}

                    {menuItemCount > 0 && (
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => navigation.navigate('QuotationSummary', {
                          professionalId: proId,
                          catererName: profile.name,
                          catererTitle: profile.title,
                          ratePerDay: profile.ratePerDay,
                          menuItems: profile.menuItems,
                          selections: menuSelections,
                          isBaker: isItemCatalog,
                          archetype: proArchetype.archetype,
                        })}
                        style={[styles.menuQuotationBar, { backgroundColor: colors.accent }]}
                      >
                        <View>
                          <Text style={styles.menuQuotationBarLabel}>
                            {menuItemCount} {isItemCatalog ? 'item' : 'dish'}{menuItemCount > 1 ? (isItemCatalog ? 's' : 'es') : ''} selected
                          </Text>
                          <Text style={styles.menuQuotationBarTotal}>
                            {isItemCatalog ? `₹${menuTotal.toLocaleString('en-IN')} total` : `₹${menuTotal.toLocaleString('en-IN')} / plate`}
                          </Text>
                        </View>
                        <View style={styles.menuQuotationBarRight}>
                          <Text style={styles.menuQuotationBarCta}>{isItemCatalog ? (isCrafts ? 'Order Gifting' : 'Order Summary') : 'Get Quotation'}</Text>
                          <ChevronRight size={16} color="#ffffff" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Product Cards (Crafts, Hampers, Products for Sale & Rentals) */}
            {displayProducts && displayProducts.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isCrafts ? (
                      <Gift size={16} color={colors.accent} style={{ marginRight: 8 }} />
                    ) : (
                      <ShoppingBag size={16} color={colors.accent} style={{ marginRight: 8 }} />
                    )}
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                      {isCrafts ? 'Handcrafted Products & Hampers' : (isBaker ? 'Artisanal Bakes & Products' : 'Gear, Products & Rentals')}
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated, marginLeft: 8 }]}>
                      <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>{displayProducts.length}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {displayProducts.map(prod => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onPress={() => navigation.navigate('ProductDetail', { product: prod })}
                      onAddToCart={() => addItem(prod)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Empty state if pro has neither menu nor products */}
            {(!profile.menuItems || profile.menuItems.filter(d => d.isAvailable).length === 0) &&
             (!displayProducts || displayProducts.length === 0) && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
                <View style={styles.emptyTabBox}>
                  <ShoppingBag size={28} color={colors.textFaint} />
                  <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                    No products, menu packages, or rental items listed yet.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── TAB 5: RATING (REVIEWS & RATINGS) ── */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContentContainer}>
            <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
              {/* Header Row */}
              <View style={styles.reviewsHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 2 }]}>
                    Client Reviews & Ratings
                  </Text>
                  <Text style={[styles.reviewsSubtitle, { color: colors.textSecondary }]}>
                    Verified feedback from completed bookings
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.writeReviewBtn, { backgroundColor: colors.accentGlow }]}
                  onPress={handleOpenReview}
                  activeOpacity={0.8}
                >
                  <Star size={13} color={colors.accent} fill={colors.accent} style={{ marginRight: 5 }} />
                  <Text style={[styles.writeReviewBtnText, { color: colors.accent }]}>Write Review</Text>
                </TouchableOpacity>
              </View>

              {/* Hero Rating Summary Card (Score + 5-Bar Histogram) */}
              <View style={[styles.heroRatingCard, { backgroundColor: colors.surfaceElevated }]}>
                <View style={styles.heroScoreCol}>
                  <Text style={[styles.heroBigScore, { color: colors.textPrimary }]}>
                    {(profile.rating ?? 5.0).toFixed(1)}
                  </Text>
                  <View style={styles.heroStarsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        color="#FFB800"
                        fill={s <= Math.round(profile.rating ?? 5.0) ? '#FFB800' : 'transparent'}
                        style={{ marginHorizontal: 1 }}
                      />
                    ))}
                  </View>
                  <Text style={[styles.heroRatingCount, { color: colors.textSecondary }]}>
                    {reviews.length} {reviews.length === 1 ? 'verified review' : 'verified reviews'}
                  </Text>
                  <View style={[styles.escrowTrustTag, { backgroundColor: colors.accentGlow }]}>
                    <ShieldCheck size={11} color={colors.accent} style={{ marginRight: 4 }} />
                    <Text style={[styles.escrowTrustText, { color: colors.accent }]}>100% Escrow</Text>
                  </View>
                </View>

                <View style={[styles.heroDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

                {/* 5-Bar Histogram */}
                <View style={styles.histogramCol}>
                  {starCounts.map(({ stars, count, percentage }) => (
                    <TouchableOpacity
                      key={stars}
                      style={styles.histogramRow}
                      onPress={() => setRatingFilter(ratingFilter === stars ? 'all' : stars)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.histogramStarLabel, { color: colors.textSecondary }]}>{stars}★</Text>
                      <View style={[styles.histogramTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                        <View
                          style={[
                            styles.histogramFill,
                            {
                              width: `${Math.max(percentage, count > 0 ? 8 : 0)}%`,
                              backgroundColor: ratingFilter === stars ? colors.accent : '#FFB800',
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.histogramCountLabel, { color: colors.textFaint }]}>{count}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Trust Badges Strip (Stroke-Free) */}
              <View style={styles.trustBadgesStrip}>
                <View style={[styles.trustPill, { backgroundColor: colors.surfaceElevated }]}>
                  <CheckCircle size={10} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.trustPillText, { color: colors.textSecondary }]}>Verified Bookings</Text>
                </View>
                <View style={[styles.trustPill, { backgroundColor: colors.surfaceElevated }]}>
                  <ShieldCheck size={10} color="#00dbe9" style={{ marginRight: 4 }} />
                  <Text style={[styles.trustPillText, { color: colors.textSecondary }]}>Escrow Protection</Text>
                </View>
                <View style={[styles.trustPill, { backgroundColor: colors.surfaceElevated }]}>
                  <Award size={10} color="#FFB800" style={{ marginRight: 4 }} />
                  <Text style={[styles.trustPillText, { color: colors.textSecondary }]}>Authentic Clients</Text>
                </View>
              </View>

              {/* Filter Chips Bar (when reviews > 0) */}
              {reviews.length > 0 && (
                <View style={styles.filterChipsContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
                    {filterOptions
                      .filter(opt => opt.value === 'all' || (opt.count ?? 0) > 0)
                      .map((opt) => {
                        const isActive = ratingFilter === opt.value;
                        return (
                          <TouchableOpacity
                            key={String(opt.value)}
                            style={[
                              styles.filterChip,
                              {
                                backgroundColor: isActive ? colors.accent : colors.surfaceElevated,
                              }
                            ]}
                            onPress={() => setRatingFilter(opt.value)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.filterChipText,
                                { color: isActive ? '#ffffff' : colors.textSecondary, fontWeight: isActive ? '800' : '600' }
                              ]}
                            >
                              {opt.label} {opt.count !== undefined ? `(${opt.count})` : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>
              )}

              {/* Reviews List or Empty State */}
              {reviews.length === 0 ? (
                <View style={[styles.emptyReviewsBox, { backgroundColor: colors.surfaceElevated }]}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: colors.accentGlow }]}>
                    <MessageCircle size={24} color={colors.accent} />
                  </View>
                  <Text style={[styles.emptyReviewsTitle, { color: colors.textPrimary }]}>No reviews yet</Text>
                  <Text style={[styles.emptyReviewsDesc, { color: colors.textSecondary }]}>
                    Be the first to share your experience working with {profile.name}!
                  </Text>
                  <TouchableOpacity
                    style={[styles.beFirstBtn, { backgroundColor: colors.accent }]}
                    onPress={handleOpenReview}
                    activeOpacity={0.8}
                  >
                    <Star size={13} color="#ffffff" fill="#ffffff" style={{ marginRight: 5 }} />
                    <Text style={styles.beFirstBtnText}>Rate & Review Now</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredReviews.length === 0 ? (
                <View style={[styles.emptyFilterBox, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.emptyFilterText, { color: colors.textSecondary }]}>
                    No reviews found with {ratingFilter}★ rating.
                  </Text>
                  <TouchableOpacity
                    style={[styles.clearFilterBtn, { backgroundColor: colors.accentGlow }]}
                    onPress={() => setRatingFilter('all')}
                  >
                    <Text style={[styles.clearFilterBtnText, { color: colors.accent }]}>Show All Reviews</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.reviewsListContainer}>
                  {filteredReviews.map((rev, i) => {
                    const isHelpful = !!userVotedHelpful[rev.id];
                    const helpfulCount = helpfulVotes[rev.id] || 0;
                    return (
                      <View
                        key={rev.id || i}
                        style={[
                          styles.reviewItemCard,
                          {
                            backgroundColor: colors.surfaceElevated,
                          }
                        ]}
                      >
                        {/* Review Header: Reviewer Info + Rating Pill */}
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
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>{rev.clientName}</Text>
                                <View style={styles.verifiedBadgeInline}>
                                  <CheckCircle size={10} color={colors.accent} />
                                  <Text style={[styles.verifiedBadgeInlineText, { color: colors.accent }]}>Verified</Text>
                                </View>
                              </View>
                              <Text style={[styles.reviewDate, { color: colors.textFaint }]}>{rev.date}</Text>
                            </View>
                          </View>

                          {/* Amber Rating Pill */}
                          <View style={[styles.reviewStarsPill, { backgroundColor: 'rgba(255, 184, 0, 0.12)' }]}>
                            <Star size={12} color="#FFB800" fill="#FFB800" style={{ marginRight: 3 }} />
                            <Text style={styles.reviewStarsPillText}>{Number(rev.rating).toFixed(1)}</Text>
                          </View>
                        </View>

                        {/* Review Comment Body */}
                        <Text style={[styles.reviewCommentText, { color: colors.textSecondary }]}>
                          {rev.comment}
                        </Text>

                        {/* Review Card Footer: Escrow Tag & Helpful Button */}
                        <View style={styles.reviewFooterRow}>
                          <View style={styles.escrowFooterBadge}>
                            <ShieldCheck size={11} color={colors.accent} style={{ marginRight: 4 }} />
                            <Text style={[styles.escrowFooterText, { color: colors.textSecondary }]}>Escrow Verified</Text>
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.helpfulBtn,
                              {
                                backgroundColor: isHelpful ? colors.accentGlow : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                              }
                            ]}
                            onPress={() => handleToggleHelpful(rev.id)}
                            activeOpacity={0.7}
                          >
                            <ThumbsUp size={11} color={isHelpful ? colors.accent : colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.helpfulBtnText, { color: isHelpful ? colors.accent : colors.textSecondary }]}>
                              Helpful {helpfulCount > 0 ? `(${helpfulCount})` : ''}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── TAB 6: OTHER DETAILS ── */}
        {activeTab === 'details' && (
          <View style={styles.tabContentContainer}>
            {/* Capabilities / Equipment (Expandable Accordion) */}
            {profile.equipment && profile.equipment.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={toggleCapabilities}
                  style={styles.accordionHeaderBtn}
                >
                  <View style={styles.accordionTitleCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                        {isStudio ? 'Studio Amenities & Gear' : proArchetype.equipmentSectionTitle}
                      </Text>
                      <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated, marginLeft: 8 }]}>
                        <Text style={[styles.countBadgeText, { color: colors.accent }]}>
                          {profile.equipment.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.accordionChevronCircle, { backgroundColor: colors.surfaceElevated }]}>
                    {capabilitiesExpanded ? (
                      <ChevronUp size={18} color={colors.accent} />
                    ) : (
                      <ChevronDown size={18} color={colors.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>

                {capabilitiesExpanded && (
                  <View style={styles.accordionBody}>
                    <View style={styles.capabilitiesList}>
                      {profile.equipment.map((eq, i) => (
                        <View key={i} style={[styles.capabilityItemRow, { backgroundColor: colors.surfaceElevated }]}>
                          <View style={[styles.capabilityDot, { backgroundColor: colors.accentGlow }]}>
                            <Check size={12} color={colors.accent} strokeWidth={2.5} />
                          </View>
                          <Text style={[styles.capabilityText, { color: colors.textPrimary }]}>{eq}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Certifications & Industry Affiliations */}
            {profile.certifications && profile.certifications.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={toggleCertifications}
                  style={styles.accordionHeaderBtn}
                >
                  <View style={styles.accordionTitleCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                        {proArchetype.skillsSectionTitle}
                      </Text>
                      <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated, marginLeft: 8 }]}>
                        <Text style={[styles.countBadgeText, { color: colors.accent }]}>
                          {profile.certifications.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.accordionChevronCircle, { backgroundColor: colors.surfaceElevated }]}>
                    {certificationsExpanded ? (
                      <ChevronUp size={18} color={colors.accent} />
                    ) : (
                      <ChevronDown size={18} color={colors.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>

                {certificationsExpanded && (
                  <View style={styles.accordionBody}>
                    <View style={styles.credentialsList}>
                      {profile.certifications.map((cert, i) => (
                        <View key={i} style={[styles.credentialCard, { backgroundColor: colors.surfaceElevated }]}>
                          <View style={[styles.credentialIconCircle, { backgroundColor: colors.accentGlow }]}>
                            <Award size={16} color={colors.accent} />
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.credentialTitle, { color: colors.textPrimary }]}>{cert}</Text>
                            <View style={styles.credentialVerifiedRow}>
                              <ShieldCheck size={11} color={colors.accent} style={{ marginRight: 4 }} />
                              <Text style={[styles.credentialVerifiedText, { color: colors.accent }]}>Verified Credential</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Escrow Protection & Trust Guarantee */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <ShieldCheck size={18} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                  Camcrew Trust & Safety
                </Text>
              </View>
              <Text style={{ fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginBottom: 12 }}>
                100% Escrow Protection on every booking. Payments are split into milestone stages and are only released after your explicit approval.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <View style={[styles.tagPill, { backgroundColor: colors.surfaceElevated }]}>
                  <Check size={11} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>Verified Identity</Text>
                </View>
                <View style={[styles.tagPill, { backgroundColor: colors.surfaceElevated }]}>
                  <Check size={11} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>Escrow Secured</Text>
                </View>
                <View style={[styles.tagPill, { backgroundColor: colors.surfaceElevated }]}>
                  <Check size={11} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>Dispute Resolution</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Persistent Bottom Action Dock ── */}
      <View style={[styles.bottomDock, { backgroundColor: colors.surfaceCard }]}>
        <SafeAreaView edges={['bottom']} style={styles.bottomDockSafe}>
          <View style={styles.bottomDockContent}>
            <View style={styles.bottomPriceCol}>
              <Text style={[styles.bottomPriceLabel, { color: colors.textSecondary }]}>Starting from</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[styles.bottomPriceVal, { color: colors.accent }]}>
                  ₹{(profile.ratePerDay || 15000).toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.bottomPriceUnit, { color: colors.textFaint }]}>
                  /{proArchetype.rateUnitDefault.toLowerCase()}
                </Text>
              </View>
            </View>

            <View style={styles.bottomActionsRow}>
              <TouchableOpacity
                style={[styles.bottomMessageBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => navigation.navigate('Chat', { otherUserId: profile.id, otherUserName: profile.name, otherUserAvatar: profile.avatar })}
                activeOpacity={0.8}
              >
                <MessageSquare size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bottomBookBtn, { backgroundColor: colors.accent }]}
                onPress={() => navigation.navigate('Booking', { proId: profile.id, type: bookingType })}
                activeOpacity={0.85}
              >
                <Text style={styles.bottomBookBtnText}>{proArchetype.bookingCtaPrefix}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Lightbox Modal */}
      <Modal visible={selectedImgIndex !== null} transparent animationType="fade" onRequestClose={() => setSelectedImgIndex(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImgIndex(null)}>
            <X size={28} color="#ffffff" />
          </TouchableOpacity>
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

      {/* Video Reel Player Modal */}
      <Modal 
        visible={selectedVideoReel !== null} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setSelectedVideoReel(null)}
      >
        <View style={styles.videoModalBg}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.videoModalSafe}>
            {/* Top Bar */}
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

            {/* Video Player Container */}
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

      {/* Interactive Client Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.reviewModalOverlay}
        >
          <View style={[styles.reviewModalCard, { backgroundColor: colors.surfaceCard }]}>
            {/* Modal Header */}
            <View style={styles.reviewModalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.reviewModalTitle, { color: colors.textPrimary }]}>Write a Review</Text>
                <Text style={[styles.reviewModalSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  Rate your experience with {profile.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.reviewCloseBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => setShowReviewModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Star Rating Picker */}
              <View style={styles.ratingPickerSection}>
                <Text style={[styles.pickerLabel, { color: colors.textPrimary }]}>How would you rate their service?</Text>
                <View style={styles.starPickerRow}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= selectedRating;
                    return (
                      <TouchableOpacity
                        key={star}
                        style={styles.starTouchItem}
                        onPress={() => setSelectedRating(star)}
                        activeOpacity={0.7}
                      >
                        <Star
                          size={32}
                          color={isFilled ? '#FFB800' : colors.textFaint}
                          fill={isFilled ? '#FFB800' : 'transparent'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.starRatingLabel, { color: getRatingSentiment(selectedRating).color }]}>
                  {getRatingSentiment(selectedRating).label}
                </Text>
              </View>

              {/* Quick Experience Tag Chips */}
              <View style={styles.quickTagsSection}>
                <Text style={[styles.pickerLabel, { color: colors.textPrimary, marginBottom: 8 }]}>Highlights & Commendations</Text>
                <View style={styles.quickTagsWrap}>
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.quickTagChip,
                          {
                            backgroundColor: isSelected ? colors.accentGlow : colors.surfaceElevated,
                          }
                        ]}
                        onPress={() => {
                          setSelectedTags(prev =>
                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        {isSelected && <Check size={12} color={colors.accent} style={{ marginRight: 4 }} />}
                        <Text
                          style={[
                            styles.quickTagText,
                            { color: isSelected ? colors.accent : colors.textSecondary }
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Detailed Review TextInput */}
              <View style={styles.commentSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={[styles.pickerLabel, { color: colors.textPrimary }]}>Detailed Feedback</Text>
                  <Text style={{ fontSize: 11, color: colors.textFaint }}>{reviewComment.length} characters</Text>
                </View>
                <TextInput
                  style={[
                    styles.commentTextInput,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                    }
                  ]}
                  placeholder="Share details about punctuality, communication, and overall quality of deliverables..."
                  placeholderTextColor={colors.textFaint}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={reviewComment}
                  onChangeText={setReviewComment}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.reviewModalActions}>
                <TouchableOpacity
                  style={[styles.reviewCancelBtn, { backgroundColor: colors.surfaceElevated }]}
                  onPress={() => setShowReviewModal(false)}
                  disabled={submittingReview}
                >
                  <Text style={[styles.reviewCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reviewSubmitBtn, { backgroundColor: colors.accent }]}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                  activeOpacity={0.8}
                >
                  {submittingReview ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Send size={15} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.reviewSubmitBtnText}>Publish Review</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Service / Package Details Modal ── */}
      <Modal
        visible={!!selectedService}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedService(null)}
      >
        <SafeAreaView style={[styles.serviceModalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={[styles.serviceModalHeader]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.serviceModalHeaderSub, { color: colors.accent }]} numberOfLines={1}>
                {profile?.name ? profile.name.toUpperCase() : 'CREATOR SERVICE'}
              </Text>
              <Text style={[styles.serviceModalHeaderTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {selectedService?.title || 'Service Details'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.serviceModalCloseBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => setSelectedService(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {selectedService && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.serviceModalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero Image Banner */}
              <View style={styles.serviceModalHero}>
                <Image
                  source={{ uri: getServiceImage(selectedService, profile?.bannerImage) }}
                  style={styles.serviceModalHeroImg}
                  resizeMode="cover"
                />
                <View style={styles.serviceModalHeroBadges}>
                  <View style={styles.serviceModalTypeBadge}>
                    <Text style={styles.serviceModalTypeBadgeText}>
                      {selectedService.type === 'package' ? 'PACKAGE' : 'SERVICE'}
                    </Text>
                  </View>
                  <View style={styles.serviceModalCatBadge}>
                    <Text style={styles.serviceModalCatBadgeText} numberOfLines={1}>
                      {selectedService.category || 'Production'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Title & Creator Info Card */}
              <View style={[styles.serviceModalCard, { backgroundColor: colors.surfaceCard }]}>
                <View style={styles.serviceModalCreatorRow}>
                  <Avatar
                    source={profile?.avatar}
                    size={38}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[styles.serviceModalCreatorName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {profile?.name}
                    </Text>
                    <Text style={[styles.serviceModalCreatorTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {profile?.title || 'Creative Professional'}
                    </Text>
                  </View>
                  <View style={styles.serviceModalRating}>
                    <Star size={13} color="#F5A623" fill="#F5A623" />
                    <Text style={[styles.serviceModalRatingText, { color: colors.textPrimary }]}>
                      {(profile?.rating || 5.0).toFixed(1)}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.serviceModalTitle, { color: colors.textPrimary }]}>
                  {selectedService.title}
                </Text>

                <View style={styles.serviceModalPriceContainer}>
                  <Text style={[styles.serviceModalPriceLabel, { color: colors.textSecondary }]}>
                    Starting from
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                    <Text style={[styles.serviceModalPriceVal, { color: colors.accent }]}>
                      ₹{(selectedService.rate || 15000).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.serviceModalPriceUnit, { color: colors.textSecondary }]}>
                      {' '}/{(selectedService.unit || 'event').toLowerCase().replace(/^per\s+/i, '').trim()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 100% Milestone Escrow Guarantee Banner */}
              <View style={[styles.serviceModalEscrowBanner, { backgroundColor: isDark ? 'rgba(63, 182, 104, 0.12)' : 'rgba(16, 185, 129, 0.1)' }]}>
                <ShieldCheck size={22} color={colors.accent} style={{ marginTop: 2, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceModalEscrowTitle, { color: colors.accent }]}>
                    100% Milestone Escrow Protected
                  </Text>
                  <Text style={[styles.serviceModalEscrowDesc, { color: colors.textSecondary }]}>
                    Your advance payment is securely held in Camcrew Escrow and only released when deliverables meet your satisfaction.
                  </Text>
                </View>
              </View>

              {/* Service Scope & Description */}
              {selectedService.description ? (
                <View style={[styles.serviceModalCard, { backgroundColor: colors.surfaceCard }]}>
                  <Text style={[styles.serviceModalSectionTitle, { color: colors.textPrimary }]}>
                    Scope of Service
                  </Text>
                  <Text style={[styles.serviceModalDescText, { color: colors.textSecondary }]}>
                    {selectedService.description}
                  </Text>
                </View>
              ) : null}

              {/* Deliverables Checklist */}
              {selectedService.deliverables ? (
                <View style={[styles.serviceModalCard, { backgroundColor: colors.surfaceCard }]}>
                  <Text style={[styles.serviceModalSectionTitle, { color: colors.textPrimary }]}>
                    Deliverables Included
                  </Text>
                  <View style={styles.serviceModalDeliverablesList}>
                    {selectedService.deliverables.split('\n').filter(Boolean).map((item, idx) => (
                      <View key={idx} style={styles.serviceModalDeliverableRow}>
                        <CheckCircle size={16} color={colors.accent} style={{ marginTop: 2, marginRight: 8 }} />
                        <Text style={[styles.serviceModalDeliverableText, { color: colors.textSecondary }]}>
                          {item.replace(/^[•\-\*]\s*/, '').trim()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>
          )}

          {/* Bottom Action Footer */}
          {selectedService && (
            <View style={[styles.serviceModalFooter, { backgroundColor: colors.surfaceCard }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceModalFooterRateLabel, { color: colors.textSecondary }]}>Total Package</Text>
                <Text style={[styles.serviceModalFooterRateVal, { color: colors.accent }]}>
                  ₹{(selectedService.rate || 15000).toLocaleString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.serviceModalBookCta, { backgroundColor: colors.accent }]}
                activeOpacity={0.88}
                onPress={() => {
                  const srv = selectedService;
                  setSelectedService(null);
                  handleBookService(srv);
                }}
              >
                <ShoppingBag size={17} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.serviceModalBookCtaText}>Book This Package</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: 110,
  },

  // Top Floating Header Controls
  topControlSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
  },
  roundControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cinematic Banner
  headerBanner: {
    height: 165,
    position: 'relative',
    backgroundColor: '#000000',
  },
  banner: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // Profile Identity & Overview Sheet
  profileSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  avatarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avatarWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  metricVal: { fontSize: 12, fontWeight: '800' },
  metricSub: { fontSize: 10.5, fontWeight: '600' },

  identityMeta: { marginTop: 2 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    gap: 3,
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '800' },
  title: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  tagText: { fontSize: 11, fontWeight: '600' },

  // Switchable Section Tabs (Homepage Design System: Stroke-Free Pills)
  tabBarSection: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 10,
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  tabIconBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabContentContainer: {
    marginTop: 0,
  },

  // Section Cards (Home Screen Design System: borderless, soft elevation)
  sectionCard: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15.5, fontWeight: '900', letterSpacing: -0.2 },
  sectionCountText: { fontSize: 11.5, fontWeight: '600' },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  countBadgeText: { fontSize: 10.5, fontWeight: '700' },
  bioText: { fontSize: 12.5, lineHeight: 18, fontWeight: '500' },

  // Packages & Rates
  serviceBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceTitle: { fontSize: 15, fontWeight: '800', flex: 1, marginRight: 8 },
  serviceRate: { fontSize: 16, fontWeight: '900' },
  serviceUnit: { fontSize: 12 },
  serviceDesc: { fontSize: 13.5, lineHeight: 19, marginTop: 8 },
  deliverablesBox: { marginTop: 10, padding: 10, borderRadius: 10 },
  deliverablesLabel: { fontSize: 11.5, fontWeight: '700', marginBottom: 3 },
  deliverablesText: { fontSize: 12.5, lineHeight: 18 },

  // Portfolio Grid (2-Column clean layout)
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  portfolioGridItem: {
    width: (width - 44) / 2,
    height: 115,
    borderRadius: 12,
    overflow: 'hidden',
  },
  portfolioGridImage: {
    width: '100%',
    height: '100%',
  },
  emptyTabBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTabText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Accordion Header & Layout
  accordionHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionTitleCol: {
    flex: 1,
    paddingRight: 10,
  },
  accordionHintText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  accordionChevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionBody: {
    marginTop: 14,
  },

  // Capabilities List
  capabilitiesList: {
    gap: 7,
  },
  capabilityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  capabilityDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  capabilityText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },

  // Credentials & Affiliations Cards
  credentialsList: {
    gap: 8,
  },
  credentialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  credentialIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  credentialVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  credentialVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Collapse inline button
  collapseInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  collapseInlineBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Lightbox
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.98)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 20, padding: 8 },
  lightboxContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  lightboxCounter: { color: '#ffffff', fontSize: 16, fontWeight: '800', position: 'absolute', top: 60, alignSelf: 'center' },
  fullImage: { width: '100%', height: '70%' },
  slideshowControls: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16, zIndex: 15 },
  navArrow: { backgroundColor: 'rgba(0, 0, 0, 0.6)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  // Redesigned Reviews Section Styles
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewsSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },
  writeReviewBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Hero Rating Summary & Histogram
  heroRatingCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  heroScoreCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 12,
    minWidth: 95,
  },
  heroBigScore: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  heroRatingCount: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  escrowTrustTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  escrowTrustText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroDivider: {
    width: 1,
    height: '80%',
    marginRight: 12,
  },
  histogramCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  histogramStarLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    width: 20,
  },
  histogramTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  histogramFill: {
    height: '100%',
    borderRadius: 3,
  },
  histogramCountLabel: {
    fontSize: 10,
    fontWeight: '600',
    width: 16,
    textAlign: 'right',
  },

  // Trust Badges Strip
  trustBadgesStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trustPillText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Filter Chips
  filterChipsContainer: {
    marginBottom: 12,
  },
  filterChipsScroll: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  filterChipText: {
    fontSize: 11,
  },

  // Empty States
  emptyReviewsBox: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyReviewsTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyReviewsDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
    maxWidth: 240,
  },
  beFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  beFirstBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyFilterBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFilterText: {
    fontSize: 12,
    marginBottom: 8,
  },
  clearFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  clearFilterBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Review List & Cards
  reviewsListContainer: {
    gap: 8,
  },
  reviewItemCard: {
    padding: 12,
    borderRadius: 14,
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
    gap: 8,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewerInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitialText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '800',
  },
  verifiedBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedBadgeInlineText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 10,
    marginTop: 1,
  },
  reviewStarsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  reviewStarsPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFB800',
  },
  reviewCommentText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  escrowFooterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  escrowFooterText: {
    fontSize: 10,
    fontWeight: '600',
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  helpfulBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Interactive Review Modal
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: 18,
  },
  reviewModalCard: {
    borderRadius: 20,
    padding: 18,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewModalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  reviewModalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  reviewCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPickerSection: {
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 4,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  starTouchItem: {
    padding: 3,
  },
  starRatingLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  quickTagsSection: {
    marginBottom: 14,
  },
  quickTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  quickTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  commentSection: {
    marginBottom: 14,
  },
  commentTextInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    minHeight: 85,
    lineHeight: 18,
  },
  reviewModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  reviewCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewSubmitBtn: {
    flex: 1.8,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  reelsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reelCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 10,
    position: 'relative',
  },
  reelCardVertical: {
    width: 140,
    height: 215,
  },
  reelCardCinema: {
    width: 220,
    height: 145,
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  reelPlayBtn: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: -18,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  reelTopBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
  },
  reelBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  reelBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  reelInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  reelCategory: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reelTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },

  // Persistent Bottom Action Dock
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomDockSafe: {
    width: '100%',
  },
  bottomDockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bottomPriceCol: {
    flex: 1,
    paddingRight: 10,
  },
  bottomPriceLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  bottomPriceVal: {
    fontSize: 16.5,
    fontWeight: '900',
  },
  bottomPriceUnit: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomMessageBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBookBtn: {
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
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
    maxHeight: height * 0.82,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  videoPlayerBoxCinema: {
    width: '100%',
    aspectRatio: 16 / 9,
  },

  // ── Menu & Dishes styles ──
  menuCatChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 0,
  },
  menuCatChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuDishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  menuDishInfoCol: {
    flex: 1,
    marginRight: 14,
  },
  menuDishVisualCol: {
    width: 104,
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 14,
  },
  menuDishImage: {
    width: 104,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#1c222b',
  },
  menuDishPlaceholder: {
    width: 104,
    height: 96,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDishBtnAnchor: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  menuAddBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  menuAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuActiveStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 80,
  },
  menuActiveStepBtn: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuActiveStepVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginHorizontal: 4,
  },
  vegSymbolBox: {
    width: 13,
    height: 13,
    borderRadius: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegSymbolDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 2.75,
  },
  menuDishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  menuVegDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    marginRight: 7,
    flexShrink: 0,
  },
  menuDishName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  menuDishDesc: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 5,
    lineHeight: 16,
  },
  menuCatTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  menuCatTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  menuDietTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  menuDietTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  menuDishPrice: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  menuDishPriceUnit: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
    marginBottom: 8,
  },
  menuQtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuQtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuQtyValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
  },
  menuQuotationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 16,
    borderWidth: 0,
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  menuQuotationBarLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  menuQuotationBarTotal: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  menuQuotationBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuQuotationBarCta: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Redesigned Services & Packages Section Styles ──
  servicesSectionContainer: {
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 6,
  },
  servicesHeaderBox: {
    marginBottom: 14,
  },
  servicesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  servicesHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  servicesCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  servicesCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  servicesSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  servicesCardsList: {
    marginTop: 4,
  },

  // ── Service Details Modal Styles (Stroke-Free, Minimized) ──
  serviceModalContainer: {
    flex: 1,
  },
  serviceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  serviceModalHeaderSub: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  serviceModalHeaderTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  serviceModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceModalScroll: {
    padding: 14,
    paddingBottom: 36,
  },
  serviceModalHero: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    backgroundColor: '#0a0d12',
  },
  serviceModalHeroImg: {
    width: '100%',
    height: '100%',
  },
  serviceModalHeroBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceModalTypeBadge: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceModalTypeBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serviceModalCatBadge: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '55%',
  },
  serviceModalCatBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  serviceModalCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  serviceModalCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
  },
  serviceModalCreatorName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  serviceModalCreatorTitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  serviceModalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceModalRatingText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  serviceModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  serviceModalPriceContainer: {
    marginTop: 2,
  },
  serviceModalPriceLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  serviceModalPriceVal: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  serviceModalPriceUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceModalEscrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  serviceModalEscrowTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  serviceModalEscrowDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  serviceModalSectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  serviceModalDescText: {
    fontSize: 13,
    lineHeight: 19,
  },
  serviceModalDeliverablesList: {
    gap: 8,
  },
  serviceModalDeliverableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceModalDeliverableText: {
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  serviceModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  serviceModalFooterRateLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceModalFooterRateVal: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  serviceModalBookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  serviceModalBookCtaText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
});