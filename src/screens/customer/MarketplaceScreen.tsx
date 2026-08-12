import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { productApi } from '../../api/productApi';
import { Product, ProductType } from '../../types/product';
import { ProductCard } from '../../components/cards/ProductCard';
import { Chip } from '../../components/ui/Chip';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { useCartStore } from '../../store/cartStore';
import { GEAR_CATEGORIES } from '../../constants/categories';
import { Search, ShoppingBag, ShoppingCart } from 'lucide-react-native';

export const MarketplaceScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { addItem, items } = useCartStore();

  const initialType: ProductType = route?.params?.initialType || 'sale';
  const [activeTab, setActiveTab] = useState<ProductType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (route?.params?.initialType) {
      setActiveTab(route.params.initialType);
    }
  }, [route?.params?.initialType]);

  useEffect(() => {
    productApi.getProducts(activeTab, selectedCategory, searchQuery).then(res => setProducts(Array.isArray(res) ? res : []));
  }, [activeTab, selectedCategory, searchQuery]);

  const cartCount = items.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toastMsg} message={toastMsg} type="success" onDismiss={() => setToastMsg('')} />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Gear Marketplace</Text>
          <TouchableOpacity
            style={[styles.cartIconBtn, { backgroundColor: colors.surfaceCard }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <ShoppingBag size={20} color={colors.textPrimary} />
            {cartCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Switcher: Sales (Buy Gear) vs Rentals (Rent Gear) */}
        <View style={[styles.tabBar, { backgroundColor: colors.surfaceCard }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'sale' && { backgroundColor: '#fc8019' },
            ]}
            onPress={() => setActiveTab('sale')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'sale' ? '#ffffff' : colors.textPrimary }]}>
              📦 Buy Gear (Sales)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'rental' && { backgroundColor: '#fc8019' },
            ]}
            onPress={() => setActiveTab('rental')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'rental' ? '#ffffff' : colors.textPrimary }]}>
              🎬 Rent Gear (Rentals)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <Input
          placeholder="Search cameras, lenses, lights..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={colors.textSecondary} />}
          style={{ marginBottom: 4 }}
        />

        {/* Category Horizontal Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {GEAR_CATEGORIES.map(cat => (
            <Chip
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Product Cards Grid */}
      <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {products.map(prd => (
            <ProductCard
              key={prd.id}
              product={prd}
              onPress={() => navigation.navigate('ProductDetail', { id: prd.id })}
              onAddToCart={() => {
                addItem(prd);
                setToastMsg(`Added "${prd.name}" to cart!`);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 68,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  cartIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fc8019',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  gridContent: {
    padding: 16,
    paddingBottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
