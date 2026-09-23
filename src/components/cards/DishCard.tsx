import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MenuDishItem } from '../../types/professional';
import { Minus, Plus, Clock, UtensilsCrossed } from 'lucide-react-native';

interface DishCardProps {
  dish: MenuDishItem;
  quantity: number;
  onAdjustQty: (delta: number) => void;
  isBaker?: boolean;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  quantity,
  onAdjustQty,
  isBaker = false,
}) => {
  const { colors, isDark } = useTheme();

  const isGreen = dish.dietaryTags?.some(
    t => t === 'Veg' || t === 'Jain' || t === 'Vegan'
  );

  const subtotal = dish.pricePerPlate * quantity;

  return (
    <View
      style={[
        styles.cardOuter,
        { backgroundColor: colors.surfaceCard },
        quantity > 0 && styles.cardOuterSelected,
      ]}
    >
      {/* ── Top Cinematic Image Banner ── */}
      <View style={styles.imageContainer}>
        {dish.imageUrl ? (
          <Image source={{ uri: dish.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholderBox, { backgroundColor: '#13171a' }]}>
            <UtensilsCrossed size={36} color={colors.textFaint} />
          </View>
        )}

        {/* Floating Badges Over Banner */}
        <View style={styles.badgeOverlay}>
          {/* FSSAI Veg / Non-Veg Dot Box */}
          <View style={styles.fssaiBadge}>
            <View style={[styles.vegSymbolBox, { borderColor: isGreen ? '#16a34a' : '#dc2626' }]}>
              <View style={[styles.vegSymbolDot, { backgroundColor: isGreen ? '#16a34a' : '#dc2626' }]} />
            </View>
          </View>

          {/* Category Pill */}
          {dish.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{dish.category}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Floating Overlapping Detail Box ── */}
      <View style={[styles.contentBox, { backgroundColor: isDark ? '#151a1e' : colors.surfaceElevated }]}>
        {/* Dish Title */}
        <Text style={[styles.dishTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {dish.name}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={[styles.priceVal, { color: colors.accent }]}>
            ₹{dish.pricePerPlate.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>
            {dish.unit ? `/ ${dish.unit}` : (isBaker ? '/ kg' : '/ plate')}
          </Text>
        </View>

        {/* Pills Metadata Row (Stroke-Free Design) */}
        <View style={styles.pillsRow}>
          {dish.minQuantity ? (
            <View style={styles.minPill}>
              <Text style={styles.minPillText}>Min {dish.minQuantity}</Text>
            </View>
          ) : null}

          {dish.prepTime ? (
            <View style={styles.prepPill}>
              <Clock size={10} color="#3b82f6" style={{ marginRight: 3 }} />
              <Text style={styles.prepPillText}>Prep: {dish.prepTime}</Text>
            </View>
          ) : null}

          {dish.dietaryTags?.map(tag => {
            const isTagGreen = tag === 'Veg' || tag === 'Jain' || tag === 'Vegan';
            return (
              <View
                key={tag}
                style={[
                  styles.dietPill,
                  { backgroundColor: isTagGreen ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)' },
                ]}
              >
                <Text style={[styles.dietPillText, { color: isTagGreen ? '#22c55e' : '#ef4444' }]}>
                  {tag}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Dish Description */}
        {dish.description ? (
          <Text style={[styles.dishDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}

        {/* Action Row: Soft Translucent Add Button OR Full-width Stepper */}
        <View style={styles.actionRow}>
          {quantity === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onAdjustQty(1)}
              style={[
                styles.addBtn,
                { backgroundColor: isDark ? 'rgba(63, 182, 104, 0.14)' : 'rgba(63, 182, 104, 0.12)' },
              ]}
            >
              <Text style={[styles.addBtnText, { color: colors.accent }]}>ADD +</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedWrapper}>
              <View style={styles.qtyIndicatorBadge}>
                <Text style={[styles.qtyIndicatorText, { color: colors.accent }]}>
                  ✓ {quantity} {dish.unit || (isBaker ? 'kg' : 'plate')}{quantity > 1 ? 's' : ''} (₹{subtotal.toLocaleString('en-IN')})
                </Text>
              </View>
              <View style={[styles.stepperContainer, { backgroundColor: colors.accent }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onAdjustQty(-1)}
                  style={styles.stepperBtn}
                >
                  <Minus size={15} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.stepperVal}>{quantity}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onAdjustQty(1)}
                  style={styles.stepperBtn}
                >
                  <Plus size={15} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 24,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 0,
  },
  cardOuterSelected: {
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 7,
    borderWidth: 0,
  },
  imageContainer: {
    height: 165,
    backgroundColor: '#0c0e12',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  fssaiBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 3,
    borderRadius: 6,
  },
  vegSymbolBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegSymbolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 0,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  contentBox: {
    padding: 15,
    paddingBottom: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -20,
  },
  dishTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  minPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0,
  },
  minPillText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
  },
  prepPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
  },
  prepPillText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '700',
  },
  dietPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0,
  },
  dietPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dishDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  actionRow: {
    marginTop: 4,
    width: '100%',
  },
  addBtn: {
    width: '100%',
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  selectedWrapper: {
    width: '100%',
    gap: 6,
  },
  qtyIndicatorBadge: {
    backgroundColor: 'rgba(63, 182, 104, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 0,
  },
  qtyIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepperContainer: {
    width: '100%',
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderWidth: 0,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  stepperVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
