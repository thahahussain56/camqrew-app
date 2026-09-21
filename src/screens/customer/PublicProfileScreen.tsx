import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Dimensions, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { professionalApi } from '../../api/professionalApi';
import { studioApi } from '../../api/studioApi';
import { productApi } from '../../api/productApi';
import { ProfessionalProfile, ReviewItem, VideoReelItem } from '../../types/professional';
import { Product } from '../../types/product';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProductCard } from '../../components/cards/ProductCard';
import { useCartStore } from '../../store/cartStore';
import { Star, MapPin, X, ArrowLeft, ShieldCheck, ChevronLeft, ChevronRight, MessageSquare, Briefcase, CheckCircle, Send, MessageCircle, Share2, Film, Play, ExternalLink, ThumbsUp, Check, Award } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { getArchetype } from '../../constants/categories';

const { width, height } = Dimensions.get('window');

export const PublicProfileScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  
  const proId = route?.params?.id || route?.params?.professionalId;
  const bookingType = route?.params?.type || 'professionals';
  const isStudio = bookingType === 'studios' || bookingType === 'studio';

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const [selectedVideoReel, setSelectedVideoReel] = useState<VideoReelItem | null>(null);
  const { addItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

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

  if (loading || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const proArchetype = getArchetype(profile.categories);

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
            <TouchableOpacity style={styles.roundBackBtn} onPress={handleShareProfile} activeOpacity={0.8}>
              <Share2 size={18} color="#ffffff" />
            </TouchableOpacity>
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
            <Text style={styles.bookBtnText}>{proArchetype.bookingCtaPrefix} • Starting from ₹{(profile.ratePerDay || 15000).toLocaleString('en-IN')}/{proArchetype.rateUnitDefault.toLowerCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── About Section ── */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About {isStudio ? 'the Studio' : `the ${proArchetype.roleNoun}`}</Text>
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
        {profile.videoReels && profile.videoReels.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.reelsHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Film size={18} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Showreels & Video Reels</Text>
              </View>
              <Badge label={`${profile.videoReels.length} ${profile.videoReels.length === 1 ? 'Reel' : 'Reels'}`} variant="info" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18, marginTop: 12 }}>
              <View style={{ width: 18 }} />
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
              <View style={{ width: 18 }} />
            </ScrollView>
          </Card>
        )}

        {/* ── Cinematic Portfolio Gallery ── */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Portfolio Highlights</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }}>
            <View style={{ width: 18 }} />
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

        {/* ── Capabilities / Specialties ── */}
        {profile.equipment && profile.equipment.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{isStudio ? 'Studio Amenities' : proArchetype.equipmentSectionTitle}</Text>
            <View style={styles.chipsWrap}>
              {profile.equipment.map((eq, i) => (
                <Badge key={i} label={eq} variant="info" />
              ))}
            </View>
          </Card>
        )}

        {/* ── Certifications & Industry Badges ── */}
        {profile.certifications && profile.certifications.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{proArchetype.skillsSectionTitle}</Text>
            <View style={styles.chipsWrap}>
              {profile.certifications.map((cert, i) => (
                <Badge key={i} label={cert} variant="success" />
              ))}
            </View>
          </Card>
        )}

        {/* ── Redesigned Client Reviews & Star Ratings Section ── */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceCard }]}>
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

          {/* Trust Badges Strip */}
          <View style={styles.trustBadgesStrip}>
            <View style={[styles.trustPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <CheckCircle size={11} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.trustPillText, { color: colors.textSecondary }]}>Verified Bookings</Text>
            </View>
            <View style={[styles.trustPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <ShieldCheck size={11} color="#00dbe9" style={{ marginRight: 4 }} />
              <Text style={[styles.trustPillText, { color: colors.textSecondary }]}>Escrow Protection</Text>
            </View>
            <View style={[styles.trustPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Award size={11} color="#FFB800" style={{ marginRight: 4 }} />
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

          {/* Reviews List or Empty State */}
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
                              <CheckCircle size={11} color={colors.accent} />
                              <Text style={[styles.verifiedBadgeInlineText, { color: colors.accent }]}>Verified</Text>
                            </View>
                          </View>
                          <Text style={[styles.reviewDate, { color: colors.textFaint }]}>{rev.date}</Text>
                        </View>
                      </View>

                      {/* Amber Rating Pill */}
                      <View style={[styles.reviewStarsPill, { backgroundColor: 'rgba(255, 184, 0, 0.12)', borderColor: 'rgba(255, 184, 0, 0.25)' }]}>
                        <Star size={13} color="#FFB800" fill="#FFB800" style={{ marginRight: 4 }} />
                        <Text style={styles.reviewStarsPillText}>{Number(rev.rating).toFixed(1)}</Text>
                      </View>
                    </View>

                    {/* Review Comment Body */}
                    <Text style={[styles.reviewCommentText, { color: colors.textSecondary }]}>
                      {rev.comment}
                    </Text>

                    {/* Review Card Footer: Escrow Tag & Helpful Button */}
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
});