import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, CheckCheck, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const NotificationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, dismissNotification } = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
    }
  }, [user?.id]);

  const handleTap = (n: any) => {
    if (!n.read) markAsRead(n.id);
    
    if (n.targetScreen) {
      navigation.navigate(n.targetScreen, n.targetParams);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
        <TouchableOpacity onPress={() => user?.id && markAllAsRead(user.id)}>
          <Text style={[styles.markAll, { color: colors.accent }]}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>No notifications yet.</Text>
        </View>
      ) : (
        notifications.map(n => (
          <Card key={n.id} style={[styles.notifCard, !n.read ? { borderColor: colors.accent } : {}]}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleTap(n)} style={styles.notifRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{n.title}</Text>
                <Text style={[styles.notifBody, { color: colors.textSecondary }]}>{n.body}</Text>
                <Text style={[styles.notifTime, { color: colors.textFaint }]}>{n.timestamp}</Text>
              </View>
              <TouchableOpacity onPress={() => dismissNotification(n.id)} style={{ padding: 6 }}>
                <Trash2 size={16} color={colors.textFaint} />
              </TouchableOpacity>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 68,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  markAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  notifCard: {
    marginBottom: 10,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  notifBody: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    marginTop: 6,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
