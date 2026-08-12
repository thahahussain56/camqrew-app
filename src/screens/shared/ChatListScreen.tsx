import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { chatApi, ChatThread } from '../../api/chatApi';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { MessageSquare, Lock, ChevronRight } from 'lucide-react-native';

export const ChatListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [threads, setThreads] = useState<ChatThread[]>([]);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    const list = await chatApi.getThreads();
    setThreads(list);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Messages & Shoots</Text>
        <Text style={[styles.subtitle, { color: colors.textFaint }]}>Direct Creator ↔ Client Communication</Text>
      </View>

      {threads.map((t) => (
        <TouchableOpacity
          key={t.id}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Chat', { creatorId: t.creatorId, creatorName: t.creatorName, isPaidUnlocked: t.isPaidUnlocked })}
        >
          <Card style={styles.threadCard}>
            <Avatar source={t.creatorAvatar} size={52} verified={true} />

            <View style={styles.threadMeta}>
              <View style={styles.nameRow}>
                <Text style={[styles.creatorName, { color: colors.textPrimary }]}>{t.creatorName}</Text>
                <Text style={[styles.timeText, { color: colors.textFaint }]}>{t.lastMessageTime}</Text>
              </View>

              <Text style={[styles.lastMsg, { color: colors.textSecondary }]} numberOfLines={1}>
                {t.lastMessage}
              </Text>

              <View style={styles.badgeRow}>
                {t.isPaidUnlocked ? (
                  <Badge label="Unlocked • Shoot Confirmed" variant="success" />
                ) : (
                  <Badge label="Locked (Pending Payment)" variant="warning" />
                )}
              </View>
            </View>

            <ChevronRight size={20} color={colors.textFaint} />
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 64,
    paddingBottom: 115,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    borderRadius: 20,
  },
  threadMeta: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
  },
  lastMsg: {
    fontSize: 13,
    marginTop: 4,
  },
  badgeRow: {
    marginTop: 6,
  },
});
