import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image as RNImage, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { chatApi, ChatMessage } from '../../api/chatApi';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { ChevronLeft, Info, Camera, Image as ImageIcon, MapPin, Lock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { cloudStorageApi } from '../../api/cloudStorageApi';
import { supabase } from '../../api/supabaseClient';

export const ChatScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();

  const otherUserId = route?.params?.otherUserId || route?.params?.creatorId;
  const otherUserName = route?.params?.otherUserName || route?.params?.creatorName || 'User';
  const otherUserAvatar = route?.params?.otherUserAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setTypingRef = useRef<((isTyping: boolean) => void) | null>(null);

  useEffect(() => {
    if (!otherUserId) return;

    let subInstance: { unsubscribe: () => void; setTyping: (isTyping: boolean) => void } | null = null;
    let pollInterval: any = null;

    const initChat = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || user?.id || '';

      const allowed = await chatApi.canChat(otherUserId);
      setIsAllowed(allowed);

      const msgs = await chatApi.getMessages(otherUserId);
      setMessages(msgs);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 150);

      if (allowed) {
        await chatApi.markAsRead(otherUserId);

        subInstance = chatApi.subscribeToMessages(
          otherUserId,
          (newMsg) => {
            setMessages((prev) => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setOtherIsTyping(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          },
          (isTyping) => {
            setOtherIsTyping(isTyping);
            if (isTyping) {
              setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            }
          },
          currentUserId
        );

        setTypingRef.current = subInstance.setTyping;

        pollInterval = setInterval(async () => {
          const fresh = await chatApi.getMessages(otherUserId);
          if (fresh && fresh.length > 0) {
            setMessages((prev) => {
              if (fresh.length !== prev.length || fresh[fresh.length - 1]?.id !== prev[prev.length - 1]?.id) {
                return fresh;
              }
              return prev;
            });
          }
        }, 3000);
      }
    };

    initChat();

    return () => {
      if (subInstance) subInstance.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingRef.current = null;
    };
  }, [otherUserId, user?.id]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!setTypingRef.current) return;

    if (text.length > 0) {
      setTypingRef.current(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingRef.current?.(false);
      }, 2500);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingRef.current(false);
    }
  };

  const handleSendMessage = async (rawText?: string) => {
    const textToSend = rawText || inputText.trim();
    if (!textToSend || !otherUserId) return;

    if (!rawText) {
      setInputText('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingRef.current?.(false);
    }

    try {
      const newMsg = await chatApi.sendMessage(otherUserId, textToSend);
      setMessages((prev) => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { alert('Camera roll permission needed.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    if (!result.canceled && result.assets[0]?.uri) {
      setIsUploading(true);
      try {
        const uploaded = await cloudStorageApi.uploadImage(result.assets[0].uri, 'chat');
        await handleSendMessage('[IMAGE]' + uploaded.url + '[/IMAGE]');
      } catch (e: any) { alert(e.message || 'Failed to upload image'); }
      finally { setIsUploading(false); }
    }
  };

  const handleSendLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { alert('Location permission denied'); return; }
    setIsUploading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await handleSendMessage('[LOCATION]' + loc.coords.latitude + ',' + loc.coords.longitude + '[/LOCATION]');
    } catch (e) { alert('Failed to get location'); }
    finally { setIsUploading(false); }
  };

  const myId = user?.id;

  const renderMessageContent = (text: string, isMe: boolean) => {
    const imageMatch = text.match(/\[IMAGE\](.*?)\[\/IMAGE\]/);
    if (imageMatch?.[1]) {
      return <RNImage source={{ uri: imageMatch[1] }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />;
    }
    const locationMatch = text.match(/\[LOCATION\](.*?),(.*?)\[\/LOCATION\]/);
    if (locationMatch?.[1] && locationMatch?.[2]) {
      const mapUrl = 'https://maps.google.com/?q=' + locationMatch[1] + ',' + locationMatch[2];
      return (
        <TouchableOpacity onPress={() => Linking.openURL(mapUrl)} style={styles.locationBubble}>
          <MapPin size={24} color={isMe ? colors.background : colors.accent} />
          <Text style={[styles.msgText, { color: isMe ? colors.background : colors.textPrimary, marginLeft: 8, textDecorationLine: 'underline' }]}>View Location Pin</Text>
        </TouchableOpacity>
      );
    }
    return <Text style={[styles.msgText, { color: isMe ? colors.background : colors.textPrimary }]}>{text}</Text>;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: colors.surfaceCard }]} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PublicProfile', { id: otherUserId })}
        >
          <Avatar source={otherUserAvatar} size={34} />
          <View style={styles.headerTitleMeta}>
            <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>{otherUserName}</Text>
            <View style={styles.headerStatusRow}>
              <View style={[styles.onlineDot, { backgroundColor: otherIsTyping ? colors.accent : '#22c55e' }]} />
              <Text style={[styles.activeText, { color: otherIsTyping ? colors.accent : colors.textSecondary, fontStyle: otherIsTyping ? 'italic' : 'normal' }]}>
                {otherIsTyping ? 'typing...' : 'Online'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: colors.surfaceCard }]}
          onPress={() => navigation.navigate('ChatInfo', { otherUserId, otherUserName, otherUserAvatar })}
        >
          <Info size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Chat body */}
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Minimal Profile Intro */}
          <View style={styles.profileIntro}>
            {/* Avatar with soft glow ring */}
            <View style={[styles.avatarRing, { borderColor: colors.accentGlow, backgroundColor: colors.accentGlow }]}>
              <Avatar source={otherUserAvatar} size={76} />
            </View>

            <Text style={[styles.introName, { color: colors.textPrimary }]}>{otherUserName}</Text>
            <Text style={[styles.introSub, { color: colors.textSecondary }]}>Camqrew Professional</Text>

            {/* View Profile pill */}
            <TouchableOpacity
              style={[styles.viewProfileBtn, { backgroundColor: colors.surfaceCard }]}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('PublicProfile', { id: otherUserId })}
            >
              <Text style={[styles.viewProfileText, { color: colors.textPrimary }]}>View Profile</Text>
              <ArrowRight size={13} color={colors.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Minimal Lock State */}
          {isAllowed === false && (
            <View style={[styles.lockCard, { backgroundColor: colors.surfaceCard }]}>
              {/* Lock icon on accent glow */}
              <View style={[styles.lockIconCircle, { backgroundColor: colors.accentGlow }]}>
                <Lock size={22} color={colors.accent} />
              </View>

              <Text style={[styles.lockTitle, { color: colors.textPrimary }]}>
                Chat Locked
              </Text>
              <Text style={[styles.lockDesc, { color: colors.textSecondary }]}>
                Complete a booking or escrow payment to unlock direct communication with this professional.
              </Text>

              {/* Escrow badge */}
              <View style={[styles.escrowBadge, { backgroundColor: colors.accentGlow }]}>
                <ShieldCheck size={12} color={colors.accent} />
                <Text style={[styles.escrowBadgeText, { color: colors.accent }]}>Protected by Escrow</Text>
              </View>
            </View>
          )}

          {/* Messages */}
          {isAllowed === true && messages.map((m, index) => {
            const isMe = m.senderId === myId;
            return (
              <View key={m.id || index} style={[styles.msgBubbleWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther]}>
                <View style={[
                  styles.msgBubble,
                  isMe ? [styles.bubbleMe, { backgroundColor: colors.accent }] : [styles.bubbleOther, { backgroundColor: colors.surfaceCard }],
                  m.text.includes('[IMAGE]') && { paddingHorizontal: 4, paddingVertical: 4, backgroundColor: 'transparent' },
                ]}>
                  {renderMessageContent(m.text, isMe)}
                  <Text style={[styles.timestamp, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textFaint }]}>{m.timestamp}</Text>
                </View>
              </View>
            );
          })}

          {/* Typing indicator */}
          {otherIsTyping && (
            <View style={[styles.msgBubbleWrapper, styles.msgWrapperOther, { marginTop: 4 }]}>
              <View style={[styles.msgBubble, styles.bubbleOther, { backgroundColor: colors.surfaceCard, paddingVertical: 8, paddingHorizontal: 14 }]}>
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700' }}>
                  {otherUserName} is typing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
          {isAllowed === false ? (
            <View style={[styles.disabledInputWrapper, { backgroundColor: colors.surfaceCard }]}>
              <Lock size={14} color={colors.textSecondary} />
              <Text style={[styles.disabledInputText, { color: colors.textSecondary }]}>
                Chat disabled — complete a booking to unlock
              </Text>
            </View>
          ) : (
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceCard }]}>
              {isUploading ? (
                <View style={[styles.camBtn, { backgroundColor: 'transparent' }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : (
                <TouchableOpacity style={[styles.camBtn, { backgroundColor: colors.accentGlow }]} onPress={handlePickImage}>
                  <Camera size={18} color={colors.accent} />
                </TouchableOpacity>
              )}

              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="Message..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={handleInputChange}
                multiline
                editable={!isUploading}
              />

              {!inputText.trim() ? (
                <View style={styles.rightIcons}>
                  <TouchableOpacity style={styles.iconBtn} onPress={handleSendLocation} disabled={isUploading}>
                    <MapPin size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage} disabled={isUploading}>
                    <ImageIcon size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleSendMessage()}
                  disabled={isUploading}
                >
                  <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitleMeta: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  activeText: { fontSize: 12, fontWeight: '500' },

  // Keyboard + scroll
  keyboardView: { flex: 1 },
  chatScroll: { flex: 1 },
  chatContent: { paddingHorizontal: 20, paddingBottom: 24 },

  // Profile intro
  profileIntro: { alignItems: 'center', marginTop: 36, marginBottom: 32 },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    marginBottom: 14,
  },
  introName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  introSub: { fontSize: 13, fontWeight: '500', marginTop: 4, marginBottom: 16 },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
  },
  viewProfileText: { fontSize: 13, fontWeight: '600' },

  // Lock card — borderless tonal surface
  lockCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 20,
  },
  lockIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  lockTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  lockDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: 16,
  },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  escrowBadgeText: { fontSize: 12, fontWeight: '600' },

  // Messages
  msgBubbleWrapper: { marginVertical: 2, flexDirection: 'row' },
  msgWrapperMe: { justifyContent: 'flex-end' },
  msgWrapperOther: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22 },
  bubbleMe: {},
  bubbleOther: {},
  msgText: { fontSize: 15, lineHeight: 20 },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  locationBubble: { flexDirection: 'row', alignItems: 'center' },

  // Input bar
  inputBar: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 50,
  },
  disabledInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 26,
    paddingHorizontal: 16,
  },
  disabledInputText: { fontSize: 13, fontWeight: '500' },
  camBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  textInput: { flex: 1, fontSize: 15, paddingTop: 10, paddingBottom: 10, maxHeight: 100 },
  rightIcons: { flexDirection: 'row', alignItems: 'center', paddingRight: 4 },
  iconBtn: { padding: 6, marginLeft: 2 },
  sendBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginLeft: 4 },
  sendText: { fontWeight: '700', fontSize: 14, color: '#ffffff' },
});
