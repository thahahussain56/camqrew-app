import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  Share,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
  ViewToken,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { FeedReelItem } from '../../types/professional';
import {
  Heart,
  MessageSquare,
  Share2,
  CalendarCheck,
  CheckCircle,
  Volume2,
  VolumeX,
  Play,
  MapPin,
  Film,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const CATEGORIES = ['All', 'Commercial', 'Wedding Film', 'Drone & Aerial', 'Fashion Reel', 'Cinematography'];

export const ReelsFeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  // Tab bar height allowance (tab bar is absolute floating at bottom 20 with height 64)
  const ITEM_HEIGHT = WINDOW_HEIGHT;

  const [reels, setReels] = useState<FeedReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<{ [id: string]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [id: string]: number }>({});
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);

  // Fetch reels from API
  const loadReels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await professionalApi.getAllReels();
      setReels(data);
      const initialLikes: { [id: string]: number } = {};
      data.forEach((r) => {
        initialLikes[r.id] = r.likesCount || 120;
      });
      setLikeCounts(initialLikes);
    } catch (err) {
      console.warn('Failed to load reels feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Filter reels
  const filteredReels = reels.filter((r) => {
    if (activeCategory === 'All') return true;
    return (r.category || '').toLowerCase().includes(activeCategory.toLowerCase());
  });

  // Track active index
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // Double tap to like animation
  const handleDoubleTap = (reelId: string) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      // Trigger like
      if (!likedReels[reelId]) {
        setLikedReels((prev) => ({ ...prev, [reelId]: true }));
        setLikeCounts((prev) => ({ ...prev, [reelId]: (prev[reelId] || 0) + 1 }));
      }
      // Trigger heart pop
      setShowHeartAnim(true);
      heartScale.setValue(0);
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1.2, friction: 3, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 0, duration: 200, delay: 400, useNativeDriver: true }),
      ]).start(() => setShowHeartAnim(false));
    }
    lastTapRef.current = now;
  };

  const toggleLike = (reelId: string) => {
    setLikedReels((prev) => {
      const isLiked = !!prev[reelId];
      setLikeCounts((c) => ({ ...c, [reelId]: (c[reelId] || 0) + (isLiked ? -1 : 1) }));
      return { ...prev, [reelId]: !isLiked };
    });
  };

  const handleShare = async (reel: FeedReelItem) => {
    try {
      await Share.share({
        message: `Watch "${reel.title}" by ${reel.creatorName} on Camqrew! Book verified cinematographers & creators: ${reel.url}`,
        url: reel.url,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleBook = (reel: FeedReelItem) => {
    navigation.navigate('Booking', {
      professionalId: reel.creatorId,
      professionalName: reel.creatorName,
      professionalTitle: reel.creatorTitle,
      ratePerDay: reel.creatorRatePerDay || 18000,
      serviceTitle: reel.title,
    });
  };

  const handleViewProfile = (reel: FeedReelItem) => {
    navigation.navigate('PublicProfile', {
      professionalId: reel.creatorId,
    });
  };

  const handleMessage = (reel: FeedReelItem) => {
    navigation.navigate('Chat', {
      recipientId: reel.creatorId,
      recipientName: reel.creatorName,
    });
  };

  const renderItem = ({ item, index }: { item: FeedReelItem; index: number }) => {
    const isActive = index === activeIndex;
    const isLiked = !!likedReels[item.id];
    const likes = likeCounts[item.id] || item.likesCount || 120;

    // Detect direct video (MP4/WebM) vs iframe embed (YouTube/Vimeo)
    const isDirectVideo = !!(
      item.type === 'direct' ||
      item.url?.includes('.mp4') ||
      item.embedUrl?.includes('.mp4')
    );
    const videoSrc = item.url || item.embedUrl;

    let cleanEmbedUrl = '';
    if (!isDirectVideo) {
      let src = item.embedUrl || item.url || '';
      if (src.includes('youtube.com/shorts/')) {
        const id = src.split('/shorts/')[1]?.split('?')[0];
        src = `https://www.youtube-nocookie.com/embed/${id}`;
      } else if (src.includes('youtube.com/watch')) {
        const match = src.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) {
          src = `https://www.youtube-nocookie.com/embed/${match[1]}`;
        }
      } else if (src.includes('youtu.be/')) {
        const id = src.split('youtu.be/')[1]?.split('?')[0];
        if (id) {
          src = `https://www.youtube-nocookie.com/embed/${id}`;
        }
      }
      const paramChar = src.includes('?') ? '&' : '?';
      cleanEmbedUrl = `${src}${paramChar}autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playsinline=1&controls=0&modestbranding=1&rel=0`;
    }

    const htmlContent = isDirectVideo
      ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
            html, body { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            video { width: 100%; height: 100%; object-fit: cover; }
          </style>
        </head>
        <body>
          <video 
            src="${videoSrc}" 
            autoplay 
            loop 
            ${isMuted ? 'muted' : ''} 
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
            html, body { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            iframe { width: 100%; height: 100%; border: none; object-fit: cover; }
          </style>
        </head>
        <body>
          <iframe 
            src="${cleanEmbedUrl}" 
            allow="autoplay; fullscreen" 
            allowfullscreen
          ></iframe>
        </body>
      </html>
    `;

    return (
      <View style={[styles.reelContainer, { height: ITEM_HEIGHT }]}>
        {/* Background Video or Thumbnail */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => handleDoubleTap(item.id)}
          style={StyleSheet.absoluteFill}
        >
          {isActive ? (
            <WebView
              key={`${item.id}_${isMuted ? 'm' : 'u'}`}
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              style={styles.videoPlayer}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          ) : (
            <Image
              source={{ uri: item.thumbnailUrl || 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800' }}
              style={styles.videoPlayer}
              resizeMode="cover"
            />
          )}

          {/* Vignette Gradients for readability */}
          <View style={styles.topVignette} />
          <View style={styles.bottomVignette} />
        </TouchableOpacity>

        {/* Double-tap Heart Animation */}
        {showHeartAnim && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartAnimContainer,
              { transform: [{ scale: heartScale }] },
            ]}
          >
            <Heart size={90} color="#ff3b5c" fill="#ff3b5c" />
          </Animated.View>
        )}

        {/* Right Action Column */}
        <View style={[styles.rightActionColumn, { bottom: insets.bottom + 90 }]}>
          {/* Creator Avatar with Glow & Profile link */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleViewProfile(item)}
            style={styles.creatorAvatarBtn}
          >
            <Image
              source={{ uri: item.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' }}
              style={styles.creatorAvatarImg}
            />
            <View style={styles.avatarVerifiedBadge}>
              <CheckCircle size={12} color="#ffffff" fill="#3fb668" />
            </View>
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleLike(item.id)}
            style={styles.actionBtn}
          >
            <View style={[styles.actionIconCircle, isLiked && styles.actionIconCircleLiked]}>
              <Heart
                size={22}
                color={isLiked ? '#ff3b5c' : '#ffffff'}
                fill={isLiked ? '#ff3b5c' : 'transparent'}
              />
            </View>
            <Text style={styles.actionCountText}>{likes}</Text>
          </TouchableOpacity>

          {/* Message / Chat Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleMessage(item)}
            style={styles.actionBtn}
          >
            <View style={styles.actionIconCircle}>
              <MessageSquare size={21} color="#ffffff" />
            </View>
            <Text style={styles.actionCountText}>Chat</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleShare(item)}
            style={styles.actionBtn}
          >
            <View style={styles.actionIconCircle}>
              <Share2 size={21} color="#ffffff" />
            </View>
            <Text style={styles.actionCountText}>Share</Text>
          </TouchableOpacity>

          {/* Sound Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsMuted((m) => !m)}
            style={styles.actionBtn}
          >
            <View style={styles.actionIconCircle}>
              {isMuted ? (
                <VolumeX size={20} color="#ffffff" />
              ) : (
                <Volume2 size={20} color="#3fb668" />
              )}
            </View>
            <Text style={styles.actionCountText}>{isMuted ? 'Muted' : 'Sound'}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Information & Book Creator CTA */}
        <View style={[styles.bottomInfoContainer, { bottom: insets.bottom + 90 }]}>
          {/* Category & Short Badge */}
          <View style={styles.reelBadgeRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{item.category || 'Cinematography'}</Text>
            </View>
            {item.isShort && (
              <View style={[styles.categoryPill, styles.shortPill]}>
                <Sparkles size={10} color="#3fb668" style={{ marginRight: 3 }} />
                <Text style={styles.shortPillText}>9:16 Short</Text>
              </View>
            )}
          </View>

          {/* Creator Name & Title */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleViewProfile(item)}
            style={styles.creatorNameRow}
          >
            <Text style={styles.creatorNameText}>{item.creatorName}</Text>
            {item.creatorVerified && (
              <CheckCircle size={15} color="#3fb668" fill="#3fb668" style={{ marginLeft: 5 }} />
            )}
          </TouchableOpacity>

          {/* Professional Details & Location */}
          <View style={styles.creatorMetaRow}>
            <MapPin size={12} color="rgba(255,255,255,0.7)" style={{ marginRight: 3 }} />
            <Text style={styles.creatorLocationText}>{item.creatorCity || 'India'}</Text>
            <Text style={styles.creatorMetaDivider}>•</Text>
            <Text style={styles.creatorTitleText} numberOfLines={1}>
              {item.creatorTitle || 'Specialist'}
            </Text>
          </View>

          {/* Reel Caption / Title */}
          <Text style={styles.reelTitleText} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Book Creator Instant Escrow CTA Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleBook(item)}
            style={styles.bookCreatorBtn}
          >
            <View style={styles.bookBtnInner}>
              <View style={styles.bookBtnIconBox}>
                <CalendarCheck size={16} color="#ffffff" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.bookBtnMainText}>Book {item.creatorName.split(' ')[0]}</Text>
                <Text style={styles.bookBtnSubText}>
                  From ₹{(item.creatorRatePerDay || 18000).toLocaleString('en-IN')}/day • Escrow Protected
                </Text>
              </View>
              <View style={styles.bookBtnArrow}>
                <ArrowRight size={16} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Header Category Chips */}
      <View style={[styles.topHeaderBar, { top: insets.top + 8 }]}>
        <View style={styles.headerTitleRow}>
          <Film size={18} color="#3fb668" style={{ marginRight: 6 }} />
          <Text style={styles.headerBrandTitle}>Camqrew</Text>
          <Text style={styles.headerSubTitle}>Reels</Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryScrollContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setActiveCategory(item)}
              style={[
                styles.categoryFilterChip,
                activeCategory === item && styles.categoryFilterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  activeCategory === item && styles.categoryFilterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Main Reels Vertical Pager */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3fb668" />
          <Text style={styles.loadingText}>Loading Creator Showreels...</Text>
        </View>
      ) : filteredReels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Film size={48} color="rgba(255,255,255,0.4)" />
          <Text style={styles.emptyTitle}>No Reels in this Category</Text>
          <Text style={styles.emptySubtitle}>Switch to "All" to view all cinematic creator showcases.</Text>
          <TouchableOpacity
            style={styles.emptyResetBtn}
            onPress={() => setActiveCategory('All')}
          >
            <Text style={styles.emptyResetText}>View All Reels</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredReels}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled={true}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: '100%',
    backgroundColor: '#000000',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 340,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  topHeaderBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerBrandTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubTitle: {
    color: '#3fb668',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 5,
  },
  categoryScrollContent: {
    gap: 8,
    paddingRight: 20,
  },
  categoryFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryFilterChipActive: {
    backgroundColor: '#3fb668',
    borderColor: '#3fb668',
  },
  categoryFilterText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryFilterTextActive: {
    color: '#ffffff',
  },
  rightActionColumn: {
    position: 'absolute',
    right: 14,
    alignItems: 'center',
    gap: 16,
    zIndex: 90,
  },
  creatorAvatarBtn: {
    position: 'relative',
    marginBottom: 6,
  },
  creatorAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#3fb668',
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircleLiked: {
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
    borderColor: 'rgba(255, 59, 92, 0.5)',
  },
  actionCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfoContainer: {
    position: 'absolute',
    left: 16,
    right: 76,
    zIndex: 90,
  },
  reelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  shortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 182, 104, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(63, 182, 104, 0.4)',
  },
  shortPillText: {
    color: '#3fb668',
    fontSize: 10,
    fontWeight: '700',
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  creatorNameText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  creatorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  creatorLocationText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  creatorMetaDivider: {
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 6,
    fontSize: 12,
  },
  creatorTitleText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  reelTitleText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bookCreatorBtn: {
    backgroundColor: '#3fb668',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  bookBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookBtnIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnMainText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  bookBtnSubText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
  },
  bookBtnArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartAnimContainer: {
    position: 'absolute',
    top: '42%',
    left: SCREEN_WIDTH / 2 - 45,
    zIndex: 999,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#000000',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  emptyResetBtn: {
    backgroundColor: '#3fb668',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyResetText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
