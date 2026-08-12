import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { chatApi, ChatMessage, ChatThread } from '../../api/chatApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Send, Lock, ShieldCheck, MapPin, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

export const ChatScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  
  const creatorId = route?.params?.creatorId || 'pro_1';
  const creatorName = route?.params?.creatorName || 'Mohammad Thaha Hussain';
  const isPaidParam = route?.params?.isPaidUnlocked ?? true; // Default true for confirmed orders

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChatData();
  }, []);

  const loadChatData = async () => {
    const t = await chatApi.getOrCreateThread(creatorId, creatorName, undefined, isPaidParam);
    setThread(t);
    const msgs = await chatApi.getMessages(t.id);
    setMessages(msgs);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !thread) return;
    const textToSend = inputText.trim();
    setInputText('');

    const newMsg = await chatApi.sendMessage(thread.id, textToSend, 'customer');
    setMessages((prev) => [...prev, newMsg]);
  };

  if (!thread) return null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Avatar source={thread.creatorAvatar} size={42} verified={true} />

        <View style={styles.headerTitleMeta}>
          <Text style={[styles.headerName, { color: colors.textPrimary }]}>{thread.creatorName}</Text>
          <View style={styles.onlineBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={[styles.onlineText, { color: colors.textFaint }]}>Active Creator</Text>
          </View>
        </View>

        {thread.isPaidUnlocked ? (
          <Badge label="Unlocked" variant="success" />
        ) : (
          <Badge label="Locked" variant="warning" />
        )}
      </View>

      {/* Main Content */}
      {!thread.isPaidUnlocked ? (
        /* LOCKED STATE BEFORE PAYMENT */
        <View style={styles.lockedContainer}>
          <Card style={styles.lockedCard}>
            <View style={styles.lockIconCircle}>
              <Lock size={32} color="#fc8019" />
            </View>

            <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>
              Chat Unlocks After Payment 🔒
            </Text>

            <Text style={[styles.lockedDesc, { color: colors.textSecondary }]}>
              To maintain client & creator safety, direct 1-on-1 messaging opens automatically once your shoot booking payment is confirmed.
            </Text>

            <View style={styles.safetyRow}>
              <ShieldCheck size={16} color={colors.accent} />
              <Text style={[styles.safetyText, { color: colors.textFaint }]}>
                100% Escrow Protection Guaranteed
              </Text>
            </View>

            <Button
              title="Book Creator & Unlock Chat"
              variant="primary"
              size="lg"
              icon={<Zap size={18} color="#ffffff" />}
              onPress={() => navigation.navigate('Booking', { proId: creatorId })}
              style={{ marginTop: 20, backgroundColor: '#fc8019' }}
            />
          </Card>
        </View>
      ) : (
        /* UNLOCKED ACTIVE CHAT INTERFACE */
        <ScrollView
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.systemNotice}>
            <ShieldCheck size={14} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.systemNoticeText, { color: colors.textFaint }]}>
              Payment Confirmed! End-to-end Creator ↔ Client Chat Unlocked.
            </Text>
          </View>

          {messages.map((m) => {
            const isMe = m.senderRole === 'customer';
            return (
              <View
                key={m.id}
                style={[
                  styles.msgBubbleWrapper,
                  isMe ? styles.msgWrapperMe : styles.msgWrapperOther,
                ]}
              >
                <View
                  style={[
                    styles.msgBubble,
                    isMe
                      ? { backgroundColor: colors.accent }
                      : { backgroundColor: colors.surfaceCard, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  <Text style={[styles.msgText, { color: isMe ? '#000000' : colors.textPrimary }]}>
                    {m.text}
                  </Text>

                  {m.locationTag && (
                    <View style={styles.locationTagBox}>
                      <MapPin size={12} color={isMe ? '#000000' : colors.accent} />
                      <Text style={[styles.locationTagText, { color: isMe ? '#000000' : colors.accent }]}>
                        {m.locationTag}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.msgTime, { color: isMe ? 'rgba(0,0,0,0.6)' : colors.textFaint }]}>
                    {m.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Input Bar (Only Active When Paid Unlocked) */}
      {thread.isPaidUnlocked && (
        <View style={[styles.inputBar, { backgroundColor: colors.surfaceCard, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.background }]}
            placeholder="Discuss shoot requirements & locations..."
            placeholderTextColor={colors.textFaint}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.accent : colors.border }]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={18} color="#000000" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitleMeta: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '800',
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 11,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  lockedCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 24,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(252, 128, 25, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  lockedDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  safetyText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  systemNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 219, 233, 0.08)',
  },
  systemNoticeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  msgBubbleWrapper: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  msgWrapperMe: {
    justifyContent: 'flex-end',
  },
  msgWrapperOther: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  locationTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationTagText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  msgTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
