import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { orderApi } from '../../api/orderApi';
import { razorpayService } from '../../services/razorpayService';
import { notificationService } from '../../services/notificationService';
import { StepperProgress } from '../../components/ui/StepperProgress';
import { Input } from '../../components/ui/Input';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { Toast } from '../../components/ui/Toast';
import { Truck, Landmark, Smartphone, Lock, ArrowLeft, CreditCard, Banknote } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SALES_STEP_TITLES = ['Shipping Details', 'Delivery', 'Summary', 'Payment'];

export const SaleCheckoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { items, removeItem, promoCode } = useCartStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [orderComplete, setOrderComplete] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Mumbai Suburban');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('400050');
  const [fulfillmentMode, setFulfillmentMode] = useState<'courier' | 'hub'>('courier');
  const [pickupHub, setPickupHub] = useState('Mumbai Central Hub (Andheri East)');

  const [deliveryOption, setDeliveryOption] = useState<'express' | 'standard'>('express');

  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbank' | 'cod' | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const checkoutItems = items.filter(item => item.product.type !== 'rental');
  const canCOD = checkoutItems.every(item => item.product.codEnabled);

  const subtotal = checkoutItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountPercentage = promoCode ? (promoCode === 'CAMCREW10' ? 10 : promoCode === 'PROPROMO20' ? 20 : 0) : 0;
  const discount = (subtotal * discountPercentage) / 100;
  const tax = Math.round((subtotal - discount) * 0.18);
  const isPrime = user?.subscription_tier === 'prime';
  const shippingFee = (deliveryOption === 'express' && !isPrime) ? 150 : 0;
  const total = subtotal > 0 ? (subtotal - discount + tax + shippingFee) : 0;

  const handleNext = () => {
    if (currentStep === 1) {
      if (!fullName || !addressLine1 || !pincode) {
        setToastType('error');
        setToastMessage('Please fill in complete details.');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      if (!selectedMethod) {
        setToastType('error');
        setToastMessage('Please select a payment method.');
        return;
      }
      handleCompleteOrder();
    }
  };

  const handleCompleteOrder = async () => {
    setPaymentProcessing(true);
    setLoading(true);
    try {
      let paymentId = 'COD_ORDER';
      if (selectedMethod !== 'cod') {
        const paymentResult = await razorpayService.openCheckout({
          amount: total,
          description: 'Camcrew Gear Purchase',
          prefill: {
            name: fullName,
            contact: phone,
            email: 'thaha@camcrew.in',
            method: selectedMethod === 'netbank' ? 'netbanking' : (selectedMethod || 'upi'),
          },
        });
        paymentId = paymentResult.razorpay_payment_id;
      }

      const order = await orderApi.createOrder(
        checkoutItems,
        { fullName, phone, addressLine1, state, district, city, pincode },
        subtotal,
        tax,
        total,
        selectedMethod || 'online'
      );

      notificationService.triggerOrderOutForDeliveryNotification(
        order.id,
        checkoutItems[0]?.product?.name || 'Camcrew Equipment'
      );

      checkoutItems.forEach(i => removeItem(i.product.id));

      setOrderComplete(true);
      setToastType('success');
      setToastMessage(selectedMethod === 'cod' ? 'Order Placed Successfully!' : `Payment Success! Tx ID: ${paymentId}`);
      
      setTimeout(() => {
        navigation.replace('OrderDetail', { orderId: order.id });
      }, 1500);

    } catch (e: any) {
      setToastType('error');
      setToastMessage(e.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
      setLoading(false);
    }
  };

  if (checkoutItems.length === 0 && !orderComplete) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary }}>No items for purchase.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Toast visible={!!toastMessage} message={toastMessage} type={toastType} onDismiss={() => setToastMessage('')} />

        <View style={[styles.header, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigation.goBack()} style={[styles.backIcon, { backgroundColor: colors.surfaceElevated }]}>
              <ArrowLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Secure Checkout</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Complete your gear purchase</Text>
            </View>
          </View>
          <StepperProgress totalSteps={4} currentStep={currentStep} stepTitles={SALES_STEP_TITLES} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {currentStep === 1 && (
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Address</Text>
              
              <View style={styles.formSpacing}>
                <Input label="Full Name" value={fullName} onChangeText={setFullName} />
                <Input label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Input label="Street Address / Building" value={addressLine1} onChangeText={setAddressLine1} />
                <Input label="Apartment / Suite (Optional)" value={addressLine2} onChangeText={setAddressLine2} />
                
                <LocationCascader
                  selectedState={state} selectedDistrict={district} selectedCity={city}
                  onSelect={(s, d, c) => { setState(s); setDistrict(d); setCity(c); }}
                />
                <Input label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="numeric" />
              </View>

              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Fulfillment Method</Text>
              <View style={styles.fulfillRow}>
                <TouchableOpacity
                  onPress={() => setFulfillmentMode('courier')}
                  style={[styles.fulfillBox, { backgroundColor: colors.surfaceElevated }, fulfillmentMode === 'courier' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
                >
                  <Truck size={20} color={fulfillmentMode === 'courier' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.fulfillText, { color: colors.textSecondary }, fulfillmentMode === 'courier' && { color: colors.accent, fontWeight: '900' }]}>Doorstep Delivery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFulfillmentMode('hub')}
                  style={[styles.fulfillBox, { backgroundColor: colors.surfaceElevated }, fulfillmentMode === 'hub' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
                >
                  <Landmark size={20} color={fulfillmentMode === 'hub' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.fulfillText, { color: colors.textSecondary }, fulfillmentMode === 'hub' && { color: colors.accent, fontWeight: '900' }]}>Hub Pickup</Text>
                </TouchableOpacity>
              </View>

              {fulfillmentMode === 'hub' && (
                <View style={[styles.hubDetails, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.hubDetailsLabel, { color: colors.textSecondary }]}>SELECTED HUB</Text>
                  <Text style={[styles.hubDetailsVal, { color: colors.textPrimary }]}>📍 {pickupHub}</Text>
                </View>
              )}
            </View>
          )}

          {currentStep === 2 && (
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Delivery Preference</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setDeliveryOption('express')}
                style={[styles.deliveryOption, { backgroundColor: colors.surfaceElevated }, deliveryOption === 'express' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
              >
                <Truck size={24} color={deliveryOption === 'express' ? colors.accent : colors.textSecondary} style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.delTitle, { color: colors.textPrimary }, deliveryOption === 'express' && { color: colors.accent }]}>Express Delivery</Text>
                  <Text style={[styles.delSub, { color: colors.textSecondary }]}>1-2 Business Days</Text>
                </View>
                <Text style={[styles.delPrice, { color: colors.textPrimary }, deliveryOption === 'express' && { color: colors.accent }]}>₹150</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setDeliveryOption('standard')}
                style={[styles.deliveryOption, { backgroundColor: colors.surfaceElevated }, deliveryOption === 'standard' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
              >
                <Truck size={24} color={deliveryOption === 'standard' ? colors.accent : colors.textSecondary} style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.delTitle, { color: colors.textPrimary }, deliveryOption === 'standard' && { color: colors.accent }]}>Standard Delivery</Text>
                  <Text style={[styles.delSub, { color: colors.textSecondary }]}>3-5 Business Days</Text>
                </View>
                <Text style={[styles.delPrice, { color: colors.success }]}>FREE</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 3 && (
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Order Summary</Text>
              <View style={styles.summaryBreakdown}>
                <View style={styles.sumLine}><Text style={[styles.sumLabel, { color: colors.textSecondary }]}>Items ({checkoutItems.length})</Text><Text style={[styles.sumVal, { color: colors.textPrimary }]}>₹{subtotal.toLocaleString('en-IN')}</Text></View>
                {discount > 0 && <View style={styles.sumLine}><Text style={[styles.sumLabel, { color: colors.success }]}>Discount</Text><Text style={[styles.sumVal, { color: colors.success }]}>-₹{discount.toLocaleString('en-IN')}</Text></View>}
                <View style={styles.sumLine}><Text style={[styles.sumLabel, { color: colors.textSecondary }]}>Shipping Fee</Text><Text style={[styles.sumVal, { color: colors.textPrimary }]}>₹{shippingFee}</Text></View>
                <View style={styles.sumLine}><Text style={[styles.sumLabel, { color: colors.textSecondary }]}>Taxes (GST 18%)</Text><Text style={[styles.sumVal, { color: colors.textPrimary }]}>₹{tax.toLocaleString('en-IN')}</Text></View>
                <View style={[styles.totalLine, { borderTopColor: colors.border }]}><Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Grand Total</Text><Text style={[styles.totalVal, { color: colors.accent }]}>₹{total.toLocaleString('en-IN')}</Text></View>
              </View>
              <View style={[styles.shippingPreview, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.shippingPreviewTitle, { color: colors.textSecondary }]}>Shipping To:</Text>
                <Text style={[styles.shippingPreviewAddress, { color: colors.textPrimary }]}>{fullName}, {addressLine1}, {city}, {state} - {pincode}</Text>
              </View>
            </View>
          )}

          {currentStep === 4 && (
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              {paymentProcessing ? (
                <View style={styles.processingWrapper}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={[styles.procTitle, { color: colors.textPrimary }]}>Connecting to Payment Gateway</Text>
                  <Text style={[styles.procSub, { color: colors.textSecondary }]}>Please do not close the app or press back.</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.razorHeader, { backgroundColor: colors.surfaceElevated }]}>
                    <View style={styles.razorBadge}><Text style={styles.razorText}>Secured by Razorpay</Text></View>
                    <Lock size={16} color="#007aff" />
                  </View>

                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Payment Method</Text>

                  <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedMethod('upi')} style={[styles.payCard, { backgroundColor: colors.surfaceElevated }, selectedMethod === 'upi' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
                    <Smartphone size={24} color={selectedMethod === 'upi' ? colors.accent : colors.textSecondary} style={{ marginRight: 16 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.payCardTitle, { color: colors.textPrimary }, selectedMethod === 'upi' && { color: colors.accent }]}>UPI Apps</Text>
                      <Text style={[styles.payCardSub, { color: colors.textSecondary }]}>GPay, PhonePe, Paytm, BHIM</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedMethod('card')} style={[styles.payCard, { backgroundColor: colors.surfaceElevated }, selectedMethod === 'card' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
                    <CreditCard size={24} color={selectedMethod === 'card' ? colors.accent : colors.textSecondary} style={{ marginRight: 16 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.payCardTitle, { color: colors.textPrimary }, selectedMethod === 'card' && { color: colors.accent }]}>Credit or Debit Card</Text>
                      <Text style={[styles.payCardSub, { color: colors.textSecondary }]}>Visa, Mastercard, RuPay, Amex</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedMethod('netbank')} style={[styles.payCard, { backgroundColor: colors.surfaceElevated }, selectedMethod === 'netbank' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
                    <Landmark size={24} color={selectedMethod === 'netbank' ? colors.accent : colors.textSecondary} style={{ marginRight: 16 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.payCardTitle, { color: colors.textPrimary }, selectedMethod === 'netbank' && { color: colors.accent }]}>Net Banking</Text>
                      <Text style={[styles.payCardSub, { color: colors.textSecondary }]}>All major Indian banks</Text>
                    </View>
                  </TouchableOpacity>

                  {canCOD && (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedMethod('cod')} style={[styles.payCard, { backgroundColor: colors.surfaceElevated }, selectedMethod === 'cod' && { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
                      <Banknote size={24} color={selectedMethod === 'cod' ? colors.accent : colors.textSecondary} style={{ marginRight: 16 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.payCardTitle, { color: colors.textPrimary }, selectedMethod === 'cod' && { color: colors.accent }]}>Cash on Delivery</Text>
                        <Text style={[styles.payCardSub, { color: colors.textSecondary }]}>Pay when you receive the gear</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <View style={[styles.paySummary, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.paySumTitle, { color: colors.textPrimary }]}>Total to Pay: ₹{total.toLocaleString('en-IN')}</Text>
                  </View>
                </>
              )}
            </View>
          )}

        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.surfaceCard, borderTopColor: colors.border }]}>
          {!paymentProcessing && (
            <TouchableOpacity
              style={styles.continueBtn}
              activeOpacity={0.85}
              onPress={handleNext}
            >
              <LinearGradient colors={[colors.accent, colors.accent]} style={styles.continueGrad}>
                <Text style={styles.continueBtnText}>
                  {currentStep === 4 ? `Pay securely ₹${total.toLocaleString('en-IN')}` : 'Continue to Next Step'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  
  scrollContent: { padding: 16, paddingBottom: 120 },
  cardBox: {
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  formSpacing: { gap: 12, marginBottom: 20 },

  fulfillRow: { flexDirection: 'row', gap: 12 },
  fulfillBox: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  fulfillText: { marginTop: 8, fontSize: 13, fontWeight: '700' },
  hubDetails: { marginTop: 16, padding: 16, borderRadius: 16 },
  hubDetailsLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  hubDetailsVal: { fontSize: 14, fontWeight: '900' },

  deliveryOption: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: 'transparent', marginBottom: 12 },
  delTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  delSub: { fontSize: 13, fontWeight: '600' },
  delPrice: { fontSize: 16, fontWeight: '900' },

  summaryBreakdown: { marginBottom: 20 },
  sumLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel: { fontSize: 14, fontWeight: '600' },
  sumVal: { fontSize: 14, fontWeight: '800' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 16, borderTopWidth: 1 },
  totalLabel: { fontSize: 16, fontWeight: '900' },
  totalVal: { fontSize: 20, fontWeight: '900' },
  shippingPreview: { borderRadius: 16, padding: 16 },
  shippingPreviewTitle: { fontSize: 12, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' },
  shippingPreviewAddress: { fontSize: 14, fontWeight: '700', lineHeight: 22 },

  processingWrapper: { alignItems: 'center', paddingVertical: 40 },
  procTitle: { fontSize: 16, fontWeight: '900', marginTop: 20, marginBottom: 6 },
  procSub: { fontSize: 13, fontWeight: '500' },

  razorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: 12, borderRadius: 12 },
  razorBadge: { backgroundColor: '#007aff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  razorText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  
  payCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', marginBottom: 12 },
  payCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  payCardSub: { fontSize: 13, fontWeight: '500' },
  
  paySummary: { marginTop: 12, padding: 16, borderRadius: 16, alignItems: 'center' },
  paySumTitle: { fontSize: 16, fontWeight: '900' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 40, borderTopWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: -4 }, shadowRadius: 10, elevation: 10 },
  continueBtn: { height: 60, borderRadius: 20, overflow: 'hidden' },
  continueGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});
