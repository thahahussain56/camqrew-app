import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { PROFESSIONAL_CATEGORIES } from '../../constants/categories';
import { ChevronDown, Search, X, Check, Briefcase, Camera, Film, User, Cake, Coffee, Calendar, Heart, Palette, Code, Car, Gift } from 'lucide-react-native';

interface CategoryDropdownProps {
  value: string;
  onSelect: (categoryName: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

const getCategoryIcon = (iconName: string, color: string, size = 18) => {
  switch (iconName) {
    case 'camera':
      return <Camera size={size} color={color} />;
    case 'video':
      return <Film size={size} color={color} />;
    case 'user':
      return <User size={size} color={color} />;
    case 'cake':
      return <Cake size={size} color={color} />;
    case 'coffee':
      return <Coffee size={size} color={color} />;
    case 'calendar':
      return <Calendar size={size} color={color} />;
    case 'heart':
      return <Heart size={size} color={color} />;
    case 'palette':
      return <Palette size={size} color={color} />;
    case 'code':
      return <Code size={size} color={color} />;
    case 'car':
      return <Car size={size} color={color} />;
    case 'gift':
      return <Gift size={size} color={color} />;
    default:
      return <Briefcase size={size} color={color} />;
  }
};

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onSelect,
  label = 'PRIMARY INDUSTRY / CATEGORY *',
  required = true,
  placeholder = 'Select primary category',
}) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCat = PROFESSIONAL_CATEGORIES.find(c => c.name === value);

  const filteredCategories = PROFESSIONAL_CATEGORIES.filter(cat => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q)
    );
  });

  const handleSelect = (categoryName: string) => {
    onSelect(categoryName);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {label} {required && !label.includes('*') && <Text style={{ color: colors.accent }}>*</Text>}
        </Text>
      ) : null}

      {/* Field Trigger */}
      <TouchableOpacity
        style={[
          styles.triggerBox,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.borderLight,
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerLeft}>
          <View style={[styles.triggerIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            {selectedCat ? (
              getCategoryIcon(selectedCat.icon, colors.accent, 16)
            ) : (
              <Briefcase size={16} color={colors.textFaint} />
            )}
          </View>
          <Text
            style={[
              styles.triggerText,
              { color: value ? colors.textPrimary : colors.textFaint },
            ]}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        </View>

        <ChevronDown size={18} color={colors.accent} />
      </TouchableOpacity>

      {/* Modal Dropdown Bottom Sheet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={() => {
              setModalVisible(false);
              setSearchQuery('');
            }}
          />

          <View style={[styles.sheetContainer, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            {/* Top Drag Indicator */}
            <View style={[styles.dragHandle, { backgroundColor: colors.borderLight }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Select Primary Category</Text>
                <Text style={[styles.sheetSub, { color: colors.textFaint }]}>Choose your core professional service</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.borderLight }]}>
              <Search size={16} color={colors.textFaint} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search categories..."
                placeholderTextColor={colors.textFaint}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={15} color={colors.textFaint} />
                </TouchableOpacity>
              )}
            </View>

            {/* Categories List */}
            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCategories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textFaint }]}>
                    No categories found for "{searchQuery}"
                  </Text>
                </View>
              ) : (
                filteredCategories.map(cat => {
                  const isSelected = cat.name === value;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryRow,
                        { borderColor: colors.borderLight },
                        isSelected && [
                          styles.categoryRowSelected,
                          {
                            backgroundColor: 'rgba(63, 182, 104, 0.12)',
                            borderColor: colors.accent,
                          },
                        ],
                      ]}
                      onPress={() => handleSelect(cat.name)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.catIconCircle, { backgroundColor: isSelected ? 'rgba(63, 182, 104, 0.2)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]}>
                        {getCategoryIcon(cat.icon, isSelected ? colors.accent : colors.textSecondary, 18)}
                      </View>

                      <View style={styles.catInfo}>
                        <Text
                          style={[
                            styles.catName,
                            {
                              color: isSelected ? colors.accent : colors.textPrimary,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {cat.name}
                        </Text>
                        <Text style={[styles.catDesc, { color: colors.textFaint }]} numberOfLines={2}>
                          {cat.description}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
                          <Check size={14} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  triggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  triggerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '80%',
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  optionsList: {
    maxHeight: 380,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryRowSelected: {
    borderWidth: 1.5,
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catInfo: {
    flex: 1,
    marginRight: 10,
  },
  catName: {
    fontSize: 14,
    marginBottom: 2,
  },
  catDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
