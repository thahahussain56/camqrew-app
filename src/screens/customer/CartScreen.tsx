import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useCartStore } from '../../store/cartStore';
import { Toast } from '../../components/ui/Toast';
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag } from 'lucide-react-native';
import { TextInput as RNTextInput } from 'react-native';

type CartTab = 'sale' | 'rental';

export const CartScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { items, updateQuantity, removeItem, promoCode, applyPromoCode } = useCartStore();

  const [inputCode, setInputCode] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'>('success');
  const [cartTab, setCartTab] = useState<CartTab>('sale');

  const handleApplyCode = () => {
    if (!inputCode) return;
    const success = applyPromoCode(inputCode);
    if (success) {
      setToastType('success');
      setToastMessage('Promo code applied successfully!');
    } else {
      setToastType('error');
      setToastMessage('Invalid promo code. Try CAMQREW10');
    }
  };

  // ── Separation Based on DB Mapping (Sale vs Rental) ──
  const rentalItems = items.filter(i => i.product.type === 'rental');
  const saleItems = items.filter(i => i.product.type !== 'rental');
  const activeItems = cartTab === 'rental' ? rentalItems : saleItems;

  // ── Subtotal Calculation ──
  const subtotal = activeItems.reduce((acc, item) => {
    if (item.product.type === 'rental') {
      const dailyRate = item.product.rentalPricePerDay || item.product.price;
      const days = item.daysCount || 1;
      return acc + (dailyRate * days * item.quantity);
    }
    return acc + (item.product.price * item.quantity);
  }, 0);

  const discountPercentage = promoCode ? (promoCode === 'CAMQREW10' || promoCode === 'CAMCREW10' ? 10 : promoCode === 'PROPROMO20' ? 20 : 0) : 0;
  const discount = (subtotal * discountPercentage) / 100;
  const tax = Math.round((subtotal - discount) * 0.18);
  const shippingFee = subtotal > 0 && cartTab === 'sale' ? 150 : 0; // Assuming rentals don't have shipping fee or it's handled via pickup
  const total = subtotal > 0 ? (subtotal - discount + tax + shippingFee) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <Toast visible={!!toastMessage} message={toastMessage} type={toastType} onDismiss={() => setToastMessage('')} />

      {/* ── Premium Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Your Cart</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Review your items before checkout</Text>
          </View>
          <View style={[styles.cartIconWrapper, { backgroundColor: colors.surfaceElevated }]}>
            <ShoppingBag size={24} color={colors.textPrimary} />
          </View>
        </View>

        {/* ── DB-Aligned Cart Tabs ── */}
        <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, cartTab === 'sale' && { backgroundColor: colors.surfaceCard }]}
            onPress={() => setCartTab('sale')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, cartTab === 'sale' && { color: colors.textPrimary, fontWeight: '900' }]}>
              📦 Buy Gear ({saleItems.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, cartTab === 'rental' && { backgroundColor: colors.surfaceCard }]}
            onPress={() => setCartTab('rental')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, cartTab === 'rental' && { color: colors.textPrimary, fontWeight: '900' }]}>
              🎬 Rentals ({rentalItems.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 50, marginBottom: 16 }}>🛒</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your Cart is Empty</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {cartTab === 'rental'
                ? 'Ready to shoot? Browse our rental inventory to find the perfect gear.'
                : 'Looking to buy? Browse our marketplace for official and used pro gear.'}
            </Text>
            <TouchableOpacity
              style={[styles.exploreBtn, { backgroundColor: colors.textPrimary }]}
              onPress={() => navigation.navigate('MarketplaceTab')}
            >
              <Text style={[styles.exploreBtnText, { color: colors.background }]}>Explore Marketplace</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Cart Items List ── */}
            <View style={styles.itemsList}>
              {activeItems.map((item, idx) => {
                const isOfficial = item.product.isOfficial || false;
                const isUsed = item.product.isUsed || false;
                const isRental = item.product.isRental || item.product.type === 'rental';

                let badgeText = '';
                let badgeColor = '';
                if (isOfficial) { badgeText = '✨ OFFICIAL'; badgeColor = colors.accent; }
                else if (isUsed) { badgeText = '♻️ PRO USED'; badgeColor = colors.success; }
                else if (isRental) { badgeText = '🎬 RENTAL'; badgeColor = '#7C3AED'; }

                const itemPrice = isRental ? (item.product.rentalPricePerDay || item.product.price) : item.product.price;
                const itemSub = itemPrice * (item.daysCount || 1) * item.quantity;

                return (
                  <View key={`${item.product.id}-${idx}`} style={[styles.itemCard, { backgroundColor: colors.surfaceCard }]}>
                    <View style={styles.itemMainRow}>
                      <View style={[styles.imageWrap, { backgroundColor: colors.surfaceElevated }]}>
                        <Image source={{ uri: item.product.image }} style={styles.itemImg} />
                      </View>
                      <View style={styles.itemDetails}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          {badgeText ? (
                            <View style={[styles.sourceBadge, { backgroundColor: badgeColor }]}>
                              <Text style={styles.sourceBadgeText}>{badgeText}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>{item.product.name}</Text>
                        <Text style={[styles.itemPrice, { color: colors.accent }]}>
                          ₹{itemPrice.toLocaleString('en-IN')}
                          {isRental && <Text style={[styles.perDay, { color: colors.textSecondary }]}> / day × {item.daysCount || 1} day(s)</Text>}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeItem(item.product.id)} style={[styles.trashBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.itemFooterRow, { borderTopColor: colors.border }]}>
                      <View style={[styles.stepperWrap, { backgroundColor: colors.surfaceElevated }]}>
                        <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)} style={[styles.stepBtn, { backgroundColor: colors.surfaceCard }]}>
                          <Minus size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.stepVal, { color: colors.textPrimary }]}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)} style={[styles.stepBtn, { backgroundColor: colors.surfaceCard }]}>
                          <Plus size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.itemSubText, { color: colors.textPrimary }]}>Subtotal: ₹{itemSub.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ── Promo Code Card ── */}
            <View style={[styles.promoCard, { backgroundColor: colors.surfaceCard }]}>
              <View style={[styles.promoInputWrap, { backgroundColor: colors.surfaceElevated }]}>
                <Tag size={16} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                <RNTextInput
                  style={[styles.promoInput, { color: colors.textPrimary }]}
                  placeholder="Enter Promo Code (e.g. CAMQREW10)"
                  placeholderTextColor={colors.textFaint}
                  value={inputCode}
                  onChangeText={setInputCode}
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.textPrimary }]} onPress={handleApplyCode}>
                <Text style={[styles.applyBtnText, { color: colors.background }]}>Apply</Text>
              </TouchableOpacity>
            </View>

            {/* ── Order Summary Card ── */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
              <View style={styles.sumRow}>
                <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.sumVal, { color: colors.textPrimary }]}>₹{subtotal.toLocaleString('en-IN')}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.sumRow}>
                  <Text style={[styles.sumLabel, { color: colors.success }]}>Discount ({promoCode})</Text>
                  <Text style={[styles.sumVal, { color: colors.success }]}>-₹{discount.toLocaleString('en-IN')}</Text>
                </View>
              )}
              {cartTab === 'sale' && (
                <View style={styles.sumRow}>
                  <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>Shipping Fee</Text>
                  <Text style={[styles.sumVal, { color: colors.textPrimary }]}>₹{shippingFee}</Text>
                </View>
              )}
              <View style={styles.sumRow}>
                <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>GST Tax (18%)</Text>
                <Text style={[styles.sumVal, { color: colors.textPrimary }]}>₹{tax.toLocaleString('en-IN')}</Text>
              </View>

              <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Amount</Text>
                <Text style={[styles.totalVal, { color: colors.accent }]}>₹{total.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* ── Checkout Button ── */}
            <TouchableOpacity
              style={styles.checkoutBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(cartTab === 'sale' ? 'SaleCheckout' : 'RentalCheckout')}
            >
              <LinearGradient colors={[colors.accent, colors.accent]} style={styles.checkoutGrad}>
                <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                <ArrowRight size={18} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
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
  cartIconWrapper: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabText: { fontSize: 14, fontWeight: '700' },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  exploreBtn: {
    paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 14,
  },
  exploreBtnText: { fontSize: 14, fontWeight: '800' },

  // Cart Item Card
  itemsList: { marginBottom: 16 },
  itemCard: {
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2,
  },
  itemMainRow: { flexDirection: 'row', alignItems: 'flex-start' },
  imageWrap: {
    width: 72, height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemDetails: { flex: 1, marginLeft: 12 },
  sourceBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  sourceBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  itemName: { fontSize: 15, fontWeight: '800', marginBottom: 4, lineHeight: 20 },
  itemPrice: { fontSize: 15, fontWeight: '900' },
  perDay: { fontSize: 12, fontWeight: '600' },
  trashBtn: { padding: 8, marginLeft: 4, borderRadius: 10 },
  
  itemFooterRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1
  },
  stepperWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 4, paddingVertical: 4
  },
  stepBtn: { padding: 6, borderRadius: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  stepVal: { paddingHorizontal: 12, fontSize: 14, fontWeight: '800' },
  itemSubText: { fontSize: 14, fontWeight: '800' },

  // Promo Card
  promoCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2,
  },
  promoInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, height: 44,
  },
  promoInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '600' },
  applyBtn: { borderRadius: 12, height: 44, paddingHorizontal: 20, justifyContent: 'center', marginLeft: 8 },
  applyBtnText: { fontSize: 13, fontWeight: '800' },

  // Summary Card
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 3,
  },
  summaryTitle: { fontSize: 16, fontWeight: '900', marginBottom: 16 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sumLabel: { fontSize: 14, fontWeight: '500' },
  sumVal: { fontSize: 14, fontWeight: '800' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 16, borderTopWidth: 1
  },
  totalLabel: { fontSize: 16, fontWeight: '900' },
  totalVal: { fontSize: 20, fontWeight: '900' },

  // Checkout Btn
  checkoutBtn: { borderRadius: 16, overflow: 'hidden' },
  checkoutGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, gap: 10 },
  checkoutBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});
