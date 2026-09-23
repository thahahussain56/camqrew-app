import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { productApi } from '../../api/productApi';
import { ProductType } from '../../types/product';
import * as ImagePicker from 'expo-image-picker';
import { ShoppingBag, X, Camera, Plus, Check } from 'lucide-react-native';
import { cloudStorageApi } from '../../api/cloudStorageApi';

interface ListProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialType?: ProductType;
}

const CATEGORIES = ['Camera Bodies', 'Lenses', 'Lighting', 'Audio', 'Drones & Gimbals'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export const ListProductModal: React.FC<ListProductModalProps> = ({ visible, onClose, onSuccess, initialType = 'rental' }) => {
  const { colors } = useTheme();
  
  const [type, setType] = useState<ProductType>(initialType);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [rentalPricePerDay, setRentalPricePerDay] = useState('');
  const [condition, setCondition] = useState<'New' | 'Like New' | 'Good' | 'Fair'>('Good');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [codEnabled, setCodEnabled] = useState(false);
  
  // Advanced e-commerce fields
  const [gtin, setGtin] = useState('');
  const [sku, setSku] = useState('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [itemDimensions, setItemDimensions] = useState('');
  const [packageDimensions, setPackageDimensions] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [searchTerms, setSearchTerms] = useState('');
  const [browseNodes, setBrowseNodes] = useState('');
  const [batteryInfo, setBatteryInfo] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [safetyWarnings, setSafetyWarnings] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Permission to access photo gallery is required!');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const newUris = res.assets.map(a => a.uri);
      setImageUris(prev => [...prev, ...newUris]);
    }
  };

  const removePhoto = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
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

    if (imageUris.length === 0) {
      Alert.alert('Required', 'Please add at least one photo of the equipment');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload all selected images to cloud storage
      const uploadedUrls: string[] = [];
      for (const uri of imageUris) {
        if (uri.startsWith('http')) {
          uploadedUrls.push(uri);
        } else {
          const response = await cloudStorageApi.uploadImage(uri, 'gear');
          if (response?.url) uploadedUrls.push(response.url);
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error('Failed to upload images');
      }

      // 2. Create new product object
      const newProduct = {
        name,
        category,
        type,
        price: type === 'sale' ? Number(price) : undefined,
        rentalPricePerDay: type === 'rental' ? Number(rentalPricePerDay) : undefined,
        condition,
        image: uploadedUrls[0],
        gallery: uploadedUrls.slice(1),
        description,
        codEnabled,
        gtin,
        sku,
        bulletPoints: bulletPoints ? bulletPoints.split('\n').filter(Boolean) : [],
        salePrice: salePrice ? Number(salePrice) : undefined,
        itemDimensions,
        packageDimensions,
        itemWeight,
        packageWeight,
        searchTerms: searchTerms ? searchTerms.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        browseNodes: browseNodes ? browseNodes.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        batteryInfo,
        countryOfOrigin,
        safetyWarnings,
      };

      // Add product to database
      await productApi.createProduct(newProduct);
      
      onSuccess(`Successfully listed "${name}" in the Gear Store!`);
      setLoading(false);
      onClose();
      // Reset form
      setName('');
      setBrand('');
      setPrice('');
      setRentalPricePerDay('');
      setImageUris([]);
      setDescription('');
    } catch (e) {
      setLoading(false);
      alert('Failed to list equipment. Try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ShoppingBag size={20} color="#3fb668" style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>List Gear for Sale or Rent</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Listing Type Switcher (For Sale vs For Rent) */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Listing Purpose</Text>
            <View style={[styles.typeTabBar, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.typeTab, type === 'sale' && { backgroundColor: '#3fb668' }]}
                onPress={() => setType('sale')}
              >
                <Text style={[styles.typeTabText, { color: type === 'sale' ? '#ffffff' : colors.textSecondary }]}>
                  📦 For Sale
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeTab, type === 'rental' && { backgroundColor: '#3fb668' }]}
                onPress={() => setType('rental')}
              >
                <Text style={[styles.typeTabText, { color: type === 'rental' ? '#ffffff' : colors.textSecondary }]}>
                  🎬 For Rent
                </Text>
              </TouchableOpacity>
            </View>

            {/* Photo Picker */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Equipment Photos ({imageUris.length})</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.photoPreviewWrapper}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[styles.photoAddBtn, { backgroundColor: colors.background }]} onPress={handlePickPhoto}>
                <Camera size={24} color="#3fb668" />
                <Text style={[styles.photoAddText, { color: colors.textSecondary }]}>Add Photos</Text>
              </TouchableOpacity>
            </ScrollView>

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

            <Input label="Equipment Condition" placeholder="e.g. Like New / Excellent / Brand New" value={condition} onChangeText={(text) => setCondition(text as any)} />
            <Input label="Description & Included Accessories" placeholder="e.g. Includes 2 batteries, charger, and protective hard case." value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ height: 70 }} />
            
            {type === 'sale' && (
              <View style={[styles.codContainer, { backgroundColor: colors.surfaceElevated }]}>
                <View>
                  <Text style={[styles.codTitle, { color: colors.textPrimary }]}>Cash on Delivery</Text>
                  <Text style={[styles.codDesc, { color: colors.textSecondary }]}>Allow buyers to pay upon delivery.</Text>
                </View>
                <Switch
                  value={codEnabled}
                  onValueChange={setCodEnabled}
                  trackColor={{ false: colors.border, true: '#3fb668' }}
                />
              </View>
            )}

            {/* ── Advanced E-Commerce Fields ── */}
            <Text style={[styles.label, { color: colors.textPrimary, marginTop: 16, fontSize: 16, fontWeight: '700' }]}>Advanced Retail Details</Text>
            
            {type === 'sale' && (
              <Input label="Sale Price (₹) - Optional" placeholder="Discounted price" value={salePrice} onChangeText={setSalePrice} keyboardType="numeric" />
            )}
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input label="SKU" placeholder="Internal code" value={sku} onChangeText={setSku} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="GTIN" placeholder="UPC/EAN" value={gtin} onChangeText={setGtin} />
              </View>
            </View>

            <Input label="Bullet Points (One per line)" placeholder="Feature 1\nFeature 2..." value={bulletPoints} onChangeText={setBulletPoints} multiline numberOfLines={4} style={{ height: 80 }} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input label="Item Dimensions" placeholder="10 x 5 x 2 cm" value={itemDimensions} onChangeText={setItemDimensions} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Item Weight" placeholder="200g" value={itemWeight} onChangeText={setItemWeight} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input label="Package Dims" placeholder="12 x 7 x 4 cm" value={packageDimensions} onChangeText={setPackageDimensions} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Pkg Weight" placeholder="250g" value={packageWeight} onChangeText={setPackageWeight} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input label="Country of Origin" placeholder="e.g. India" value={countryOfOrigin} onChangeText={setCountryOfOrigin} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Battery Info" placeholder="Lithium-ion included" value={batteryInfo} onChangeText={setBatteryInfo} />
              </View>
            </View>

            <Input label="Safety Warnings" placeholder="e.g. Choking hazard - small parts" value={safetyWarnings} onChangeText={setSafetyWarnings} />
            <Input label="Search Terms" placeholder="camera, lens, dslr (comma separated)" value={searchTerms} onChangeText={setSearchTerms} />
            <Input label="Browse Nodes" placeholder="Electronics > Cameras (comma separated)" value={browseNodes} onChangeText={setBrowseNodes} />
            
            <View style={{ height: 40 }} />
            <Button
              title={type === 'sale' ? 'Publish Gear for Sale' : 'Publish Gear for Rent'}
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSubmit}
              style={{ backgroundColor: '#3fb668', marginTop: 16, marginBottom: 20 }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    height: 140, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#3fb668',
  },
  photoPreviewWrapper: {
    width: 120, height: 120, borderRadius: 12, overflow: 'hidden', marginRight: 12, position: 'relative'
  },
  photoPreview: { width: '100%', height: '100%' },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  codContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  codTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  codDesc: {
    fontSize: 12,
  },
  photoAddBtn: {
    width: 120, height: 120, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#3fb668'
  },
  photoAddText: { fontSize: 12, marginTop: 8, fontWeight: '600' },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  photoText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
