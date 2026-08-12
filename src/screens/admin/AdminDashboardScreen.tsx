import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { ShieldCheck, Users, DollarSign, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react-native';

export const AdminDashboardScreen: React.FC = () => {
  const { colors } = useTheme();

  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 'app_1', name: 'Rohan Deshmukh', category: 'Videographers', city: 'Pune', rate: 22000 },
    { id: 'app_2', name: 'Kavya Nair', category: 'Photographers', city: 'Kochi', rate: 18000 },
  ]);

  const [toastMessage, setToastMessage] = useState('');

  const handleApprove = (id: string, name: string) => {
    setPendingApprovals(pendingApprovals.filter(a => a.id !== id));
    setToastMessage(`Approved professional application for ${name}`);
  };

  const handleReject = (id: string, name: string) => {
    setPendingApprovals(pendingApprovals.filter(a => a.id !== id));
    setToastMessage(`Rejected application for ${name}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMessage} message={toastMessage} type="info" onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <ShieldCheck size={20} color={colors.accent} />
          <Badge label="ADMIN CONTROL CENTER" variant="verified" />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Camcrew Platform Admin</Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Text style={[styles.metVal, { color: colors.textPrimary }]}>2,480</Text>
          <Text style={[styles.metLabel, { color: colors.textFaint }]}>Total Users</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={[styles.metVal, { color: colors.textPrimary }]}>620</Text>
          <Text style={[styles.metLabel, { color: colors.textFaint }]}>Pros Verified</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={[styles.metVal, { color: colors.accent }]}>₹1.4M</Text>
          <Text style={[styles.metLabel, { color: colors.textFaint }]}>Monthly GMV</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={[styles.metVal, { color: colors.warning }]}>{pendingApprovals.length}</Text>
          <Text style={[styles.metLabel, { color: colors.textFaint }]}>Pending Queue</Text>
        </Card>
      </View>

      {/* Professional Approval Queue */}
      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pending Professional Registrations</Text>
        {pendingApprovals.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>No pending professional approvals.</Text>
        ) : (
          pendingApprovals.map(pro => (
            <View key={pro.id} style={[styles.proAppRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.proName, { color: colors.textPrimary }]}>{pro.name}</Text>
                <Text style={[styles.proSub, { color: colors.textSecondary }]}>
                  {pro.category} • {pro.city} • ₹{pro.rate.toLocaleString('en-IN')}/day
                </Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => handleApprove(pro.id, pro.name)} style={styles.approveBtn}>
                  <CheckCircle2 size={24} color={colors.success} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleReject(pro.id, pro.name)} style={styles.rejectBtn}>
                  <XCircle size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    padding: 14,
  },
  metVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  metLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    marginVertical: 8,
  },
  proAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  proName: {
    fontSize: 15,
    fontWeight: '700',
  },
  proSub: {
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  approveBtn: {
    padding: 4,
  },
  rejectBtn: {
    padding: 4,
  },
});
