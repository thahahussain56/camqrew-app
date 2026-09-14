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
import { Search, ShoppingBag, Filter } from 'lucide-react-native';
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

      {/* ── Premium Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Gear Store</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Shop & Rent Professional Equipment</Text>
          </View>
          <TouchableOpacity
            style={[styles.cartIconBtn, { backgroundColor: colors.surfaceElevated }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <ShoppingBag size={22} color={colors.textPrimary} />
            {cartCount > 0 && (
              <View style={[styles.badgeDot, { backgroundColor: '#ef4444', borderColor: colors.surfaceCard }]}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Search size={18} color={colors.textFaint} style={{ marginLeft: 16 }} />
          <RNTextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search cameras, lenses, lights..."
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.background }]}>
            <Filter size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* ── DB-Aligned Store Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            style={[
              styles.storeTab,
              { backgroundColor: colors.surfaceCard, borderColor: 'transparent' },
              activeTab === 'official' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
            ]}
            onPress={() => setActiveTab('official')}
          >
            <Text style={[styles.storeTabText, activeTab === 'official' ? { color: colors.accent, fontWeight: '900' } : { color: colors.textSecondary }]}>
              ✨ Official Gear
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.storeTab,
              { backgroundColor: colors.surfaceCard, borderColor: 'transparent' },
              activeTab === 'used' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
            ]}
            onPress={() => setActiveTab('used')}
          >
            <Text style={[styles.storeTabText, activeTab === 'used' ? { color: colors.accent, fontWeight: '900' } : { color: colors.textSecondary }]}>
              ♻️ Used Pro Gear
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.storeTab,
              { backgroundColor: colors.surfaceCard, borderColor: 'transparent' },
              activeTab === 'rental' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
            ]}
            onPress={() => setActiveTab('rental')}
          >
            <Text style={[styles.storeTabText, activeTab === 'rental' ? { color: colors.accent, fontWeight: '900' } : { color: colors.textSecondary }]}>
              🎬 Rentals
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Category Chips ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GEAR_CATEGORIES.map(cat => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.catChip,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                    active && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }
                  ]}
                >
                  <Text style={[
                    styles.catChipText,
                    { color: colors.textSecondary },
                    active && { color: colors.background }
                  ]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  cartIconBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute', top: 0, right: -4,
    borderRadius: 12, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    height: '100%',
  },
  filterBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },

  // Store Tabs
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  storeTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeTabText: { fontSize: 14, fontWeight: '700' },

  // Categories
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  catChipText: { fontSize: 13, fontWeight: '600' },

  // Grid
  gridContent: { paddingHorizontal: 16 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyText: { textAlign: 'center', marginTop: 40, fontWeight: '600' },
});
