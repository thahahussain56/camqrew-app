import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Share,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
  ViewToken,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
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
  Pause,
  MapPin,
  Film,
  ArrowRight,
  User,
  Star,
  X,
  Music,
  ShieldCheck,
  Briefcase,
  Compass,
} from 'lucide-react-native';
import { isCustomAvatar } from '../../utils/avatarUtils';

const CATEGORIES = [
  'All',
  'Commercial',
  'Wedding Film',
  'Drone & Aerial',
  'Fashion Reel',
  'Cinematography',
  'Music Video',
];

export const ReelsFeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const ITEM_HEIGHT = SCREEN_HEIGHT;

  const [reels, setReels] = useState<FeedReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<{ [id: string]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [id: string]: number }>({});
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayPauseAnim, setShowPlayPauseAnim] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<FeedReelItem | null>(null);
  const [expandedCaptions, setExpandedCaptions] = useState<{ [id: string]: boolean }>({});

  const heartScale = useRef(new Animated.Value(0)).current;
  const playPauseOpacity = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<any>(null);

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style);
    } catch {
      // Haptics unavailable on emulator
    }
  };

  // Fetch showreels from API
  const loadReels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await professionalApi.getAllReels();
      setReels(data);
      const initialLikes: { [id: string]: number } = {};
      data.forEach((r) => {
        initialLikes[r.id] = r.likesCount || 0;
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
      setIsPaused(false);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // Double tap to like with animated heart and haptic
  const triggerLike = (reelId: string) => {
    setLikedReels((prev) => {
      const alreadyLiked = !!prev[reelId];
      if (!alreadyLiked) {
        setLikeCounts((c) => ({ ...c, [reelId]: (c[reelId] || 0) + 1 }));
      }
      return { ...prev, [reelId]: true };
    });

    setShowHeartAnim(true);
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.25, friction: 3, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 0, duration: 220, delay: 350, useNativeDriver: true }),
    ]).start(() => setShowHeartAnim(false));
  };

  const toggleLike = (reelId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setLikedReels((prev) => {
      const isLiked = !!prev[reelId];
      setLikeCounts((c) => ({ ...c, [reelId]: (c[reelId] || 0) + (isLiked ? -1 : 1) }));
      return { ...prev, [reelId]: !isLiked };
    });
  };

  // Play / Pause toggle with animated indicator
  const togglePlayPause = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused((prev) => {
      const next = !prev;
      setShowPlayPauseAnim(true);
      playPauseOpacity.setValue(1);
      Animated.timing(playPauseOpacity, {
        toValue: 0,
        duration: 450,
        delay: 250,
        useNativeDriver: true,
      }).start(() => setShowPlayPauseAnim(false));
      return next;
    });
  };

  // Tap handler to differentiate single tap (play/pause) and double tap (like)
  const handleVideoPress = (reelId: string) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 280;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      triggerLike(reelId);
    } else {
      lastTapRef.current = now;
      tapTimerRef.current = setTimeout(() => {
        togglePlayPause();
        tapTimerRef.current = null;
      }, DOUBLE_PRESS_DELAY);
    }
  };

  const toggleMute = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted((m) => !m);
  };

  const toggleCaption = (id: string) => {
    setExpandedCaptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = async (reel: FeedReelItem) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Watch "${reel.title}" by ${reel.creatorName} on Camqrew! Book verified cinematographers & crew: ${reel.url}`,
        url: reel.url,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleBook = (reel: FeedReelItem) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
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
    const likes = likeCounts[item.id] || item.likesCount || 0;
    const isCaptionExpanded = !!expandedCaptions[item.id];

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
            html, body { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000; }
            video { width: 100%; height: 100%; object-fit: cover; }
          </style>
        </head>
        <body>
          <video 
            id="v"
            src="${videoSrc}" 
            ${isPaused ? '' : 'autoplay'} 
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
            html, body { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000; }
            iframe { width: 100%; height: 100%; border: none; object-fit: cover; }
          </style>
        </head>
        <body>
          <iframe 
            src="${cleanEmbedUrl}" 
            allow="autoplay; fullscreen; encrypted-media" 
            allowfullscreen
          ></iframe>
        </body>
      </html>
    `;

    return (
      <View style={[styles.reelContainer, { height: ITEM_HEIGHT, width: SCREEN_WIDTH }]}>
        {/* Background Video Player with touch interception */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => handleVideoPress(item.id)}
          style={StyleSheet.absoluteFill}
        >
          {isActive ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <WebView
                key={`${item.id}_${isMuted ? 'm' : 'u'}_${isPaused ? 'p' : 'r'}`}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.videoPlayer}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>
          ) : (
            <Image
              source={{ uri: item.thumbnailUrl || 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800' }}
              style={styles.videoPlayer}
              resizeMode="cover"
            />
          )}

          {/* Top & Bottom Cinematic Linear Gradient Vignettes adapted to theme */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(6,8,10,0.88)', 'rgba(6,8,10,0.3)', 'transparent']
                : ['rgba(249,250,251,0.92)', 'rgba(249,250,251,0.45)', 'transparent']
            }
            style={styles.topVignette}
            pointerEvents="none"
          />
          <LinearGradient
            colors={
              isDark
                ? ['transparent', 'rgba(6,8,10,0.45)', 'rgba(6,8,10,0.96)']
                : ['transparent', 'rgba(249,250,251,0.55)', 'rgba(249,250,251,0.98)']
            }
            style={styles.bottomVignette}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* Double-tap Center Heart Pop Animation */}
        {showHeartAnim && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartAnimContainer,
              { transform: [{ scale: heartScale }] },
            ]}
          >
            <View style={styles.heartGlowCircle}>
              <Heart size={86} color="#FF334B" fill="#FF334B" />
            </View>
          </Animated.View>
        )}

        {/* Single-tap Play/Pause Indicator Animation */}
        {showPlayPauseAnim && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.playPauseAnimContainer,
              { opacity: playPauseOpacity },
            ]}
          >
            <View
              style={[
                styles.playPauseIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.88)',
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            >
              {isPaused ? (
                <Pause size={38} color={isDark ? '#ffffff' : colors.textPrimary} />
              ) : (
                <Play size={38} color={isDark ? '#ffffff' : colors.textPrimary} style={{ marginLeft: 4 }} />
              )}
            </View>
          </Animated.View>
        )}

        {/* Right Floating Action Column */}
        <View style={[styles.rightActionColumn, { bottom: insets.bottom + 94 }]}>
          {/* Creator Avatar with emerald border & quick pro profile modal */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCreator(item);
            }}
            style={styles.actionAvatarBtn}
          >
            <View style={[styles.actionAvatarRing, { borderColor: colors.accent }]}>
              {isCustomAvatar(item.creatorAvatar) ? (
                <Image source={{ uri: item.creatorAvatar! }} style={styles.actionAvatarImg} />
              ) : (
                <View style={[styles.actionAvatarImg, { backgroundColor: isDark ? colors.surfaceCard : colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
                  <User size={20} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={[styles.avatarHirePlusBadge, { backgroundColor: colors.accent, borderColor: isDark ? '#000000' : '#ffffff' }]}>
              <Briefcase size={9} color="#ffffff" />
            </View>
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleLike(item.id)}
            style={styles.actionBtn}
          >
            <View
              style={[
                styles.actionIconCircle,
                {
                  backgroundColor: isLiked
                    ? (isDark ? 'rgba(255, 51, 75, 0.25)' : 'rgba(255, 51, 75, 0.15)')
                    : (isDark ? 'rgba(20, 25, 30, 0.75)' : 'rgba(255, 255, 255, 0.88)'),
                  borderColor: isLiked
                    ? (isDark ? 'rgba(255, 51, 75, 0.6)' : '#FF334B')
                    : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'),
                },
              ]}
            >
              <Heart
                size={22}
                color={isLiked ? '#FF334B' : (isDark ? '#ffffff' : colors.textPrimary)}
                fill={isLiked ? '#FF334B' : 'transparent'}
              />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: isDark ? '#ffffff' : colors.textPrimary,
                  textShadowColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.8)',
                },
              ]}
            >
              {likes}
            </Text>
          </TouchableOpacity>

          {/* Creator Quick Details / Pro Info Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCreator(item);
            }}
            style={styles.actionBtn}
          >
            <View
              style={[
                styles.actionIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(20, 25, 30, 0.75)' : 'rgba(255, 255, 255, 0.88)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Briefcase size={20} color={isDark ? '#ffffff' : colors.textPrimary} />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: isDark ? '#ffffff' : colors.textPrimary,
                  textShadowColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.8)',
                },
              ]}
            >
              Pro Info
            </Text>
          </TouchableOpacity>

          {/* Chat with Creator Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              handleMessage(item);
            }}
            style={styles.actionBtn}
          >
            <View
              style={[
                styles.actionIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(20, 25, 30, 0.75)' : 'rgba(255, 255, 255, 0.88)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <MessageSquare size={20} color={isDark ? '#ffffff' : colors.textPrimary} />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: isDark ? '#ffffff' : colors.textPrimary,
                  textShadowColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.8)',
                },
              ]}
            >
              Chat
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleShare(item)}
            style={styles.actionBtn}
          >
            <View
              style={[
                styles.actionIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(20, 25, 30, 0.75)' : 'rgba(255, 255, 255, 0.88)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Share2 size={20} color={isDark ? '#ffffff' : colors.textPrimary} />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: isDark ? '#ffffff' : colors.textPrimary,
                  textShadowColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.8)',
                },
              ]}
            >
              Share
            </Text>
          </TouchableOpacity>

          {/* Sound / Mute Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleMute}
            style={styles.actionBtn}
          >
            <View
              style={[
                styles.actionIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(20, 25, 30, 0.75)' : 'rgba(255, 255, 255, 0.88)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {isMuted ? (
                <VolumeX size={20} color={isDark ? '#ffffff' : colors.textPrimary} />
              ) : (
                <Volume2 size={20} color={colors.accent} />
              )}
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: isDark ? '#ffffff' : colors.textPrimary,
                  textShadowColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.8)',
                },
              ]}
            >
              {isMuted ? 'Muted' : 'Sound'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Information Container */}
        <View style={[styles.bottomInfoContainer, { bottom: insets.bottom + 94 }]}>
          {/* Metadata Badges Row */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: colors.textPrimary }]}>
                {item.category || 'Cinematography'}
              </Text>
            </View>
            {item.isShort && (
              <View
                style={[
                  styles.categoryBadge,
                  styles.shortBadge,
                  {
                    backgroundColor: isDark ? 'rgba(63, 182, 104, 0.2)' : 'rgba(63, 182, 104, 0.15)',
                    borderColor: isDark ? 'rgba(63, 182, 104, 0.4)' : 'rgba(63, 182, 104, 0.3)',
                  },
                ]}
              >
                <Text style={[styles.shortBadgeText, { color: colors.accent }]}>9:16 Short</Text>
              </View>
            )}
            <View
              style={[
                styles.locationBadge,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <MapPin size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
              <Text style={[styles.locationBadgeText, { color: colors.textSecondary }]}>
                {item.creatorCity || 'India'}
              </Text>
            </View>
            {item.creatorRating && item.creatorRating > 0 ? (
              <View style={styles.ratingBadge}>
                <Star size={10} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 3 }} />
                <Text style={styles.ratingBadgeText}>{item.creatorRating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          {/* Creator Identity Row */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedCreator(item)}
            style={styles.creatorIdentityRow}
          >
            <Text style={[styles.creatorNameText, { color: colors.textPrimary }]}>{item.creatorName}</Text>
            {item.creatorVerified && (
              <CheckCircle size={15} color={colors.accent} fill={colors.accent} style={{ marginLeft: 5 }} />
            )}
            <Text style={[styles.creatorDividerDot, { color: colors.textFaint }]}>•</Text>
            <Text style={[styles.creatorTitleText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.creatorTitle || 'Specialist'}
            </Text>
          </TouchableOpacity>

          {/* Reel Caption / Description with Expand/Collapse */}
          <View style={styles.captionContainer}>
            <Text
              style={[
                styles.captionText,
                {
                  color: colors.textPrimary,
                  textShadowColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.8)',
                },
              ]}
              numberOfLines={isCaptionExpanded ? undefined : 2}
            >
              {item.title}
            </Text>
            {item.title && item.title.length > 70 && (
              <TouchableOpacity
                onPress={() => toggleCaption(item.id)}
                style={styles.expandCaptionBtn}
              >
                <Text style={[styles.expandCaptionText, { color: colors.textSecondary }]}>
                  {isCaptionExpanded ? 'less' : 'more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Audio Ticker Indicator */}
          <View style={styles.audioTickerRow}>
            <Music size={12} color={colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[styles.audioTickerText, { color: colors.textSecondary }]} numberOfLines={1}>
              Original Audio • {item.creatorName}
            </Text>
          </View>

          {/* Integrated Escrow Quick Booking Bar */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleBook(item)}
            style={[
              styles.quickHireBar,
              {
                backgroundColor: isDark ? 'rgba(18, 22, 26, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(63, 182, 104, 0.4)' : 'rgba(63, 182, 104, 0.35)',
              },
            ]}
          >
            <View style={styles.quickHireLeft}>
              <View style={[styles.quickHireIconCircle, { backgroundColor: colors.accentGlow }]}>
                <CalendarCheck size={16} color={colors.accent} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.quickHireTitle, { color: colors.textPrimary }]}>
                    Book {item.creatorName.split(' ')[0]}
                  </Text>
                  <View style={[styles.escrowBadgeMini, { backgroundColor: colors.accentGlow }]}>
                    <ShieldCheck size={10} color={colors.accent} />
                    <Text style={[styles.escrowBadgeMiniText, { color: colors.accent }]}>Escrow</Text>
                  </View>
                </View>
                <Text style={[styles.quickHireRate, { color: colors.textSecondary }]}>
                  {item.creatorRatePerDay
                    ? `₹${item.creatorRatePerDay.toLocaleString('en-IN')}/day • Verified Rate`
                    : 'Standard Day Rate • Protected'}
                </Text>
              </View>
            </View>
            <View style={[styles.quickHireRightBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.quickHireBtnText}>Book</Text>
              <ArrowRight size={13} color="#ffffff" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Video Bottom Progress Bar Line */}
        <View
          style={[
            styles.bottomProgressBarTrack,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
          ]}
        >
          <View style={[styles.bottomProgressBarFill, { backgroundColor: colors.accent }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Floating Top Frosted Header Bar */}
      <View style={[styles.topHeaderBar, { top: insets.top + 8 }]}>
        <View style={styles.headerBrandRow}>
          <View style={styles.brandTitleWrap}>
            <Film size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.headerBrandTitle, { color: colors.textPrimary }]}>Camqrew</Text>
            <Text style={[styles.headerSubTitle, { color: colors.accent }]}>Reels</Text>
          </View>

          {filteredReels.length > 0 && (
            <View
              style={[
                styles.headerCounterBadge,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <Text
                style={[
                  styles.headerCounterText,
                  { color: isDark ? 'rgba(255,255,255,0.85)' : colors.textSecondary },
                ]}
              >
                {activeIndex + 1}/{filteredReels.length}
              </Text>
            </View>
          )}
        </View>

        {/* Category Pills Scroll */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryScrollContent}
          renderItem={({ item }) => {
            const isSelected = activeCategory === item;
            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCategory(item);
                }}
                style={[
                  styles.categoryFilterChip,
                  {
                    backgroundColor: isSelected
                      ? colors.accent
                      : isDark
                      ? 'rgba(20, 25, 30, 0.75)'
                      : 'rgba(255, 255, 255, 0.88)',
                    borderColor: isSelected
                      ? colors.accent
                      : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                  isSelected && styles.categoryFilterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryFilterText,
                    {
                      color: isSelected
                        ? '#ffffff'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.85)'
                        : colors.textSecondary,
                    },
                    isSelected && styles.categoryFilterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Reels Vertical Pager */}
      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading Creator Showreels...
            </Text>
          </View>
        </View>
      ) : filteredReels.length === 0 ? (
        <View style={[styles.emptyScreenContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.accentGlow }]}>
              <Film size={34} color={colors.accent} />
            </View>
            <Text style={[styles.emptyCardTitle, { color: colors.textPrimary }]}>
              {reels.length === 0 ? 'Creator Showreels' : `No ${activeCategory} Reels`}
            </Text>
            <Text style={[styles.emptyCardDesc, { color: colors.textSecondary }]}>
              {reels.length === 0
                ? 'Verified cinematographers and filmmakers showcase their 9:16 vertical portfolio showreels here. Once creators upload showreels, they will appear in this feed.'
                : `There are currently no showreels in the "${activeCategory}" category. Explore all categories or browse verified creators.`}
            </Text>

            <View style={styles.emptyActionsRow}>
              {activeCategory !== 'All' && (
                <TouchableOpacity
                  style={[styles.emptyPrimaryBtn, { backgroundColor: colors.accent }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCategory('All');
                  }}
                >
                  <Compass size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyPrimaryBtnText}>View All Reels</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.emptySecondaryBtn, { borderColor: colors.accent, backgroundColor: colors.accentGlow }]}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('HomeTab');
                }}
              >
                <User size={16} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.emptySecondaryBtnText, { color: colors.accent }]}>Browse Verified Creators</Text>
              </TouchableOpacity>

              {user?.role === 'professional' && (
                <TouchableOpacity
                  style={[styles.emptyGhostBtn, { borderColor: colors.border }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('ProfessionalEdit');
                  }}
                >
                  <Briefcase size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={[styles.emptyGhostBtnText, { color: colors.textPrimary }]}>Add Showreel to Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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

      {/* Creator Quick View Bottom Sheet Modal */}
      <Modal
        visible={!!selectedCreator}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedCreator(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)' }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedCreator(null)}
          />
          <View style={[styles.creatorSheetCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            {/* Sheet Drag Handle */}
            <View style={[styles.sheetDragBar, { backgroundColor: colors.borderLight }]} />

            {/* Creator Sheet Header */}
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetCreatorMeta}>
                {isCustomAvatar(selectedCreator?.creatorAvatar) ? (
                  <Image source={{ uri: selectedCreator!.creatorAvatar! }} style={styles.sheetAvatar} />
                ) : (
                  <View style={[styles.sheetAvatar, { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
                    <User size={28} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.sheetCreatorName, { color: colors.textPrimary }]}>
                      {selectedCreator?.creatorName}
                    </Text>
                    {selectedCreator?.creatorVerified && (
                      <CheckCircle size={16} color={colors.accent} fill={colors.accent} />
                    )}
                  </View>
                  <Text style={[styles.sheetCreatorTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {selectedCreator?.creatorTitle || 'Specialist'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <MapPin size={12} color={colors.textFaint} />
                      <Text style={[styles.sheetMetaText, { color: colors.textSecondary }]}>
                        {selectedCreator?.creatorCity || 'India'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text style={[styles.sheetMetaText, { color: colors.textSecondary, fontWeight: '700' }]}>
                        {selectedCreator?.creatorRating && selectedCreator.creatorRating > 0
                          ? selectedCreator.creatorRating.toFixed(1)
                          : 'New Pro'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedCreator(null)}
                style={[styles.sheetCloseBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Escrow Guarantee Highlight Banner */}
            <View style={[styles.escrowBanner, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
              <ShieldCheck size={20} color={colors.accent} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.escrowBannerTitle, { color: colors.accent }]}>
                  Camqrew 100% Escrow Protection
                </Text>
                <Text style={[styles.escrowBannerDesc, { color: colors.textSecondary }]}>
                  Milestone payments: 30% Advance • 40% Shoot Wrap • 30% Final Delivery. Funds released only when you approve.
                </Text>
              </View>
            </View>

            {/* Rate Showcase Card */}
            <View style={[styles.rateCardRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.rateCardLabel, { color: colors.textFaint }]}>CREATOR DAY RATE</Text>
                <Text style={[styles.rateCardAmount, { color: colors.textPrimary }]}>
                  ₹{(selectedCreator?.creatorRatePerDay || 18000).toLocaleString('en-IN')}
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary }}> / full shoot day</Text>
                </Text>
              </View>
              <View style={[styles.availabilityBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <View style={[styles.availableDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.availableText, { color: colors.success }]}>Accepting Shoots</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.sheetActionsContainer}>
              <TouchableOpacity
                style={[styles.sheetPrimaryBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.88}
                onPress={() => {
                  const c = selectedCreator;
                  setSelectedCreator(null);
                  if (c) handleBook(c);
                }}
              >
                <CalendarCheck size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.sheetPrimaryBtnText}>Book Shoot with Escrow</Text>
              </TouchableOpacity>

              <View style={styles.sheetSecondaryRow}>
                <TouchableOpacity
                  style={[styles.sheetSecondaryBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    const c = selectedCreator;
                    setSelectedCreator(null);
                    if (c) handleMessage(c);
                  }}
                >
                  <MessageSquare size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={[styles.sheetSecondaryBtnText, { color: colors.textPrimary }]}>Direct Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sheetSecondaryBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    const c = selectedCreator;
                    setSelectedCreator(null);
                    if (c) handleViewProfile(c);
                  }}
                >
                  <User size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={[styles.sheetSecondaryBtnText, { color: colors.textPrimary }]}>Full Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  reelContainer: {
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 420,
  },

  // Floating Header Bar
  topHeaderBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBrandTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginLeft: 5,
  },
  headerCounterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerCounterText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Category Filter Pills
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryFilterChip: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryFilterChipActive: {
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryFilterTextActive: {
    fontWeight: '800',
  },

  // Center Animations
  heartAnimContainer: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -55,
    marginTop: -55,
    zIndex: 999,
  },
  heartGlowCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseAnimContainer: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    marginLeft: -38,
    marginTop: -38,
    zIndex: 998,
  },
  playPauseIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  // Right Floating Actions
  rightActionColumn: {
    position: 'absolute',
    right: 14,
    alignItems: 'center',
    gap: 15,
    zIndex: 90,
  },
  actionAvatarBtn: {
    position: 'relative',
    marginBottom: 4,
  },
  actionAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
  },
  actionAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarHirePlusBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Bottom Information Area
  bottomInfoContainer: {
    position: 'absolute',
    left: 14,
    right: 74,
    zIndex: 90,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  shortBadge: {
    borderRadius: 8,
    borderWidth: 1,
  },
  shortBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  ratingBadgeText: {
    color: '#f59e0b',
    fontSize: 10.5,
    fontWeight: '800',
  },

  creatorIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  creatorNameText: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  creatorDividerDot: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  creatorTitleText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },

  captionContainer: {
    marginBottom: 6,
  },
  captionText: {
    fontSize: 13.5,
    lineHeight: 18.5,
    fontWeight: '600',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  expandCaptionBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  expandCaptionText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  audioTickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  audioTickerText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },

  // Quick Hire Integrated Booking Bar
  quickHireBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  quickHireLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickHireIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickHireTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  escrowBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  escrowBadgeMiniText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  quickHireRate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  quickHireRightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
  quickHireBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Bottom Progress Bar Line
  bottomProgressBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  bottomProgressBarFill: {
    width: '100%',
    height: '100%',
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    paddingVertical: 24,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
  },

  // Empty Screen State
  emptyScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 380,
    padding: 26,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyCardTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyCardDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  emptyActionsRow: {
    width: '100%',
    gap: 10,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptySecondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  emptyGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyGhostBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Creator Quick View Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  creatorSheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
  },
  sheetDragBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  sheetCreatorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sheetAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#3fb668',
  },
  sheetCreatorName: {
    fontSize: 18,
    fontWeight: '900',
  },
  sheetCreatorTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  sheetMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  escrowBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  escrowBannerDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  rateCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  rateCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rateCardAmount: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  availableText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sheetActionsContainer: {
    gap: 10,
  },
  sheetPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  sheetPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
  sheetSecondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  sheetSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
