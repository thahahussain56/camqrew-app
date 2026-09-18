import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image as RNImage, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatApi, ChatMessage } from '../../api/chatApi';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { ChevronLeft, Info, Camera, Image as ImageIcon, MapPin, Lock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { cloudStorageApi } from '../../api/cloudStorageApi';
import { supabase } from '../../api/supabaseClient';

export const ChatScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
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
      // 1. Get accurate current user ID
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || user?.id || '';

      // 2. Check permission
      const allowed = await chatApi.canChat(otherUserId);
      setIsAllowed(allowed);

      // 3. Load historical messages
      const msgs = await chatApi.getMessages(otherUserId);
      setMessages(msgs);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 150);

      if (allowed) {
        await chatApi.markAsRead(otherUserId);

        // 4. Real-time WebSocket + Presence subscription
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

        // 5. Fail-safe live poller every 3s
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

  // Broadcast typing with 2.5s debounce
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
    const imageMatch = text.match(/[IMAGE](.*?)[/IMAGE]/);
    if (imageMatch?.[1]) {
      return <RNImage source={{ uri: imageMatch[1] }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />;
    }
    const locationMatch = text.match(/[LOCATION](.*?),(.*?)[/LOCATION]/);
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
      <View style={[styles.header, { borderBottomColor: colors.borderLight, backgroundColor: colors.surfaceCard }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={32} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PublicProfile', { id: otherUserId })}
        >
          <Avatar source={otherUserAvatar} size={36} />
          <View style={styles.headerTitleMeta}>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>{otherUserName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.onlineDot, { backgroundColor: otherIsTyping ? colors.accent : '#22c55e' }]} />
              <Text style={[styles.activeText, { color: otherIsTyping ? colors.accent : colors.textSecondary, fontWeight: otherIsTyping ? '700' : '400' }]}>
                {otherIsTyping ? 'typing...' : 'Online'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoBtn} onPress={() => navigation.navigate('ChatInfo', { otherUserId, otherUserName, otherUserAvatar })}>
          <Info size={24} color={colors.textPrimary} />
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
          {/* Profile intro at top */}
          <View style={styles.profileIntro}>
            <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { id: otherUserId })} activeOpacity={0.8} style={{ alignItems: 'center' }}>
              <Avatar source={otherUserAvatar} size={90} />
              <Text style={[styles.introName, { color: colors.textPrimary }]}>{otherUserName}</Text>
            </TouchableOpacity>
            <Text style={[styles.introSub, { color: colors.textSecondary }]}>Camqrew User</Text>
            <TouchableOpacity style={[styles.viewProfileBtn, { backgroundColor: colors.surfaceElevated }]} onPress={() => navigation.navigate('PublicProfile', { id: otherUserId })}>
              <Text style={[styles.viewProfileText, { color: colors.textPrimary }]}>View Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Lock banner */}
          {isAllowed === false && (
            <View style={[styles.lockBanner, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Lock size={24} color={colors.textSecondary} />
              <Text style={[styles.lockText, { color: colors.textPrimary }]}>
                Chat is locked. Complete a booking or escrow payment to unlock communication.
              </Text>
            </View>
          )}

          {/* Messages */}
          {isAllowed === true && messages.map((m, index) => {
            const isMe = m.senderId === myId;
            return (
              <View key={m.id || index} style={[styles.msgBubbleWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther]}>
                <View style={[
                  styles.msgBubble,
                  isMe ? [styles.bubbleMe, { backgroundColor: colors.accent }] : [styles.bubbleOther, { backgroundColor: colors.surfaceElevated }],
                  m.text.includes('[IMAGE]') && { paddingHorizontal: 4, paddingVertical: 4, backgroundColor: 'transparent' },
                ]}>
                  {renderMessageContent(m.text, isMe)}
                  <Text style={[styles.timestamp, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textFaint }]}>{m.timestamp}</Text>
                </View>
              </View>
            );
          })}

          {/* Typing indicator bubble */}
          {otherIsTyping && (
            <View style={[styles.msgBubbleWrapper, styles.msgWrapperOther, { marginTop: 4 }]}>
              <View style={[styles.msgBubble, styles.bubbleOther, { backgroundColor: colors.surfaceElevated, paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700' }}>
                  {otherUserName} is typing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { borderTopColor: colors.borderLight, backgroundColor: colors.surfaceCard }]}>
          {isAllowed === false ? (
            <View style={styles.disabledInputWrapper}>
              <Text style={{ color: colors.textSecondary }}>Chat disabled — complete a booking to unlock</Text>
            </View>
          ) : (
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceElevated }]}>
              {isUploading ? (
                <View style={[styles.camBtn, { backgroundColor: 'transparent' }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : (
                <TouchableOpacity style={[styles.camBtn, { backgroundColor: colors.accent }]} onPress={handlePickImage}>
                  <Camera size={20} color={colors.background} />
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
                    <MapPin size={22} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage} disabled={isUploading}>
                    <ImageIcon size={22} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.sendBtn} onPress={() => handleSendMessage()} disabled={isUploading}>
                  <Text style={[styles.sendText, { color: colors.accent }]}>Send</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn: { marginRight: 8 },
  headerTitleMeta: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: '700' },
  onlineDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  activeText: { fontSize: 12 },
  infoBtn: { padding: 8 },
  keyboardView: { flex: 1 },
  chatScroll: { flex: 1 },
  chatContent: { paddingHorizontal: 16, paddingBottom: 24 },
  profileIntro: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  introName: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  introSub: { fontSize: 14, marginTop: 4 },
  viewProfileBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  viewProfileText: { fontSize: 14, fontWeight: '600' },
  lockBanner: { marginVertical: 20, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lockText: { marginTop: 12, fontSize: 15, textAlign: 'center', fontWeight: '500', lineHeight: 22 },
  msgBubbleWrapper: { marginVertical: 2, flexDirection: 'row' },
  msgWrapperMe: { justifyContent: 'flex-end' },
  msgWrapperOther: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22 },
  bubbleMe: {},
  bubbleOther: {},
  msgText: { fontSize: 15, lineHeight: 20 },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  locationBubble: { flexDirection: 'row', alignItems: 'center' },
  inputBar: { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 4, minHeight: 48 },
  disabledInputWrapper: { height: 48, alignItems: 'center', justifyContent: 'center' },
  camBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  textInput: { flex: 1, fontSize: 15, paddingTop: 12, paddingBottom: 12, maxHeight: 100 },
  rightIcons: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  iconBtn: { padding: 6, marginLeft: 4 },
  sendBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { fontWeight: '700', fontSize: 16 },
});
