import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Star, Truck, Shield, CreditCard, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { subscriptionApi } from '../../api/subscriptionApi';
import { useNavigation } from '@react-navigation/native';

export const PrimeSubscriptionScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, updateUser } = useAuthStore();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    // Simulate Razorpay Gateway Delay
    setTimeout(async () => {
      const res = await subscriptionApi.upgradeSubscription(user.id, 'prime');
      if (res.success && res.user) {
        updateUser(res.user);
        alert('Welcome to Camcrew Prime!');
        navigation.goBack();
      } else {
        alert('Payment failed');
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 30 }}>
        <View style={[styles.iconContainer, { backgroundColor: '#FFD70020' }]}>
          <Star size={48} color="#FFD700" />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Camcrew Prime</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Elevate your production workflow with zero delivery fees and reduced security deposits.</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Prime Member</Text>
          <Text style={[styles.cardPrice, { color: "#FFD700" }]}>?499<Text style={{ fontSize: 14, color: colors.textSecondary }}>/mo</Text></Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Truck size={20} color="#FFD700" style={{ marginRight: 12 }} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>Free Delivery on Gear Rentals</Text>
          </View>
          <View style={styles.featureItem}>
            <Shield size={20} color="#FFD700" style={{ marginRight: 12 }} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>50% Reduced Security Deposits</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color="#FFD700" style={{ marginRight: 12 }} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>10% Off Studio Rentals</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color="#FFD700" style={{ marginRight: 12 }} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>Priority Customer Support</Text>
          </View>
        </View>
      </View>

      <Button
        title={loading ? 'Processing Payment...' : 'Subscribe to Prime'}
        onPress={handleSubscribe}
        size="lg"
        disabled={loading}
        icon={loading ? <ActivityIndicator color="#000" /> : <CreditCard size={20} color="#000" />}
        style={{ marginTop: 30, backgroundColor: "#FFD700" }}
      />
      
      <Button
        title="Not Now"
        variant="outline"
        onPress={() => navigation.goBack()}
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
