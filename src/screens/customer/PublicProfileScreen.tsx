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
import { Star, MapPin, X, ArrowLeft, ShieldCheck, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MessageSquare, Briefcase, CheckCircle, Send, MessageCircle, Share2, Film, Play, ExternalLink, ThumbsUp, Check, Award, UtensilsCrossed, Plus, Minus, Clock, Gift, ShoppingBag, Sparkles, Eye, Grid, Bell, MoreHorizontal, Link } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { getArchetype } from '../../constants/categories';

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
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const [selectedVideoReel, setSelectedVideoReel] = useState<VideoReelItem | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'reels' | 'services' | 'reviews'>('reels');
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
      {/* ── Top Navigation Bar (Instagram Header) ── */}
      <SafeAreaView edges={['top']} style={[styles.topNavBar, { backgroundColor: colors.background, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={styles.topNavContent}>
          <TouchableOpacity
            style={styles.topNavBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.topNavUsername, { color: colors.textPrimary }]} numberOfLines={1}>
            {profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_
          </Text>

          <View style={styles.topNavRightActions}>
            <TouchableOpacity
              style={styles.topNavIconBtn}
              onPress={() => Alert.alert('Notifications', `You are subscribed to alerts from ${profile.name}`)}
              activeOpacity={0.7}
            >
              <Bell size={21} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topNavIconBtn}
              onPress={handleShareProfile}
              activeOpacity={0.7}
            >
              <MoreHorizontal size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Profile Identity Section (Avatar + Name & Stats) ── */}
        <View style={styles.profileHeaderSection}>
          <View style={styles.avatarAndStatsRow}>
            {/* Circular Avatar */}
            <View style={[styles.avatarRing, { borderColor: isDark ? '#333333' : '#e5e7eb' }]}>
              <Avatar source={profile.avatar} size={74} verified={profile.verified} />
            </View>

            {/* Right Column: Name on Top + 3-Column Stats Below */}
            <View style={styles.nameAndStatsCol}>
              <Text style={[styles.profileDisplayName, { color: colors.textPrimary }]} numberOfLines={1}>
                {profile.name.toUpperCase()}
              </Text>

              <View style={styles.statsThreeColRow}>
                {/* Posts */}
                <TouchableOpacity
                  style={styles.statItemCol}
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('grid')}
                >
                  <Text style={[styles.statValText, { color: colors.textPrimary }]}>
                    {safePortfolio.length + (profile.videoReels?.length || 0)}
                  </Text>
                  <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>posts</Text>
                </TouchableOpacity>

                {/* Rating / Followers */}
                <TouchableOpacity
                  style={styles.statItemCol}
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('reviews')}
                >
                  <Text style={[styles.statValText, { color: colors.textPrimary }]}>
                    {(profile.rating || 5.0).toFixed(1)} ★
                  </Text>
                  <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>rating</Text>
                </TouchableOpacity>

                {/* Experience / Shoots */}
                <View style={styles.statItemCol}>
                  <Text style={[styles.statValText, { color: colors.textPrimary }]}>
                    {profile.experienceYears || 3}+ yrs
                  </Text>
                  <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>experience</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Subtitle / Role */}
          <Text style={[styles.profileCategorySubtitle, { color: colors.textSecondary }]}>
            {isStudio ? 'Creative Studio' : (profile.title || 'Creative Professional')}
          </Text>

          {/* Bio Text */}
          {profile.bio ? (
            <Text style={[styles.profileBioText, { color: colors.textPrimary }]}>
              {profile.bio}
            </Text>
          ) : null}

          {/* Link Row */}
          <TouchableOpacity
            style={styles.profileLinkRow}
            onPress={handleShareProfile}
            activeOpacity={0.7}
          >
            <Link size={13} color={colors.accent} style={{ marginRight: 5 }} />
            <Text style={[styles.profileLinkText, { color: colors.accent }]} numberOfLines={1}>
              camqrew.in/{profile.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
            </Text>
          </TouchableOpacity>

          {/* Pill Chips (Instagram threads/community style) */}
          <View style={styles.profileChipsRow}>
            {profile.categories && profile.categories[0] && (
              <View style={[styles.profileChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
                <Text style={[styles.profileChipText, { color: colors.textPrimary }]}>
                  @{profile.categories[0]}
                </Text>
              </View>
            )}

            <View style={[styles.profileChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
              <Text style={[styles.profileChipText, { color: colors.textPrimary }]}>
                📍 {profile.city || 'Kerala'}
              </Text>
            </View>

            <View style={[styles.profileChip, { backgroundColor: isDark ? 'rgba(63, 182, 104, 0.12)' : 'rgba(16, 185, 129, 0.1)', borderColor: isDark ? 'rgba(63, 182, 104, 0.25)' : 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={[styles.profileChipText, { color: colors.accent, fontWeight: '700' }]}>
                🛡️ 100% Escrow
              </Text>
            </View>
          </View>

          {/* Social Proof Strip */}
          <View style={styles.socialProofRow}>
            <View style={styles.socialAvatarStack}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120' }} style={[styles.microAvatar, { zIndex: 3 }]} />
              <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120' }} style={[styles.microAvatar, { marginLeft: -6, zIndex: 2 }]} />
              <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120' }} style={[styles.microAvatar, { marginLeft: -6, zIndex: 1 }]} />
            </View>
            <Text style={[styles.socialProofText, { color: colors.textSecondary }]}>
              Booked by <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{profile.reviewCount || 18}+ verified clients</Text>
            </Text>
          </View>

          {/* ── Compact Action Buttons Row ── */}
          <View style={styles.actionButtonsRow}>
            {/* Book Now Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('Booking', { proId: profile.id, type: bookingType })}
              activeOpacity={0.85}
            >
              <ShoppingBag size={14} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.primaryActionBtnText}>Book Now</Text>
            </TouchableOpacity>

            {/* Message Button */}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: isDark ? '#262626' : '#efefef' }]}
              onPress={() => navigation.navigate('Chat', { otherUserId: profile.id, otherUserName: profile.name, otherUserAvatar: profile.avatar })}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryActionBtnText, { color: colors.textPrimary }]}>Message</Text>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: isDark ? '#262626' : '#efefef' }]}
              onPress={handleShareProfile}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryActionBtnText, { color: colors.textPrimary }]}>Share</Text>
            </TouchableOpacity>

            {/* More / Dropdown Button */}
            <TouchableOpacity
              style={[styles.iconActionBtn, { backgroundColor: isDark ? '#262626' : '#efefef' }]}
              onPress={handleShareProfile}
              activeOpacity={0.8}
            >
              <ChevronDown size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Story Highlights Carousel ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.highlightsScroll}
        >
          {/* Highlight 1: Works */}
          <TouchableOpacity
            style={styles.highlightItem}
            activeOpacity={0.8}
            onPress={() => setActiveTab('grid')}
          >
            <View style={[styles.highlightCircle, { borderColor: activeTab === 'grid' ? colors.accent : (isDark ? '#333333' : '#e5e7eb') }]}>
              <Image source={{ uri: safePortfolio[0] || profile.avatar }} style={styles.highlightThumb} />
            </View>
            <Text style={[styles.highlightLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              🎓 Works
            </Text>
          </TouchableOpacity>

          {/* Highlight 2: Reels */}
          <TouchableOpacity
            style={styles.highlightItem}
            activeOpacity={0.8}
            onPress={() => setActiveTab('reels')}
          >
            <View style={[styles.highlightCircle, { borderColor: activeTab === 'reels' ? colors.accent : (isDark ? '#333333' : '#e5e7eb') }]}>
              <Image source={{ uri: profile.videoReels?.[0]?.thumbnailUrl || safePortfolio[1] || profile.avatar }} style={styles.highlightThumb} />
            </View>
            <Text style={[styles.highlightLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              🎬 Reels
            </Text>
          </TouchableOpacity>

          {/* Highlight 3: Packages */}
          <TouchableOpacity
            style={styles.highlightItem}
            activeOpacity={0.8}
            onPress={() => setActiveTab('services')}
          >
            <View style={[styles.highlightCircle, { borderColor: activeTab === 'services' ? colors.accent : (isDark ? '#333333' : '#e5e7eb') }]}>
              <Image source={{ uri: safeServices[0]?.imageUrl || safePortfolio[2] || profile.avatar }} style={styles.highlightThumb} />
            </View>
            <Text style={[styles.highlightLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              📦 Packages
            </Text>
          </TouchableOpacity>

          {/* Highlight 4: Reviews */}
          <TouchableOpacity
            style={styles.highlightItem}
            activeOpacity={0.8}
            onPress={() => setActiveTab('reviews')}
          >
            <View style={[styles.highlightCircle, { borderColor: activeTab === 'reviews' ? colors.accent : (isDark ? '#333333' : '#e5e7eb') }]}>
              <Image source={{ uri: safePortfolio[3] || profile.avatar }} style={styles.highlightThumb} />
            </View>
            <Text style={[styles.highlightLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              ⭐ Reviews
            </Text>
          </TouchableOpacity>

          {/* Highlight 5: Gear */}
          {profile.equipment && profile.equipment.length > 0 && (
            <TouchableOpacity
              style={styles.highlightItem}
              activeOpacity={0.8}
              onPress={() => setActiveTab('reviews')}
            >
              <View style={[styles.highlightCircle, { borderColor: isDark ? '#333333' : '#e5e7eb' }]}>
                <Image source={{ uri: safePortfolio[4] || profile.bannerImage || profile.avatar }} style={styles.highlightThumb} />
              </View>
              <Text style={[styles.highlightLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                🛠️ Gear
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* ── Instagram-Style Tabs Bar ── */}
        <View style={[styles.tabBar, { borderBottomColor: isDark ? '#262626' : '#e5e7eb', borderTopColor: isDark ? '#262626' : '#e5e7eb' }]}>
          {/* Tab 1: Grid */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'grid' && styles.tabButtonActive]}
            onPress={() => setActiveTab('grid')}
            activeOpacity={0.7}
          >
            <Grid size={22} color={activeTab === 'grid' ? (isDark ? '#ffffff' : '#000000') : colors.textFaint} />
            {activeTab === 'grid' && <View style={[styles.tabIndicator, { backgroundColor: isDark ? '#ffffff' : '#000000' }]} />}
          </TouchableOpacity>

          {/* Tab 2: Reels */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'reels' && styles.tabButtonActive]}
            onPress={() => setActiveTab('reels')}
            activeOpacity={0.7}
          >
            <Play size={22} color={activeTab === 'reels' ? (isDark ? '#ffffff' : '#000000') : colors.textFaint} />
            {activeTab === 'reels' && <View style={[styles.tabIndicator, { backgroundColor: isDark ? '#ffffff' : '#000000' }]} />}
          </TouchableOpacity>

          {/* Tab 3: Services & Packages */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]}
            onPress={() => setActiveTab('services')}
            activeOpacity={0.7}
          >
            <ShoppingBag size={21} color={activeTab === 'services' ? (isDark ? '#ffffff' : '#000000') : colors.textFaint} />
            {activeTab === 'services' && <View style={[styles.tabIndicator, { backgroundColor: isDark ? '#ffffff' : '#000000' }]} />}
          </TouchableOpacity>

          {/* Tab 4: Reviews & Credentials */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'reviews' && styles.tabButtonActive]}
            onPress={() => setActiveTab('reviews')}
            activeOpacity={0.7}
          >
            <Star size={21} color={activeTab === 'reviews' ? (isDark ? '#ffffff' : '#000000') : colors.textFaint} />
            {activeTab === 'reviews' && <View style={[styles.tabIndicator, { backgroundColor: isDark ? '#ffffff' : '#000000' }]} />}
          </TouchableOpacity>
        </View>

        {/* ── TAB 1: Grid (3-Column Square Portfolio) ── */}
        {activeTab === 'grid' && (
          <View style={styles.gridContainer}>
            {safePortfolio.map((img, idx) => {
              const itemSize = (width - 2) / 3;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.88}
                  onPress={() => setSelectedImgIndex(idx)}
                  style={{ width: itemSize, height: itemSize, marginBottom: 1 }}
                >
                  <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── TAB 2: Reels (3-Column 9:16 Vertical Video Reels) ── */}
        {activeTab === 'reels' && (
          <View style={styles.reelsGridContainer}>
            {(profile.videoReels && profile.videoReels.length > 0 ? profile.videoReels : [
              { id: '1', title: 'Just watched', thumbnailUrl: safePortfolio[0], isShort: true },
              { id: '2', title: 'Live everywhere. Automatically.', thumbnailUrl: safePortfolio[1], isShort: true },
              { id: '3', title: 'AI agents. That answer calls 24/7.', thumbnailUrl: safePortfolio[2], isShort: true },
            ]).map((reel: any, idx: number) => {
              const reelWidth = (width - 4) / 3;
              const reelHeight = reelWidth * 1.62;
              return (
                <TouchableOpacity
                  key={reel.id || idx}
                  activeOpacity={0.88}
                  onPress={() => {
                    if (reel.url || reel.embedUrl) {
                      setSelectedVideoReel(reel);
                    } else if (profile.videoReels?.[0]) {
                      setSelectedVideoReel(profile.videoReels[0]);
                    }
                  }}
                  style={{ width: reelWidth, height: reelHeight, position: 'relative', marginBottom: 2 }}
                >
                  {reel.thumbnailUrl ? (
                    <Image source={{ uri: reel.thumbnailUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
                      <Film size={24} color={colors.accent} />
                    </View>
                  )}

                  {/* Vignette Overlay */}
                  <View style={styles.reelThumbOverlay} />

                  {/* Play count */}
                  <View style={styles.reelViewTag}>
                    <Play size={10} color="#ffffff" fill="#ffffff" style={{ marginRight: 3 }} />
                    <Text style={styles.reelViewCount}>{idx === 0 ? '12.4k' : (idx === 1 ? '8.9k' : '5.1k')}</Text>
                  </View>

                  {/* Title snippet */}
                  <Text style={styles.reelThumbTitle} numberOfLines={2}>
                    {reel.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── TAB 3: Services & Packages ── */}
        {activeTab === 'services' && (
          <View style={styles.tabSectionPadding}>
            <View style={styles.servicesHeaderBox}>
              <View style={styles.servicesTitleRow}>
                <Sparkles size={17} color={colors.accent} style={{ marginRight: 6 }} />
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

            {/* Products for Sale (if available) */}
            {displayProducts && displayProducts.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 8 }]}>
                  {isCrafts ? 'Handcrafted Products & Hampers' : (isBaker ? 'Artisanal Bakes & Products' : 'Gear & Products for Sale')}
                </Text>
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

            {/* Catering Menu (if available) */}
            {(proArchetype.archetype === 'catering' || isItemCatalog) && profile.menuItems && profile.menuItems.filter(d => d.isAvailable).length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 8 }]}>
                  {isCrafts ? 'Crafts, Hampers & Gift Catalog' : (isBaker ? 'Cakes, Bakes & Food Menu' : 'Menu & Dishes')}
                </Text>
                {profile.menuItems.filter(d => d.isAvailable).map(dish => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    quantity={menuSelections[dish.id] || 0}
                    onAdjustQty={(delta) => adjustMenuQty(dish.id, delta)}
                    isBaker={isBaker}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── TAB 4: Reviews, Ratings & Credentials ── */}
        {activeTab === 'reviews' && (
          <View style={styles.tabSectionPadding}>
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
                style={[styles.writeReviewBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
                onPress={handleOpenReview}
                activeOpacity={0.8}
              >
                <Star size={14} color={colors.accent} fill={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.writeReviewBtnText, { color: colors.accent }]}>Write Review</Text>
              </TouchableOpacity>
            </View>

            {/* Hero Rating Summary Card (Score + 5-Bar Histogram) */}
            <View style={[styles.heroRatingCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.heroScoreCol}>
                <Text style={[styles.heroBigScore, { color: colors.textPrimary }]}>
                  {(profile.rating ?? 5.0).toFixed(1)}
                </Text>
                <View style={styles.heroStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
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
                  <Text style={[styles.escrowTrustText, { color: colors.accent }]}>100% Escrow Verified</Text>
                </View>
              </View>

              <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

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
                    <View style={[styles.histogramTrack, { backgroundColor: colors.border }]}>
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
                              borderColor: isActive ? colors.accent : colors.border,
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

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <View style={[styles.emptyReviewsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.accentGlow }]}>
                  <MessageCircle size={28} color={colors.accent} />
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
                  <Star size={14} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.beFirstBtnText}>Rate & Review Now</Text>
                </TouchableOpacity>
              </View>
            ) : filteredReviews.length === 0 ? (
              <View style={[styles.emptyFilterBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.emptyFilterText, { color: colors.textSecondary }]}>
                  No reviews found with {ratingFilter}★ rating.
                </Text>
                <TouchableOpacity
                  style={[styles.clearFilterBtn, { borderColor: colors.accent }]}
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
                          borderColor: colors.border,
                        }
                      ]}
                    >
                      {/* Review Header */}
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
                                <CheckCircle size={11} color={colors.accent} />
                                <Text style={[styles.verifiedBadgeInlineText, { color: colors.accent }]}>Verified</Text>
                              </View>
                            </View>
                            <Text style={[styles.reviewDate, { color: colors.textFaint }]}>{rev.date}</Text>
                          </View>
                        </View>

                        <View style={[styles.reviewStarsPill, { backgroundColor: 'rgba(255, 184, 0, 0.12)', borderColor: 'rgba(255, 184, 0, 0.25)' }]}>
                          <Star size={13} color="#FFB800" fill="#FFB800" style={{ marginRight: 4 }} />
                          <Text style={styles.reviewStarsPillText}>{Number(rev.rating).toFixed(1)}</Text>
                        </View>
                      </View>

                      <Text style={[styles.reviewCommentText, { color: colors.textSecondary }]}>
                        {rev.comment}
                      </Text>

                      <View style={[styles.reviewFooterRow, { borderTopColor: colors.border }]}>
                        <View style={styles.escrowFooterBadge}>
                          <ShieldCheck size={12} color={colors.accent} style={{ marginRight: 4 }} />
                          <Text style={[styles.escrowFooterText, { color: colors.textSecondary }]}>Escrow Verified Booking</Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.helpfulBtn,
                            {
                              backgroundColor: isHelpful ? colors.accentGlow : 'transparent',
                              borderColor: isHelpful ? colors.accent : colors.border,
                            }
                          ]}
                          onPress={() => handleToggleHelpful(rev.id)}
                          activeOpacity={0.7}
                        >
                          <ThumbsUp size={12} color={isHelpful ? colors.accent : colors.textSecondary} style={{ marginRight: 4 }} />
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

            {/* Credentials / Affiliations Accordion */}
            {profile.certifications && profile.certifications.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 8 }]}>
                  {proArchetype.skillsSectionTitle}
                </Text>
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

            {/* Capabilities / Equipment */}
            {profile.equipment && profile.equipment.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 8 }]}>
                  {isStudio ? 'Studio Amenities' : proArchetype.equipmentSectionTitle}
                </Text>
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
      </ScrollView>

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
          <View style={[styles.reviewModalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border, borderWidth: 1 }]}>
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
                            borderColor: isSelected ? colors.accent : colors.border,
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
                      borderColor: colors.border,
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
                  style={[styles.reviewCancelBtn, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
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
          <View style={[styles.serviceModalHeader, { borderBottomColor: colors.border }]}>
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
              <View style={[styles.serviceModalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
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
              <View style={[styles.serviceModalEscrowBanner, { backgroundColor: isDark ? 'rgba(63, 182, 104, 0.12)' : 'rgba(16, 185, 129, 0.1)', borderColor: isDark ? 'rgba(63, 182, 104, 0.3)' : 'rgba(16, 185, 129, 0.25)' }]}>
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
                <View style={[styles.serviceModalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
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
                <View style={[styles.serviceModalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
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
            <View style={[styles.serviceModalFooter, { backgroundColor: colors.surfaceCard, borderTopColor: colors.border }]}>
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
    height: 230,
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  avatarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 5,
  },
  metricVal: { fontSize: 13, fontWeight: '800' },
  metricSub: { fontSize: 11, fontWeight: '600' },

  identityMeta: { marginTop: 2 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: { fontSize: 12, fontWeight: '600' },

  // Section Cards (Home Screen Design System: borderless, soft elevation)
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  sectionCountText: { fontSize: 12, fontWeight: '600' },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: { fontSize: 11, fontWeight: '700' },
  bioText: { fontSize: 14.5, lineHeight: 22, fontWeight: '500' },

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

  // Portfolio
  portfolioItemCinematic: {
    width: 250,
    height: 170,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 12,
  },
  portfolioImage: { width: '100%', height: '100%' },

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
  navArrow: { backgroundColor: 'rgba(0, 0, 0, 0.5)', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // Redesigned Reviews Section Styles
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  writeReviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Hero Rating Summary & Histogram
  heroRatingCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  heroScoreCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    minWidth: 110,
  },
  heroBigScore: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  heroRatingCount: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  escrowTrustTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  escrowTrustText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroDivider: {
    width: 1,
    height: '85%',
    marginRight: 16,
  },
  histogramCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  histogramStarLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 22,
  },
  histogramTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  histogramFill: {
    height: '100%',
    borderRadius: 4,
  },
  histogramCountLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 18,
    textAlign: 'right',
  },

  // Trust Badges Strip
  trustBadgesStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  trustPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Filter Chips
  filterChipsContainer: {
    marginBottom: 16,
  },
  filterChipsScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },

  // Empty States
  emptyReviewsBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyReviewsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyReviewsDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    maxWidth: 260,
  },
  beFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
  },
  beFirstBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyFilterBox: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFilterText: {
    fontSize: 13,
    marginBottom: 10,
  },
  clearFilterBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Review List & Cards
  reviewsListContainer: {
    gap: 12,
  },
  reviewItemCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  reviewerInitials: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitialText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedBadgeInlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 11,
    marginTop: 2,
  },
  reviewStarsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewStarsPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFB800',
  },
  reviewCommentText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  escrowFooterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  escrowFooterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  helpfulBtnText: {
    fontSize: 11,
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
    borderRadius: 24,
    padding: 22,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reviewModalTitle: {
    fontSize: 19,
    fontWeight: '900',
  },
  reviewModalSub: {
    fontSize: 13,
    marginTop: 3,
  },
  reviewCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPickerSection: {
    alignItems: 'center',
    marginBottom: 18,
    paddingVertical: 6,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  starTouchItem: {
    padding: 4,
  },
  starRatingLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  quickTagsSection: {
    marginBottom: 18,
  },
  quickTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentSection: {
    marginBottom: 20,
  },
  commentTextInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 110,
    lineHeight: 20,
  },
  reviewModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  reviewCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewSubmitBtn: {
    flex: 1.8,
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  reelsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reelCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 14,
    position: 'relative',
  },
  reelCardVertical: {
    width: 160,
    height: 250,
  },
  reelCardCinema: {
    width: 250,
    height: 165,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: -20,
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    borderRadius: 8,
  },
  reelBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
  },
  reelInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  reelCategory: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reelTitle: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 15,
  },

  // Persistent Bottom Action Dock
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomDockSafe: {
    width: '100%',
  },
  bottomDockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomPriceCol: {
    flex: 1,
    paddingRight: 12,
  },
  bottomPriceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomPriceVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  bottomPriceUnit: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomMessageBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBookBtn: {
    paddingHorizontal: 20,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBookBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
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
    fontSize: 18.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  servicesCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    marginLeft: 8,
  },
  servicesCountBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  servicesSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  servicesCardsList: {
    marginTop: 4,
  },

  // ── Service Details Modal Styles ──
  serviceModalContainer: {
    flex: 1,
  },
  serviceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  serviceModalHeaderSub: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  serviceModalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  serviceModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceModalScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  serviceModalHero: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    backgroundColor: '#0a0d12',
  },
  serviceModalHeroImg: {
    width: '100%',
    height: '100%',
  },
  serviceModalHeroBadges: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceModalTypeBadge: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  serviceModalTypeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  serviceModalCatBadge: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    maxWidth: '55%',
  },
  serviceModalCatBadgeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  serviceModalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  serviceModalCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  serviceModalCreatorName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  serviceModalCreatorTitle: {
    fontSize: 12,
    marginTop: 1,
  },
  serviceModalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  serviceModalRatingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  serviceModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  serviceModalPriceContainer: {
    marginTop: 4,
  },
  serviceModalPriceLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  serviceModalPriceVal: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  serviceModalPriceUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  serviceModalEscrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  serviceModalEscrowTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  serviceModalEscrowDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  serviceModalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  serviceModalDescText: {
    fontSize: 14,
    lineHeight: 21,
  },
  serviceModalDeliverablesList: {
    gap: 10,
  },
  serviceModalDeliverableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceModalDeliverableText: {
    fontSize: 13.5,
    lineHeight: 19,
    flex: 1,
  },
  serviceModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 14,
  },
  serviceModalFooterRateLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  serviceModalFooterRateVal: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  serviceModalBookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceModalBookCtaText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },

  // ── Instagram Layout Styles ──
  topNavBar: {
    borderBottomWidth: 1,
  },
  topNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  topNavBackBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topNavUsername: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  topNavRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  topNavIconBtn: {
    padding: 4,
  },
  profileHeaderSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  avatarAndStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    padding: 2.5,
    borderRadius: 50,
    borderWidth: 1,
  },
  nameAndStatsCol: {
    flex: 1,
    marginLeft: 18,
  },
  profileDisplayName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  statsThreeColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItemCol: {
    alignItems: 'center',
    minWidth: 50,
  },
  statValText: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabelText: {
    fontSize: 11.5,
    marginTop: 1,
    fontWeight: '500',
  },
  profileCategorySubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: -0.1,
  },
  profileBioText: {
    fontSize: 13,
    lineHeight: 18.5,
    marginTop: 4,
  },
  profileLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  profileLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  profileChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  profileChip: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  profileChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  socialAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  microAvatar: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  socialProofText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  primaryActionBtn: {
    flex: 1.25,
    height: 35,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 35,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 35,
    height: 35,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightsScroll: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  highlightItem: {
    alignItems: 'center',
    width: 62,
  },
  highlightCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    height: 44,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    opacity: 1,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  reelsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  reelThumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  reelViewTag: {
    position: 'absolute',
    bottom: 22,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reelViewCount: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  reelThumbTitle: {
    position: 'absolute',
    bottom: 5,
    left: 6,
    right: 6,
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3,
  },
  tabSectionPadding: {
    padding: 16,
  },
});