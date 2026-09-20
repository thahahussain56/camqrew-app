import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Dimensions, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { professionalApi } from '../../api/professionalApi';
import { studioApi } from '../../api/studioApi';
import { productApi } from '../../api/productApi';
import { ProfessionalProfile, ReviewItem } from '../../types/professional';
import { Product } from '../../types/product';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProductCard } from '../../components/cards/ProductCard';
import { useCartStore } from '../../store/cartStore';
import { Star, MapPin, X, ArrowLeft, ShieldCheck, ChevronLeft, ChevronRight, MessageSquare, Briefcase, CheckCircle, Send, MessageCircle, Share2, Film, Play, ExternalLink } from 'lucide-react-native';
import { getArchetype } from '../../constants/categories';

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
});