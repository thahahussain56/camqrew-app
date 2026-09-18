import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { IOSNavBar } from '../../components/navigation/IOSNavBar';
import { useNavBarHeight } from '../../hooks/useNavBarHeight';
import { supabase } from '../../api/supabaseClient';
import { User, Phone, Mail } from 'lucide-react-native';

export const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const navBarHeight = useNavBarHeight();
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: name.trim(), phone: phone.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      updateUser({ name: name.trim(), phone: phone.trim() });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* iOS Navigation Bar */}
      <IOSNavBar
        title="Edit Profile"
        showBack
        onPressBack={() => navigation.goBack()}
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            title="Save"
            loading={loading}
            onPress={handleSave}
            style={{ paddingHorizontal: 4 }}
            textStyle={{ color: '#007AFF', fontSize: 17, fontWeight: '400' }}
          />
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: navBarHeight }]} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.inputContainer, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
            <View style={styles.inputHeader}>
              <User size={16} color={colors.textSecondary} />
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textFaint}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
            <View style={styles.inputHeader}>
              <Phone size={16} color={colors.textSecondary} />
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textFaint}
              keyboardType="phone-pad"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight, opacity: 0.6 }]}>
            <View style={styles.inputHeader}>
              <Mail size={16} color={colors.textSecondary} />
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address (Read-only)</Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={user?.email || ''}
              editable={false}
            />
          </View>

          <Button
            title={loading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={loading}
            style={{ marginTop: 20 }}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
  },
});
