import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { chatApi, ChatThread } from '../../api/chatApi';
import { Avatar } from '../../components/ui/Avatar';
import { ChevronLeft, Camera, Edit } from 'lucide-react-native';

export const ChatListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadThreads = async () => {
    const list = await chatApi.getThreads();
    setThreads(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadThreads();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surfaceCard }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 10 }}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Messages</Text>
        </View>
        <TouchableOpacity>
          <Edit size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Messages</Text>

        {threads.length === 0 && !refreshing && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No messages yet.</Text>
          </View>
        )}

        {threads.map((t) => (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.7}
            style={styles.chatRow}
            onPress={() => navigation.navigate('Chat', { otherUserId: t.otherUserId, otherUserName: t.otherUserName, otherUserAvatar: t.otherUserAvatar })}
          >
            <Avatar source={t.otherUserAvatar} size={56} />

            <View style={styles.chatDetails}>
              <Text style={[styles.name, { color: colors.textPrimary }, t.unreadCount > 0 && styles.nameUnread]}>
                {t.otherUserName}
              </Text>
              <View style={styles.messageRow}>
                <Text 
                  style={[styles.lastMsg, { color: colors.textSecondary }, t.unreadCount > 0 && [styles.lastMsgUnread, { color: colors.textPrimary }]]} 
                  numberOfLines={1}
                >
                  {t.lastMessage}
                </Text>
                <Text style={[styles.dotSeparator, { color: colors.textSecondary }]}> • </Text>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>{t.lastMessageTime}</Text>
              </View>
            </View>

            <View style={styles.rightAction}>
              {t.unreadCount > 0 ? (
                <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
              ) : (
                <Camera size={24} color={colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    marginBottom: 4,
  },
  nameUnread: {
    fontWeight: '700',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMsg: {
    fontSize: 14,
    flexShrink: 1,
  },
  lastMsgUnread: {
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 14,
  },
  rightAction: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
