import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { MenuDishItem } from '../../types/professional';
import { UtensilsCrossed, X } from 'lucide-react-native';

interface ListMenuDishModalProps {
  visible: boolean;
  dishToEdit?: MenuDishItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onSave: (dish: Omit<MenuDishItem, 'id' | 'isAvailable'>, editingId?: string) => Promise<void>;
}

const MENU_CATEGORIES: MenuDishItem['category'][] = [
  'Starter',
  'Main Course',
  'Dessert',
  'Beverage',
  'Live Counter',
  'Other',
];

const DIETARY_OPTIONS: ('Veg' | 'Non-Veg' | 'Jain' | 'Vegan')[] = [
  'Veg',
  'Non-Veg',
  'Jain',
  'Vegan',
];

export const ListMenuDishModal: React.FC<ListMenuDishModalProps> = ({
  visible,
  dishToEdit,
  onClose,
  onSuccess,
  onSave,
}) => {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuDishItem['category']>('Starter');
  const [pricePerPlate, setPricePerPlate] = useState('');
  const [dietaryTags, setDietaryTags] = useState<MenuDishItem['dietaryTags']>(['Veg']);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dishToEdit) {
      setName(dishToEdit.name);
      setCategory(dishToEdit.category);
      setPricePerPlate(dishToEdit.pricePerPlate ? dishToEdit.pricePerPlate.toString() : '');
      setDietaryTags(dishToEdit.dietaryTags || ['Veg']);
      setDescription(dishToEdit.description || '');
      setImageUrl(dishToEdit.imageUrl || '');
    } else {
      setName('');
      setCategory('Starter');
      setPricePerPlate('');
      setDietaryTags(['Veg']);
      setDescription('');
      setImageUrl('');
    }
  }, [dishToEdit, visible]);

  const toggleDietaryTag = (tag: 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan') => {
    setDietaryTags(prev => {
      if (prev.includes(tag)) {
        if (prev.length === 1) return prev; // Keep at least one tag
        return prev.filter(t => t !== tag);
      } else {
        // If selecting Non-Veg, remove Veg/Jain/Vegan if exclusive, or allow combinations
        if (tag === 'Non-Veg') {
          return ['Non-Veg'];
        } else {
          return [...prev.filter(t => t !== 'Non-Veg'), tag];
        }
      }
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a dish name.');
      return;
    }
    const priceNum = Number(pricePerPlate);
    if (!pricePerPlate || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Required', 'Please enter a valid price per plate.');
      return;
    }

    setLoading(true);
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          pricePerPlate: priceNum,
          dietaryTags: dietaryTags.length > 0 ? dietaryTags : ['Veg'],
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        },
        dishToEdit ? dishToEdit.id : undefined,
      );
      onSuccess(dishToEdit ? 'Dish updated successfully!' : '🎉 New dish added to menu!');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save menu dish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(63,182,104,0.15)' }]}>
                <UtensilsCrossed size={20} color="#3fb668" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {dishToEdit ? 'Edit Menu Dish' : 'Add Dish to Menu'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Swiggy-style catering menu item & pricing
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Dish Name */}
            <Input
              label="Dish / Item Name *"
              placeholder="e.g. Paneer Butter Masala, Mutton Biryani, Gulab Jamun"
              value={name}
              onChangeText={setName}
            />

            {/* Category Selector */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Menu Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {MENU_CATEGORIES.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  active={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </ScrollView>

            {/* Price per Plate */}
            <Input
              label="Price per Plate / Serving (₹) *"
              placeholder="e.g. 250"
              value={pricePerPlate}
              onChangeText={setPricePerPlate}
              keyboardType="numeric"
            />

            {/* Dietary Classification */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Dietary Classification *</Text>
            <View style={styles.dietaryRow}>
              {DIETARY_OPTIONS.map(tag => {
                const isSelected = dietaryTags.includes(tag);
                const isGreen = tag === 'Veg' || tag === 'Jain' || tag === 'Vegan';
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleDietaryTag(tag)}
                    style={[
                      styles.dietaryChip,
                      {
                        backgroundColor: isSelected
                          ? (isGreen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)')
                          : colors.surfaceElevated,
                        borderColor: isSelected
                          ? (isGreen ? '#16a34a' : '#dc2626')
                          : colors.borderLight,
                      },
                    ]}
                  >
                    {/* FSSAI symbol */}
                    <View
                      style={[
                        styles.vegSymbolBox,
                        { borderColor: isGreen ? '#16a34a' : '#dc2626' },
                      ]}
                    >
                      <View
                        style={[
                          styles.vegSymbolDot,
                          { backgroundColor: isGreen ? '#16a34a' : '#dc2626' },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.dietaryText,
                        {
                          color: isSelected
                            ? (isGreen ? '#16a34a' : '#dc2626')
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description */}
            <Input
              label="Portion & Preparation Details (Optional)"
              placeholder="e.g. Served with fresh coriander garnish, prepared in pure desi ghee."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ height: 75 }}
            />

            {/* Dish Photo URL */}
            <Input
              label="Dish Photo URL (Optional)"
              placeholder="https://images.unsplash.com/... or web image link"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            {imageUrl.trim() ? (
              <View style={styles.imagePreviewWrap}>
                <Image
                  source={{ uri: imageUrl.trim() }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setImageUrl('')}
                  style={styles.imageClearBtn}
                >
                  <X size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={onClose}
              disabled={loading}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title={dishToEdit ? 'Save Changes' : 'Add Dish'}
              variant="primary"
              size="md"
              onPress={handleSave}
              loading={loading}
              style={{ flex: 1.5, backgroundColor: '#3fb668' }}
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    maxHeight: 460,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  dietaryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  vegSymbolBox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegSymbolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dietaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  imagePreviewWrap: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 14,
    width: 120,
    height: 90,
  },
  imagePreview: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#1c222b',
  },
  imageClearBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
