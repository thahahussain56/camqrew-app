import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EarningsChart } from '../../components/charts/EarningsChart';
import { payoutApi, PayoutRecord, CreatorPayoutDetails } from '../../api/payoutApi';
import { ArrowUpRight, Download, CreditCard, Landmark, CheckCircle, Settings, X } from 'lucide-react-native';

export const EarningsScreen: React.FC = () => {
  const { colors } = useTheme();

  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [accountDetails, setAccountDetails] = useState<CreatorPayoutDetails>({
    upiId: 'thaha@okaxis',
    accountNumber: '987654321098',
    ifscCode: 'HDFC0001234',
    accountHolderName: 'Mohammad Thaha Hussain',
  });

  const [loading, setLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Form State inside modal
  const [upiId, setUpiId] = useState(accountDetails.upiId);
  const [accountNumber, setAccountNumber] = useState(accountDetails.accountNumber);
  const [ifscCode, setIfscCode] = useState(accountDetails.ifscCode);
  const [accountHolderName, setAccountHolderName] = useState(accountDetails.accountHolderName);

  useEffect(() => {
    loadPayoutData();
  }, []);

  const loadPayoutData = async () => {
    const history = await payoutApi.getPayoutHistory();
    setPayouts(history);
    const acc = await payoutApi.getCreatorAccount();
    setAccountDetails(acc);
    setUpiId(acc.upiId);
    setAccountNumber(acc.accountNumber);
    setIfscCode(acc.ifscCode);
    setAccountHolderName(acc.accountHolderName);
  };

  const handleRequestPayout = async () => {
    setLoading(true);
    try {
      const record = await payoutApi.requestInstantPayout(25000, 'upi');
      const history = await payoutApi.getPayoutHistory();
      setPayouts(history);
      Alert.alert(
        'Payout Transferred! 🚀',
        `₹25,000 sent directly to ${accountDetails.upiId} via Razorpay Route.\nTransaction Ref: ${record.transactionRef}`
      );
    } catch (e) {
      Alert.alert('Payout Failed', 'Could not complete payout request.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccountDetails = async () => {
    const updated: CreatorPayoutDetails = {
      upiId,
      accountNumber,
      ifscCode,
      accountHolderName,
    };
    await payoutApi.saveCreatorAccount(updated);
    setAccountDetails(updated);
    setShowAccountModal(false);
    Alert.alert('Payout Destination Updated', 'Your UPI ID & Bank details have been saved for direct Razorpay Route payouts.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Earnings & Razorpay Payouts</Text>
        <TouchableOpacity onPress={() => setShowAccountModal(true)} style={styles.settingsBtn}>
          <Settings size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Hero Earnings Card */}
      <Card style={styles.heroCard}>
        <Text style={[styles.heroLabel, { color: colors.textFaint }]}>Lifetime Net Creator Earnings</Text>
        <Text style={[styles.heroValue, { color: colors.accent }]}>₹3,80,000</Text>
        
        <View style={styles.payoutDestRow}>
          <CreditCard size={16} color={colors.textSecondary} />
          <Text style={[styles.destText, { color: colors.textSecondary }]}>
            Payout to: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{accountDetails.upiId}</Text>
          </Text>
        </View>

        <Button
          title="Request Instant Razorpay Payout (₹25,000)"
          variant="primary"
          size="md"
          loading={loading}
          icon={<ArrowUpRight size={16} color="#000000" />}
          onPress={handleRequestPayout}
          style={{ marginTop: 14 }}
        />
      </Card>

      {/* Analytics Chart */}
      <Card style={styles.card}>
        <EarningsChart />
      </Card>

      {/* Recent Payout History */}
      <Card style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Razorpay Route Payout History</Text>
          <TouchableOpacity onPress={() => setShowAccountModal(true)}>
            <Text style={[styles.editLink, { color: colors.accent }]}>Bank/UPI Settings</Text>
          </TouchableOpacity>
        </View>

        {payouts.map((p) => (
          <View key={p.id} style={[styles.payoutRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.payoutId, { color: colors.textPrimary }]}>{p.id} • {p.destination}</Text>
              <Text style={[styles.payoutDate, { color: colors.textFaint }]}>
                {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.payoutAmount, { color: colors.success }]}>+₹{p.amount.toLocaleString()}</Text>
              <Badge label={p.status === 'completed' ? 'Transferred' : 'Processing'} variant="success" />
            </View>
          </View>
        ))}
      </Card>

      <Button
        title="Download Annual Tax Form 16A (PDF)"
        variant="outline"
        size="lg"
        icon={<Download size={18} color={colors.accent} />}
        onPress={() => Alert.alert('Downloaded', 'Tax document downloaded.')}
        style={{ marginVertical: 10 }}
      />

      {/* Account / UPI Setup Modal */}
      <Modal visible={showAccountModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Razorpay Payout Account Setup</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Primary UPI ID (for Instant Payouts)"
              placeholder="name@okaxis"
              value={upiId}
              onChangeText={setUpiId}
              leftIcon={<CreditCard size={18} color={colors.textSecondary} />}
            />

            <Input
              label="Account Holder Name"
              placeholder="Name on bank account"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
            />

            <Input
              label="Bank Account Number"
              placeholder="987654321098"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              leftIcon={<Landmark size={18} color={colors.textSecondary} />}
            />

            <Input
              label="IFSC Code"
              placeholder="HDFC0001234"
              value={ifscCode}
              onChangeText={setIfscCode}
              autoCapitalize="characters"
            />

            <Button
              title="Save Payout Account"
              variant="primary"
              size="lg"
              onPress={handleSaveAccountDetails}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  settingsBtn: {
    padding: 8,
  },
  heroCard: {
    padding: 20,
    marginBottom: 16,
    borderWidth: 0,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  payoutDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  destText: {
    fontSize: 13,
    marginLeft: 6,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 0,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  payoutId: {
    fontSize: 14,
    fontWeight: '700',
  },
  payoutDate: {
    fontSize: 12,
    marginTop: 2,
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
});
