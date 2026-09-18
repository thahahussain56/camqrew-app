import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Button } from '../../components/ui/Button';
import { Bell, Lock, Shield, Info, LogOut, FileText, Trash2, AlertTriangle, X } from 'lucide-react-native';
import { supabase } from '../../api/supabaseClient';
import { authApi } from '../../api/authApi';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuthStore();

  const [prefs, setPrefs] = useState({ booking: true, chat: true, marketing: false });
  const [loading, setLoading] = useState(true);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      supabase.from('users').select('push_preferences').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.push_preferences) {
            setPrefs(data.push_preferences as any);
          }
          setLoading(false);
        });
    }
  }, [user?.id]);

  const updatePref = async (key: string, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    if (user?.id) {
      const { error } = await supabase.from('users').update({ push_preferences: newPrefs }).eq('id', user.id);
      if (error) Alert.alert('Error', 'Failed to save preference');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE to confirm.');
      return;
    }

    setDeleting(true);
    try {
      await authApi.deleteAccount();
      setShowDeleteModal(false);
      await logout();
      Alert.alert('Account Deleted', 'Your Camcrew account and personal data have been permanently erased.');
    } catch (err: any) {
      Alert.alert('Cannot Delete Account', err.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

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
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>Chat Messages</Text>
          <Switch disabled={loading} value={prefs.chat} onValueChange={(v) => updatePref('chat', v)} thumbColor={colors.accent} />
        </View>

        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>Booking & Order Updates</Text>
          <Switch disabled={loading} value={prefs.booking} onValueChange={(v) => updatePref('booking', v)} thumbColor={colors.accent} />
        </View>

        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>Promotions & Offers</Text>
          <Switch disabled={loading} value={prefs.marketing} onValueChange={(v) => updatePref('marketing', v)} thumbColor={colors.accent} />
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

        <TouchableOpacity style={[styles.linkRow, { marginTop: 12 }]} onPress={() => navigation.navigate('TermsOfService')}>
          <FileText size={18} color={colors.accent} style={{ marginRight: 10 }} />
          <Text style={[styles.linkText, { color: colors.textPrimary }]}>Terms of Service & Privacy Policy</Text>
        </TouchableOpacity>
      </Card>

      {/* Account Management & Danger Zone */}
      <Card style={[styles.card, { borderColor: 'rgba(239, 68, 68, 0.25)', borderWidth: 1 }]}>
        <Text style={[styles.sectionHeading, { color: '#ef4444' }]}>Danger Zone</Text>
        <Text style={[styles.rowSub, { color: colors.textSecondary, marginBottom: 12 }]}>
          Permanently delete your account, portfolio, and personal data under Indian DPDP Act 2023.
        </Text>
        <TouchableOpacity 
          style={styles.deleteAccountBtn} 
          onPress={() => {
            setDeleteInput('');
            setShowDeleteModal(true);
          }}
          activeOpacity={0.8}
        >
          <Trash2 size={16} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.deleteAccountBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </Card>

      <Button
        title="Sign Out"
        variant="danger"
        size="lg"
        icon={<LogOut size={18} color="#ffffff" />}
        onPress={async () => {
          await logout();
        }}
        style={{ marginTop: 20 }}
      />

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={() => !deleting && setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.alertIconBox}>
                  <AlertTriangle size={20} color="#ef4444" />
                </View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Delete Account?</Text>
              </View>
              <TouchableOpacity onPress={() => !deleting && setShowDeleteModal(false)} style={{ padding: 4 }}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalWarningText, { color: colors.textSecondary }]}>
              This action is permanent and cannot be undone. All your profile data, portfolio showcases, and messaging records will be permanently erased.
            </Text>

            <View style={[styles.escrowNoticeBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
              <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '700' }}>Active Escrow Guard:</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                Deletion will be rejected if you have active shoots under escrow. Complete or cancel active bookings first.
              </Text>
            </View>

            <Text style={[styles.confirmPrompt, { color: colors.textPrimary }]}>
              Type <Text style={{ color: '#ef4444', fontWeight: '900' }}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: deleteInput === 'DELETE' ? '#ef4444' : colors.borderLight }]}
              placeholder="Type DELETE"
              placeholderTextColor={colors.textFaint}
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="characters"
              editable={!deleting}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.borderLight }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalDeleteBtn, { opacity: deleteInput === 'DELETE' && !deleting ? 1 : 0.5 }]}
                onPress={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '800' }}>Delete Forever</Text>
                )}
              </TouchableOpacity>
            </View>
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
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  deleteAccountBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIconBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalWarningText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  escrowNoticeBox: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  confirmPrompt: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteBtn: {
    flex: 1.3,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
