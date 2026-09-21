import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, KeyboardAvoidingView, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { productApi } from '../../api/productApi';
import { Product, ProductType } from '../../types/product';
import { ProductCard } from '../../components/cards/ProductCard';
import { Toast } from '../../components/ui/Toast';
import { useCartStore } from '../../store/cartStore';
import { GEAR_CATEGORIES } from '../../constants/categories';
import { Search, ShoppingBag, SlidersHorizontal, ShieldCheck, RefreshCw, Film } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput as RNTextInput } from 'react-native';

const { width } = Dimensions.get('window');

type StoreTab = 'official' | 'used' | 'rental';

export const MarketplaceScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { addItem, items } = useCartStore();

  const [activeTab, setActiveTab] = useState<StoreTab>('official');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (route?.params?.initialType === 'rental') {
      setActiveTab('rental');
    } else if (route?.params?.initialType === 'sale') {
      setActiveTab('official');
    }
  }, [route?.params?.initialType]);

  // Fetch from DB based on selected tab mapping
  // Fetch from DB based on selected tab mapping
  useFocusEffect(
    useCallback(() => {
      let activeApiType: ProductType = activeTab === 'rental' ? 'rental' : 'sale';
      setLoading(true);
      productApi.getProducts(activeApiType, selectedCategory, searchQuery).then(res => {
        let fetched = Array.isArray(res) ? res : [];
        // Sub-filter sales into official vs used
        if (activeTab === 'official') {
          fetched = fetched.filter(p => p.isOfficial);
        } else if (activeTab === 'used') {
          fetched = fetched.filter(p => p.isUsed);
        }
        setProducts(fetched);
        setLoading(false);
      });
    }, [activeTab, selectedCategory, searchQuery])
  );

  const cartCount = items.length;

  const handleAddToCart = (prd: Product) => {
    addItem(prd);
    setToastMsg(`Added "${prd.name}" to cart!`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <Toast visible={!!toastMsg} message={toastMsg} type="success" onDismiss={() => setToastMsg('')} />

      {/* ── Minimal Header (Home-Page Design System - Stroke-Free) ── */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Gear Store</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Shop & Rent Professional Equipment</Text>
          </View>
          <TouchableOpacity
            style={[styles.cartIconBtn, { backgroundColor: colors.surfaceElevated }]}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.8}
          >
            <ShoppingBag size={20} color={colors.textPrimary} />
            {cartCount > 0 && (
              <View style={[styles.badgeDot, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Segmented Mode Switcher (Official vs Used vs Rentals) ── */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceElevated }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentBtn,
              activeTab === 'official' && [styles.segmentBtnActive, { backgroundColor: colors.surfaceCard }]
            ]}
            onPress={() => setActiveTab('official')}
          >
            <ShieldCheck size={14} color={activeTab === 'official' ? colors.accent : colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[styles.segmentText, { color: activeTab === 'official' ? colors.textPrimary : colors.textSecondary, fontWeight: activeTab === 'official' ? '800' : '600' }]}>
              Official Gear
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentBtn,
              activeTab === 'used' && [styles.segmentBtnActive, { backgroundColor: colors.surfaceCard }]
            ]}
            onPress={() => setActiveTab('used')}
          >
            <RefreshCw size={13} color={activeTab === 'used' ? colors.accent : colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[styles.segmentText, { color: activeTab === 'used' ? colors.textPrimary : colors.textSecondary, fontWeight: activeTab === 'used' ? '800' : '600' }]}>
              Used Pro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentBtn,
              activeTab === 'rental' && [styles.segmentBtnActive, { backgroundColor: colors.surfaceCard }]
            ]}
            onPress={() => setActiveTab('rental')}
          >
            <Film size={14} color={activeTab === 'rental' ? colors.accent : colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[styles.segmentText, { color: activeTab === 'rental' ? colors.textPrimary : colors.textSecondary, fontWeight: activeTab === 'rental' ? '800' : '600' }]}>
              Rentals
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Search size={17} color={colors.textSecondary} style={{ marginLeft: 14 }} />
          <RNTextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search cameras, lenses, lights..."
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: colors.surfaceCard },
              selectedCategory !== 'All' && { backgroundColor: colors.accentGlow }
            ]}
            onPress={() => setSelectedCategory('All')}
            activeOpacity={0.8}
          >
            <SlidersHorizontal size={15} color={selectedCategory !== 'All' ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Category Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {GEAR_CATEGORIES.map(cat => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: active ? colors.accent : colors.surfaceElevated,
                  }
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color: active ? '#ffffff' : colors.textSecondary,
                      fontWeight: active ? '800' : '600',
                    }
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}>
        {/* ── Product Grid ── */}
        <View style={styles.gridContent}>
          {loading ? (
            <Text style={[styles.emptyText, { color: colors.textFaint }]}>Loading gear...</Text>
          ) : products.length > 0 ? (
            <View style={styles.grid}>
              {products.map(prd => (
                <ProductCard
                  key={prd.id}
                  product={prd}
                  onPress={() => navigation.navigate('ProductDetail', { id: prd.id })}
                  onAddToCart={() => handleAddToCart(prd)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📸</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Gear Found</Text>
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Try selecting a different category or adjusting your search.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  cartIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  
  // Segmented Mode Switcher
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12.5,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    height: '100%',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Categories
  chipsScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  catChipText: {
    fontSize: 12.5,
  },

  // Grid
  gridContent: { paddingHorizontal: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyText: { textAlign: 'center', marginTop: 40, fontWeight: '600' },
});
