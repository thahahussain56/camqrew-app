import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
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
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { professionalApi } from '../../api/professionalApi';
import { cloudStorageApi } from '../../api/cloudStorageApi';
import { FeedReelItem, VideoReelItem } from '../../types/professional';
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
  UploadCloud,
  Plus,
  Video,
} from 'lucide-react-native';
import { isCustomAvatar } from '../../utils/avatarUtils';

export const ReelsFeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const ITEM_HEIGHT = SCREEN_HEIGHT;

  const [reels, setReels] = useState<FeedReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<{ [id: string]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [id: string]: number }>({});
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayPauseAnim, setShowPlayPauseAnim] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<FeedReelItem | null>(null);
  const [expandedCaptions, setExpandedCaptions] = useState<{ [id: string]: boolean }>({});

  // Creator Video Reel Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState('');
  const [selectedVideoSize, setSelectedVideoSize] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Cinematography');
  const [uploading, setUploading] = useState(false);

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

  const pickVideo = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access your video gallery is required to upload reels!');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setSelectedVideoUri(asset.uri);
        const filename = asset.fileName || asset.uri.split('/').pop() || 'reel_video.mp4';
        setSelectedVideoName(filename);
        if (asset.fileSize) {
          const mb = (asset.fileSize / (1024 * 1024)).toFixed(1);
          setSelectedVideoSize(`${mb} MB`);
        } else {
          setSelectedVideoSize('');
        }
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to pick video: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleUploadReel = async () => {
    if (!selectedVideoUri) {
      Alert.alert('No Video Selected', 'Please pick a video file from your device first.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please sign in to your creator account to upload reels.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload video file to Supabase storage 'reels' bucket
      const uploadRes = await cloudStorageApi.uploadVideo(selectedVideoUri, 'reels');

      // 2. Fetch current profile reels and append new reel
      const proProfile = await professionalApi.getProfileById(user.id);
      const existingReels = proProfile?.videoReels || [];

      const newReel: VideoReelItem = {
        id: 'reel_' + Date.now(),
        title: uploadTitle.trim() || 'Vertical Reel',
        url: uploadRes.url,
        type: 'direct',
        embedUrl: uploadRes.url,
        thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800',
        category: uploadCategory,
        isShort: true,
      };

      const updatedReels = [newReel, ...existingReels];
      await professionalApi.updateProfile({ videoReels: updatedReels });

      // 3. Reload feed to show new reel
      await loadReels();

      // Reset modal state
      setSelectedVideoUri(null);
      setSelectedVideoName('');
      setSelectedVideoSize('');
      setUploadTitle('');
      setShowUploadModal(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert('🎉 Reel Published!', 'Your video reel is now live in the Reels feed and on your creator profile.');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Failed to upload video reel.');
    } finally {
      setUploading(false);
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

          {/* Top & Bottom Cinematic Linear Gradient Vignettes (Black gradient for both light and dark theme) */}
          <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.3)', 'transparent']}
            style={styles.topVignette}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.96)']}
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
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderColor: 'rgba(255,255,255,0.2)',
                },
              ]}
            >
              {isPaused ? (
                <Pause size={38} color="#ffffff" />
              ) : (
                <Play size={38} color="#ffffff" style={{ marginLeft: 4 }} />
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
                    ? 'rgba(255, 51, 75, 0.25)'
                    : 'rgba(20, 25, 30, 0.75)',
                  borderColor: isLiked
                    ? 'rgba(255, 51, 75, 0.6)'
                    : 'rgba(255, 255, 255, 0.15)',
                },
              ]}
            >
              <Heart
                size={22}
                color={isLiked ? '#FF334B' : '#ffffff'}
                fill={isLiked ? '#FF334B' : 'transparent'}
              />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: '#ffffff',
                  textShadowColor: 'rgba(0,0,0,0.85)',
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
                  backgroundColor: 'rgba(20, 25, 30, 0.75)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
              ]}
            >
              <Briefcase size={20} color="#ffffff" />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: '#ffffff',
                  textShadowColor: 'rgba(0,0,0,0.85)',
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
                  backgroundColor: 'rgba(20, 25, 30, 0.75)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
              ]}
            >
              <MessageSquare size={20} color="#ffffff" />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: '#ffffff',
                  textShadowColor: 'rgba(0,0,0,0.85)',
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
                  backgroundColor: 'rgba(20, 25, 30, 0.75)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
              ]}
            >
              <Share2 size={20} color="#ffffff" />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: '#ffffff',
                  textShadowColor: 'rgba(0,0,0,0.85)',
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
                  backgroundColor: 'rgba(20, 25, 30, 0.75)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
              ]}
            >
              {isMuted ? (
                <VolumeX size={20} color="#ffffff" />
              ) : (
                <Volume2 size={20} color={colors.accent} />
              )}
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: '#ffffff',
                  textShadowColor: 'rgba(0,0,0,0.85)',
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
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderColor: 'rgba(255,255,255,0.12)',
                },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: '#ffffff' }]}>
                {item.category || 'Cinematography'}
              </Text>
            </View>
            {item.isShort && (
              <View
                style={[
                  styles.categoryBadge,
                  styles.shortBadge,
                  {
                    backgroundColor: 'rgba(63, 182, 104, 0.2)',
                    borderColor: 'rgba(63, 182, 104, 0.4)',
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
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  borderColor: 'rgba(255,255,255,0.1)',
                },
              ]}
            >
              <MapPin size={11} color="rgba(255,255,255,0.85)" style={{ marginRight: 3 }} />
              <Text style={[styles.locationBadgeText, { color: 'rgba(255,255,255,0.85)' }]}>
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
            <Text style={[styles.creatorNameText, { color: '#ffffff' }]}>{item.creatorName}</Text>
            {item.creatorVerified && (
              <CheckCircle size={15} color={colors.accent} fill={colors.accent} style={{ marginLeft: 5 }} />
            )}
            <Text style={[styles.creatorDividerDot, { color: 'rgba(255,255,255,0.4)' }]}>•</Text>
            <Text style={[styles.creatorTitleText, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
              {item.creatorTitle || 'Specialist'}
            </Text>
          </TouchableOpacity>

          {/* Reel Caption / Description with Expand/Collapse */}
          <View style={styles.captionContainer}>
            <Text
              style={[
                styles.captionText,
                {
                  color: '#ffffff',
                  textShadowColor: 'rgba(0,0,0,0.9)',
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
                <Text style={[styles.expandCaptionText, { color: 'rgba(255,255,255,0.7)' }]}>
                  {isCaptionExpanded ? 'less' : 'more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Audio Ticker Indicator */}
          <View style={styles.audioTickerRow}>
            <Music size={12} color="rgba(255,255,255,0.75)" style={{ marginRight: 5 }} />
            <Text style={[styles.audioTickerText, { color: 'rgba(255,255,255,0.75)' }]} numberOfLines={1}>
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
            { backgroundColor: 'rgba(255,255,255,0.15)' },
          ]}
        >
          <View style={[styles.bottomProgressBarFill, { backgroundColor: colors.accent }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: '#06080A' }]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Floating Top Frosted Header Bar */}
      <View style={[styles.topHeaderBar, { top: insets.top + 8 }]}>
        <View style={styles.headerBrandRow}>
          {/* Centered Reels with Gradient Background */}
          <View style={styles.reelsCenterWrap}>
            <LinearGradient
              colors={['#3fb668', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.reelsBadgeGradient,
                {
                  shadowOpacity: isDark ? 0.35 : 0.2,
                },
              ]}
            >
              <Text style={styles.reelsBadgeText}>Reels</Text>
            </LinearGradient>
          </View>

          {/* Right Header Action Group: Creator Upload Button + Counter */}
          <View style={styles.headerRightGroup}>
            {user?.role === 'professional' && (
              <TouchableOpacity
                style={styles.headerUploadBtn}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setShowUploadModal(true);
                }}
              >
                <Plus size={13} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.headerUploadText}>Upload</Text>
              </TouchableOpacity>
            )}

            {reels.length > 0 && (
              <View
                style={[
                  styles.headerCounterBadge,
                  {
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    borderColor: 'rgba(255,255,255,0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.headerCounterText,
                    { color: 'rgba(255,255,255,0.85)' },
                  ]}
                >
                  {activeIndex + 1}/{reels.length}
                </Text>
              </View>
            )}
          </View>
        </View>
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
      ) : reels.length === 0 ? (
        <View style={[styles.emptyScreenContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.accentGlow }]}>
              <Film size={34} color={colors.accent} />
            </View>
            <Text style={[styles.emptyCardTitle, { color: colors.textPrimary }]}>
              Creator Showreels
            </Text>
            <Text style={[styles.emptyCardDesc, { color: colors.textSecondary }]}>
              Verified cinematographers and filmmakers showcase their 9:16 vertical portfolio showreels here. Once creators upload showreels, they will appear in this feed.
            </Text>

            <View style={styles.emptyActionsRow}>
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
                  style={[styles.emptyGhostBtn, { borderColor: colors.accent, backgroundColor: 'rgba(63, 182, 104, 0.15)' }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                    setShowUploadModal(true);
                  }}
                >
                  <UploadCloud size={16} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={[styles.emptyGhostBtnText, { color: colors.accent }]}>Upload Video Reel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={reels}
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

      {/* Creator Reel Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent
        onRequestClose={() => !uploading && setShowUploadModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.75)' }]}
        >
          <View style={[styles.uploadModalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.uploadModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.uploadIconBadge, { backgroundColor: colors.accentGlow }]}>
                  <Film size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.uploadModalTitle, { color: colors.textPrimary }]}>Upload Video Reel</Text>
                  <Text style={[styles.uploadModalSub, { color: colors.textSecondary }]}>Add 9:16 vertical reel to feed & profile</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => !uploading && setShowUploadModal(false)}
                disabled={uploading}
                style={[styles.sheetCloseBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
              {/* Video Picker Area */}
              {selectedVideoUri ? (
                <View style={[styles.selectedVideoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.videoFileIconCircle, { backgroundColor: colors.accentGlow }]}>
                      <Video size={22} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.selectedVideoFileName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {selectedVideoName}
                      </Text>
                      <Text style={[styles.selectedVideoFileMeta, { color: colors.accent }]}>
                        ✓ Video Selected {selectedVideoSize ? `• ${selectedVideoSize}` : ''}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={pickVideo}
                    disabled={uploading}
                    style={[styles.changeVideoBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}
                  >
                    <Text style={[styles.changeVideoBtnText, { color: colors.textSecondary }]}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadDottedBox, { borderColor: colors.accent, backgroundColor: colors.accentGlow }]}
                  onPress={pickVideo}
                  activeOpacity={0.7}
                >
                  <UploadCloud size={36} color={colors.accent} style={{ marginBottom: 8 }} />
                  <Text style={[styles.uploadDottedTitle, { color: colors.textPrimary }]}>Choose Video File</Text>
                  <Text style={[styles.uploadDottedSub, { color: colors.textSecondary }]}>
                    Upload MP4, MOV, or WebM video (up to 100MB)
                  </Text>
                </TouchableOpacity>
              )}

              {/* Reel Title Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Reel Title</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="e.g. Wedding Highlight 2026, Fashion Editorial Reel"
                  placeholderTextColor={colors.textFaint}
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                  editable={!uploading}
                />
              </View>

              {/* Category Chips */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {['Cinematography', 'Wedding', 'Commercial', 'Fashion', 'Music Video', 'Short Film', 'Drone Reel'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.uploadCategoryChip,
                        {
                          backgroundColor: uploadCategory === cat ? colors.accent : colors.surfaceElevated,
                          borderColor: uploadCategory === cat ? colors.accent : colors.border,
                        }
                      ]}
                      onPress={() => setUploadCategory(cat)}
                    >
                      <Text style={[styles.uploadCategoryChipText, { color: uploadCategory === cat ? '#fff' : colors.textSecondary, fontWeight: uploadCategory === cat ? '700' : '500' }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Upload Action Button */}
              <TouchableOpacity
                style={[
                  styles.submitUploadBtn,
                  { backgroundColor: colors.accent, opacity: !selectedVideoUri || uploading ? 0.6 : 1 }
                ]}
                disabled={!selectedVideoUri || uploading}
                onPress={handleUploadReel}
                activeOpacity={0.88}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitUploadBtnText}>Uploading Video...</Text>
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitUploadBtnText}>Publish Reel to Feed</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  reelsCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelsBadgeGradient: {
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  reelsBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerCounterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerCounterBadgeAbsolute: {
    position: 'absolute',
    right: 16,
  },
  headerCounterText: {
    fontSize: 11,
    fontWeight: '700',
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

  headerRightGroup: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3fb668',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  headerUploadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Creator Reel Upload Modal Styles
  uploadModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  uploadModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  uploadIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  uploadModalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedVideoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  videoFileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedVideoFileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedVideoFileMeta: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  changeVideoBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  changeVideoBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  uploadDottedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadDottedTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  uploadDottedSub: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  uploadCategoryChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  uploadCategoryChipText: {
    fontSize: 11.5,
  },
  submitUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  submitUploadBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
