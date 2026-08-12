import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Toast } from '../../components/ui/Toast';
import { Trash2, Plus, Minus, Tag, ArrowRight } from 'lucide-react-native';

export const CartScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    items,
    updateQuantity,
    removeItem,
    promoCode,
    applyPromoCode,
  } = useCartStore();

  const [inputCode, setInputCode] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Cart type state: 'rent' or 'sale'
  const [cartType, setCartType] = useState<'rent' | 'sale'>('rent');

  const handleApplyCode = () => {
    if (!inputCode) return;
    const success = applyPromoCode(inputCode);
    if (success) {
      setToastMessage('Promo code applied successfully!');
    } else {
      setToastMessage('Invalid promo code. Try CAMCREW10');
    }
  };

  // Separate items
  const rentalItems = items.filter(i => i.product.type === 'rental');
  const saleItems = items.filter(i => i.product.type !== 'rental');
  const activeItems = cartType === 'rent' ? rentalItems : saleItems;

  // Local calculations for active items only
  const subtotal = activeItems.reduce((acc, item) => {
    if (item.product.type === 'rental') {
      const dailyRate = item.product.rentalPricePerDay || item.product.price;
      const days = item.daysCount || 1;
      return acc + (dailyRate * days * item.quantity);
    }
    return acc + (item.product.price * item.quantity);
  }, 0);

  const discountPercentage = promoCode ? (promoCode === 'CAMCREW10' ? 10 : promoCode === 'PROPROMO20' ? 20 : 0) : 0;
  const discount = (subtotal * discountPercentage) / 100;
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = subtotal > 0 ? (subtotal - discount + tax + 150) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Shopping Cart</Text>
      </View>

      {/* Cart Mode Toggle Selector */}
      <View style={[styles.toggleRow, { backgroundColor: colors.surfaceCard }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.toggleBtn, cartType === 'rent' && { backgroundColor: '#fc8019' }]}
          onPress={() => setCartType('rent')}
        >
          <Text style={[styles.toggleBtnText, { color: cartType === 'rent' ? '#ffffff' : colors.textSecondary }]}>
            Rental Cart ({rentalItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.toggleBtn, cartType === 'sale' && { backgroundColor: '#fc8019' }]}
          onPress={() => setCartType('sale')}
        >
          <Text style={[styles.toggleBtnText, { color: cartType === 'sale' ? '#ffffff' : colors.textSecondary }]}>
            Buy Cart ({saleItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      <Toast visible={!!toastMessage} message={toastMessage} type="info" onDismiss={() => setToastMessage('')} />

      {activeItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {cartType === 'rent' ? 'Rental cart is empty' : 'Buy cart is empty'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {cartType === 'rent'
              ? 'Browse our gear marketplace to rent cinema cameras, lenses, and lighting.'
              : 'Browse our marketplace to purchase brand new or certified used equipment.'}
          </Text>
          <Button
            title="Explore Gear Marketplace"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('MarketplaceTab')}
            style={{ marginTop: 20 }}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cart Item Cards */}
          {activeItems.map((item, idx) => (
            <Card key={idx} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Image source={{ uri: item.product.image }} style={styles.itemImage} />
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemBrand, { color: colors.textFaint }]}>{item.product.brand}</Text>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.accent }]}>
                    ₹{(item.product.rentalPricePerDay || item.product.price).toLocaleString('en-IN')}
                    {item.product.type === 'rental' && <Text style={{ fontSize: 11, color: colors.textFaint }}> / day</Text>}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => removeItem(item.product.id)} style={styles.trashBtn}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>

              <View style={styles.itemFooter}>
                <View style={[styles.stepper, { backgroundColor: colors.chipBg, borderColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    style={styles.stepBtn}
                  >
                    <Minus size={14} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.stepVal, { color: colors.textPrimary }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    style={styles.stepBtn}
                  >
                    <Plus size={14} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.itemSubtotal, { color: colors.textPrimary }]}>
                  Subtotal: ₹
                  {(
                    (item.product.rentalPricePerDay || item.product.price) *
                    (item.daysCount || 1) *
                    item.quantity
                  ).toLocaleString('en-IN')}
                </Text>
              </View>
            </Card>
          ))}

          {/* Promo Code Input */}
          <Card style={styles.promoCard}>
            <View style={styles.promoRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Promo Code (CAMCREW10)"
                  value={inputCode}
                  onChangeText={setInputCode}
                  leftIcon={<Tag size={16} color={colors.textSecondary} />}
                />
              </View>
              <Button title="Apply" variant="outline" size="md" onPress={handleApplyCode} style={{ marginLeft: 8, height: 48 }} />
            </View>
          </Card>

          {/* Summary Breakdown */}
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
            <View style={styles.sumRow}>
              <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>₹{subtotal.toLocaleString('en-IN')}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.sumRow}>
                <Text style={{ color: colors.success }}>Discount ({promoCode})</Text>
                <Text style={{ color: colors.success, fontWeight: '700' }}>-₹{discount.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={styles.sumRow}>
              <Text style={{ color: colors.textSecondary }}>Shipping Fee</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>₹150</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={{ color: colors.textSecondary }}>GST Tax (18%)</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>₹{tax.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.sumRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>Total Amount</Text>
              <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 20 }}>₹{total.toLocaleString('en-IN')}</Text>
            </View>
          </Card>

          <Button
            title="Proceed to Checkout"
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color="#000000" />}
            onPress={() => navigation.navigate('Checkout', { checkoutType: cartType })}
            style={{ marginVertical: 20 }}
          />
        </ScrollView>
      )}
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    paddingBottom: 120,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#0a0d12',
  },
  itemMeta: {
    flex: 1,
    marginLeft: 12,
  },
  itemBrand: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  trashBtn: {
    padding: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  stepBtn: {
    padding: 8,
  },
  stepVal: {
    paddingHorizontal: 12,
    fontWeight: '700',
    fontSize: 13,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  promoCard: {
    marginBottom: 12,
    padding: 12,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
});
