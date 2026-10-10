import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../api/supabaseClient';
import { registerCreatorPickupAddress, CreatorPickupAddress } from '../../api/shiprocketService';
import { Building2, X, Phone, User, MapPin, CheckCircle2 } from 'lucide-react-native';

export interface CreatorPickupData {
  name: string;
  phone: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  pickup_nickname?: string;
}

interface CreatorPickupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (data: CreatorPickupData) => void;
  initialData?: CreatorPickupData | null;
  userId?: string;
  userEmail?: string;
}

export const CreatorPickupModal: React.FC<CreatorPickupModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialData,
  userId,
  userEmail,
}) => {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setName(initialData.name || '');
      setPhone(initialData.phone || '');
      setAddress(initialData.address || '');
      setAddress2(initialData.address2 || '');
      setCity(initialData.city || '');
      setState(initialData.state || '');
      setPincode(initialData.pincode || '');
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your Contact Person / Studio Manager name.');
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please provide a valid 10-digit mobile number for courier pickup coordination.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter your street address.');
      return;
    }
    if (!city.trim() || !state.trim()) {
      Alert.alert('Required Field', 'Please specify your city and state.');
      return;
    }
    const cleanPin = pincode.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit Indian postal pincode.');
      return;
    }

    setLoading(true);
    try {
      // Get current user id and email if not provided
      let currentUserId = userId;
      let currentUserEmail = userEmail;
      if (!currentUserId) {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData?.user?.id;
        currentUserEmail = authData?.user?.email;
      }

      if (!currentUserId) {
        throw new Error('You must be logged in to register a pickup address.');
      }

      const nickname = `STUDIO-${currentUserId.slice(0, 8)}`;

      // 1. Register with Shiprocket API via Supabase Edge Function
      const srRes = await registerCreatorPickupAddress({
        user_id: currentUserId,
        name: name.trim(),
        email: currentUserEmail || 'creator@camqrew.in',
        phone: cleanPhone,
        address: address.trim(),
        address_2: address2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPin,
        pickup_nickname: nickname,
      });

      const finalPickupNickname = srRes.pickup_location || nickname;

      // 2. Save in Supabase addresses table
      await supabase.from('addresses').upsert({
        user_id: currentUserId,
        label: 'Studio Pickup',
        line1: address.trim(),
        line2: address2.trim() || '',
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPin,
        is_default: true,
      });

      // 3. Save to Auth user_metadata
      await supabase.auth.updateUser({
        data: {
          pickup_address: {
            name: name.trim(),
            phone: cleanPhone,
            address: address.trim(),
            address2: address2.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: cleanPin,
            pickup_nickname: finalPickupNickname,
          },
        },
      });

      const updatedData: CreatorPickupData = {
        name: name.trim(),
        phone: cleanPhone,
        address: address.trim(),
        address2: address2.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPin,
        pickup_nickname: finalPickupNickname,
      };

      onSuccess(updatedData);
      onClose();
    } catch (err: any) {
      console.error('Error saving pickup address:', err);
      Alert.alert(
        'Shiprocket Verification Error',
        err.message || 'Failed to verify and register studio pickup address with Shiprocket.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceElevated }]}>
                <Building2 size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Studio Pickup Address</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Verified with Shiprocket for courier doorstep pickups
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Input
              label="Contact Person / Manager Name *"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={setName}
              leftIcon={<User size={18} color={colors.textFaint} />}
            />

            <Input
              label="Phone Number (For Courier Pickup) *"
              placeholder="e.g. 9876543210 (10 digits)"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={18} color={colors.textFaint} />}
            />

            <Input
              label="Studio / Door Address *"
              placeholder="Floor, Studio name, Flat/Building"
              value={address}
              onChangeText={setAddress}
              leftIcon={<MapPin size={18} color={colors.textFaint} />}
            />

            <Input
              label="Street / Landmark (Optional)"
              placeholder="Nearby landmark or area"
              value={address2}
              onChangeText={setAddress2}
            />

            <View style={styles.twoColumn}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="City *"
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Input
                  label="State *"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <Input
              label="Postal Pincode *"
              placeholder="e.g. 400050"
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />

            <View style={[styles.infoBanner, { backgroundColor: colors.surfaceElevated }]}>
              <CheckCircle2 size={16} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Shiprocket checks serviceability automatically and dispatches verified couriers (Bluedart, Delhivery, DTDC) to your studio doorstep.
              </Text>
            </View>
          </ScrollView>

          {/* Actions Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              disabled={loading}
              onPress={onClose}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title={loading ? 'Verifying with Shiprocket...' : 'Save & Register'}
              variant="primary"
              size="md"
              loading={loading}
              onPress={handleSave}
              style={{ flex: 2, marginLeft: 8 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 10,
  },
  scrollContent: {
    padding: 18,
  },
  twoColumn: {
    flexDirection: 'row',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 10,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
});
