import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Shield, Zap, CheckCircle, CreditCard } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { subscriptionApi } from '../../api/subscriptionApi';

export const ProPaywallScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, updateUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    // Simulate Razorpay Gateway Delay
    setTimeout(async () => {
      const res = await subscriptionApi.upgradeSubscription(user.id, 'pro');
      if (res.success && res.user) {
        updateUser(res.user);
      } else {
        alert('Payment failed');
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 40 }}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
          <Shield size={48} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Camqrew Pro Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Subscribe to access your creator dashboard, receive booking requests, and get paid instantly.</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Professional Tier</Text>
          <Text style={[styles.cardPrice, { color: colors.accent }]}>?999<Text style={{ fontSize: 14, color: colors.textSecondary }}>/mo</Text></Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={colors.accent} style={{ marginRight: 12 }} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>0% Platform Commissions</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={colors.accent} style={{ marginRight: 12 }} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>Priority Search Placement</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={colors.accent} style={{ marginRight: 12 }} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>Instant RazorpayX Payouts</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={colors.accent} style={{ marginRight: 12 }} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>Advanced Analytics Dashboard</Text>
          </View>
        </View>
      </View>

      <Button
        title={loading ? 'Processing Payment...' : 'Subscribe via Razorpay'}
        onPress={handleSubscribe}
        size="lg"
        disabled={loading}
        icon={loading ? <ActivityIndicator color="#000" /> : <CreditCard size={20} color="#000" />}
        style={{ marginTop: 30 }}
      />
      
      <Button
        title="Sign Out"
        variant="outline"
        onPress={logout}
        style={{ marginTop: 16 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  card: { borderWidth: 1, borderRadius: 16, padding: 24, marginTop: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#333' },
  cardTitle: { fontSize: 20, fontWeight: '700' },
  cardPrice: { fontSize: 24, fontWeight: '800' },
  featureList: { gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontSize: 16, fontWeight: '500' },
});
