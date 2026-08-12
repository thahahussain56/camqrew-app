import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Award, Users, Camera, MapPin } from 'lucide-react-native';

export const AboutScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Built for Creators, <Text style={{ color: colors.accent }}>by Creators.</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Camcrew Studio (camcrew.in) is India's premier creative production marketplace.
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>The Camcrew Journey</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Born in the trenches of film sets and photo studios, Camcrew was built to bridge the gap between world-class clients and top-tier creative talent across India. From cinema gear rentals to celebrity photographers, we power India's creative economy.
        </Text>
      </Card>

      {/* Founder Card */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Leadership</Text>
        <View style={styles.founderRow}>
          <Avatar source="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400" size={60} />
          <View style={styles.founderMeta}>
            <Text style={[styles.founderName, { color: colors.textPrimary }]}>Mohammad Thaha Hussain</Text>
            <Text style={[styles.founderTitle, { color: colors.accent }]}>Founder & CEO, Camcrew India</Text>
          </View>
        </View>
      </Card>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  founderMeta: {
    marginLeft: 14,
  },
  founderName: {
    fontSize: 16,
    fontWeight: '800',
  },
  founderTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
