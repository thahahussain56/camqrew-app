import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useNotificationStore } from '../../store/notificationStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, CheckCheck, Trash2 } from 'lucide-react-native';

export const NotificationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { notifications, markAsRead, markAllAsRead, dismissNotification } = useNotificationStore();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={[styles.markAll, { color: colors.accent }]}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>No notifications yet.</Text>
        </View>
      ) : (
        notifications.map(n => (
          <Card key={n.id} style={[styles.notifCard, !n.read ? { borderColor: colors.accent } : {}]}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => markAsRead(n.id)} style={styles.notifRow}>
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
