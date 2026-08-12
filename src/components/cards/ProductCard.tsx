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
  const { colors } = useTheme();

  const specsText = product.specs
    ? Object.entries(product.specs).map(([k, v]) => `${v}`).join(' | ')
    : '50 mm Lens | Charger | 64 GB SD Card';

  return (
    <View style={[styles.cardOuter, { backgroundColor: colors.surfaceCard }, style]}>
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        {/* Top Image Banner */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} />
        </View>

        {/* Bottom Floating Details Box (2-Column Format as Screenshot) */}
        <View style={[styles.contentBox, { backgroundColor: colors.surfaceElevated }]}>
          {/* Green Star + Rating */}
          <View style={styles.ratingRow}>
            <Star size={13} color="#3fb668" fill="#3fb668" style={{ marginRight: 4 }} />
            <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
              {(product.rating || 5.0).toFixed(1)}
            </Text>
          </View>

          {/* Product Title */}
          <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
            {product.name}
          </Text>

          {/* Category */}
          <Text style={[styles.categoryText, { color: colors.textFaint }]}>
            {product.category || 'Camera'}
          </Text>

          {/* Included Accessories / Specs Subtext */}
          <Text style={[styles.specsText, { color: colors.textSecondary }]} numberOfLines={1}>
            {specsText}
          </Text>

          {/* Action Buttons Row: Add 🛒  +  Buy Now */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.background }]}
              onPress={onAddToCart}
              activeOpacity={0.8}
            >
              <Text style={[styles.addBtnText, { color: colors.textSecondary }]}>Add</Text>
              <ShoppingCart size={13} color={colors.textSecondary} style={{ marginLeft: 3 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.buyNowBtn} onPress={onPress} activeOpacity={0.85}>
              <Text style={styles.buyNowBtnText}>
                {product.type === 'rental' ? 'Rent Now' : 'Buy Now'}
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 0,
  },
  imageContainer: {
    height: 135,
    backgroundColor: '#0c0e12',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentBox: {
    padding: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  productName: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  specsText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addBtn: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  buyNowBtn: {
    flex: 1.3,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#3fb668',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});
