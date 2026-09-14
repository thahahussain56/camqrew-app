import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Product } from '../../types/product';
import { Star, ShoppingCart } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  style?: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onAddToCart, style }) => {
  const { colors, isDark } = useTheme();

  const specsText = product.specs && Object.keys(product.specs).length > 0
    ? Object.entries(product.specs).map(([k, v]) => `${v}`).join(' | ')
    : '50 mm Lens | Charger';

  // Determine styling based on DB source
  const isOfficial = product.brand === 'Camcrew Official';
  const isUsed = product.brand === 'Used Gear';
  const isRental = product.type === 'rental';

  let badgeText = '';
  let badgeColor = '';
  if (isOfficial) {
    badgeText = 'OFFICIAL';
    badgeColor = '#3fb668'; // Match Camcrew primary
  } else if (isUsed) {
    badgeText = 'PRO USED';
    badgeColor = '#3fb668'; // Match ProCard success green
  } else if (isRental) {
    badgeText = 'RENTAL';
    badgeColor = '#7C3AED'; 
  }

  return (
    <View style={[styles.cardOuter, { backgroundColor: colors.surfaceCard }, style]}>
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        
        {/* ── Top Image Banner ── */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} />
          
          {badgeText ? (
            <View style={[styles.sourceBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.sourceBadgeText}>{badgeText}</Text>
            </View>
          ) : null}

          {!product.inStock && (
            <View style={[styles.stockBadge, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.stockBadgeText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* ── Bottom Floating Content Box (Matches ProCard Overlap Layout) ── */}
        <View style={[styles.contentBox, { backgroundColor: isDark ? '#151a1e' : colors.surfaceElevated }]}>
          
          <View style={styles.headerInfoRow}>
            <View style={styles.nameContainer}>
              {/* Green Star + Rating (Matched from ProCard) */}
              <View style={styles.ratingRow}>
                <Star size={12} color="#3fb668" fill="#3fb668" style={{ marginRight: 4 }} />
                <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                  {(product.rating || 5.0).toFixed(1)}
                </Text>
              </View>

              <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
                {product.name}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.categoryText, { color: colors.textFaint }]}>
            {product.category || 'Camera Gear'}
          </Text>

          <Text style={[styles.specsText, { color: colors.textSecondary }]} numberOfLines={1}>
            {specsText}
          </Text>

          <Text style={[styles.priceText, { color: colors.textPrimary }]}>
            ₹{product.price.toLocaleString('en-IN')}
            {isRental ? <Text style={[styles.pricePer, { color: colors.textFaint }]}> / day</Text> : ''}
          </Text>

          {/* Action Buttons Row */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: isDark ? '#2c2f34' : colors.background }]}
              onPress={onAddToCart}
              activeOpacity={0.8}
              disabled={!product.inStock}
            >
              <Text style={[styles.addBtnText, { color: colors.textSecondary }]}>Add</Text>
              <ShoppingCart size={13} color={colors.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buyNowBtn, !product.inStock && { opacity: 0.5 }]}
              onPress={onPress}
              activeOpacity={0.85}
              disabled={!product.inStock}
            >
              <Text style={styles.buyNowBtnText}>
                {isRental ? 'Rent' : 'Buy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    width: '48%',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 0,
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#0c0e12',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  sourceBadge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  sourceBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  stockBadge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  
  // Overlapping Content Box exactly like ProCard
  contentBox: { 
    padding: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  ratingText: { fontSize: 12, fontWeight: '800' },
  productName: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  categoryText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  specsText: { fontSize: 10, fontWeight: '500', marginTop: 4, marginBottom: 8 },
  priceText: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
  pricePer: { fontSize: 10, fontWeight: '600' },
  
  buttonsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: {
    flex: 1, height: 36, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 12, fontWeight: '800' },
  buyNowBtn: { 
    flex: 1.2, height: 36, borderRadius: 12, 
    backgroundColor: '#3fb668', // Exact green from ProCard
    alignItems: 'center', justifyContent: 'center',
  },
  buyNowBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
