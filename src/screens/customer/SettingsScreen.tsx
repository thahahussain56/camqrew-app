import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Button } from '../../components/ui/Button';
import { Bell, Lock, Shield, Info, LogOut } from 'lucide-react-native';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { logout } = useAuthStore();

  const [bookingNotifs, setBookingNotifs] = React.useState(true);
  const [promoNotifs, setPromoNotifs] = React.useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>App Settings</Text>
      </View>

      {/* Theme Settings */}
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>App Appearance</Text>
            <Text style={[styles.rowSub, { color: colors.textFaint }]}>
              {isDark ? 'Dark Obsidian Mode' : 'Light Neumorphic Mode'}
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </Card>

      {/* Notifications */}
      <Card style={styles.card}>
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Push Notifications</Text>

        <View style={styles.row}>
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>Booking & Order Updates</Text>
          <Switch value={bookingNotifs} onValueChange={setBookingNotifs} thumbColor={colors.accent} />
        </View>

        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>Promotions & Offers</Text>
          <Switch value={promoNotifs} onValueChange={setPromoNotifs} thumbColor={colors.accent} />
        </View>
      </Card>

      {/* About & Support */}
      <Card style={styles.card}>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('About')}>
          <Info size={18} color={colors.accent} style={{ marginRight: 10 }} />
          <Text style={[styles.linkText, { color: colors.textPrimary }]}>About Camcrew Studio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.linkRow, { marginTop: 12 }]} onPress={() => navigation.navigate('Contact')}>
          <Shield size={18} color={colors.accent} style={{ marginRight: 10 }} />
          <Text style={[styles.linkText, { color: colors.textPrimary }]}>Contact Support & Help</Text>
        </TouchableOpacity>
      </Card>

      <Button
        title="Sign Out"
        variant="danger"
        size="lg"
        icon={<LogOut size={18} color="#ffffff" />}
        onPress={() => {
          logout();
          navigation.replace('Auth');
        }}
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 68,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  card: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
