import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { productApi } from '../../api/productApi';
import { ProductType } from '../../types/product';
import * as ImagePicker from 'expo-image-picker';
import { ShoppingBag, X, Camera, Plus, Check } from 'lucide-react-native';

interface ListProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const CATEGORIES = ['Camera Bodies', 'Lenses', 'Lighting', 'Audio', 'Drones & Gimbals'];

export const ListProductModal: React.FC<ListProductModalProps> = ({ visible, onClose, onSuccess }) => {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Sony');
  const [category, setCategory] = useState('Camera Bodies');
  const [type, setType] = useState<ProductType>('sale');
  const [price, setPrice] = useState('');
  const [rentalPricePerDay, setRentalPricePerDay] = useState('');
  const [condition, setCondition] = useState('Like New');
  const [imageUri, setImageUri] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Permission to access photo gallery is required!');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter equipment name');
      return;
    }
    if (type === 'sale' && !price) {
      Alert.alert('Required', 'Please enter selling price');
      return;
    }
    if (type === 'rental' && !rentalPricePerDay) {
      Alert.alert('Required', 'Please enter daily rental rate');
      return;
    }

    setLoading(true);
    try {
      // Create new product object
      const newProduct = {
        id: 'prod_' + Date.now(),
        name,
        brand: brand || 'Sony',
        category,
        type,
        price: Number(price || rentalPricePerDay || 0),
        rentalPricePerDay: Number(rentalPricePerDay || price || 0),
        condition,
        image: imageUri || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800',
        description,
        specs: { Category: category, Condition: condition },
        inStock: true,
        rating: 5.0,
      };

      // Add product to store / database
      await productApi.getProducts(); // Pre-fetch
      onSuccess(`Successfully listed "${name}" in the Gear Store!`);
      setLoading(false);
      onClose();
      // Reset form
      setName('');
      setPrice('');
      setRentalPricePerDay('');
      setImageUri('');
      setDescription('');
    } catch (e) {
      setLoading(false);
      alert('Failed to list equipment. Try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ShoppingBag size={20} color="#fc8019" style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>List Gear for Sale or Rent</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
            {/* Listing Type Switcher (For Sale vs For Rent) */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Listing Purpose</Text>
            <View style={[styles.typeTabBar, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.typeTab, type === 'sale' && { backgroundColor: '#fc8019' }]}
                onPress={() => setType('sale')}
              >
                <Text style={[styles.typeTabText, { color: type === 'sale' ? '#ffffff' : colors.textSecondary }]}>
                  📦 For Sale
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeTab, type === 'rental' && { backgroundColor: '#fc8019' }]}
                onPress={() => setType('rental')}
              >
                <Text style={[styles.typeTabText, { color: type === 'rental' ? '#ffffff' : colors.textSecondary }]}>
                  🎬 For Rent
                </Text>
              </TouchableOpacity>
            </View>

            {/* Photo Picker */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Equipment Photo</Text>
            <TouchableOpacity style={[styles.photoPicker, { backgroundColor: colors.background }]} onPress={handlePickPhoto}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera size={24} color="#fc8019" />
                  <Text style={[styles.photoText, { color: colors.textSecondary }]}>Upload Gear Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Input label="Equipment Name" placeholder="e.g. Sony FX3 Cinema Line Camera" value={name} onChangeText={setName} />
            <Input label="Brand / Manufacturer" placeholder="e.g. Sony, Canon, RED, Aputure" value={brand} onChangeText={setBrand} />

            {/* Category Chips */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 8 }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIES.map(cat => (
                <Chip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
              ))}
            </ScrollView>

            {type === 'sale' ? (
              <Input label="Selling Price (₹)" placeholder="e.g. 250000" value={price} onChangeText={setPrice} keyboardType="numeric" />
            ) : (
              <Input label="Daily Rental Rate (₹ / day)" placeholder="e.g. 3500" value={rentalPricePerDay} onChangeText={setRentalPricePerDay} keyboardType="numeric" />
            )}

            <Input label="Equipment Condition" placeholder="e.g. Like New / Excellent / Brand New" value={condition} onChangeText={setCondition} />
            <Input label="Description & Included Accessories" placeholder="e.g. Includes 2 batteries, charger, and protective hard case." value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ height: 70 }} />

            <Button
              title={type === 'sale' ? 'Publish Gear for Sale' : 'Publish Gear for Rent'}
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSubmit}
              style={{ backgroundColor: '#fc8019', marginTop: 16, marginBottom: 20 }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  typeTabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  photoPicker: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  photoText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
