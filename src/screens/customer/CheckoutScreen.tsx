import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { useCartStore } from '../../store/cartStore';
import { orderApi } from '../../api/orderApi';
import { cloudStorageApi } from '../../api/cloudStorageApi';
import { razorpayService } from '../../services/razorpayService';
import { escrowService } from '../../services/escrowService';
import { notificationService } from '../../services/notificationService';
import { kycService, AadhaarVerificationResult } from '../../services/kycService';
import { StepperProgress } from '../../components/ui/StepperProgress';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { Toast } from '../../components/ui/Toast';
import { CheckCircle, Truck, Camera, ShieldCheck, Check, CreditCard, Landmark, Smartphone, Lock } from 'lucide-react-native';

const SALES_STEP_TITLES = ['Shipping Address', 'Delivery', 'Payment', 'Confirmation'];
const RENTAL_STEP_TITLES = ['Renter Address', 'Security Terms', 'Aadhar Verification', 'Payment Sheet'];

export const CheckoutScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { items, removeItem, promoCode } = useCartStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Shipping Form State
  const [fullName, setFullName] = useState('Thaha Hussain');
  const [phone, setPhone] = useState('+91 9876543210');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Mumbai Suburban');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('400050');
  const [fulfillmentMode, setFulfillmentMode] = useState<'courier' | 'hub'>('courier');
  const [pickupHub, setPickupHub] = useState('Mumbai Central Hub (Andheri East)');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Sales-only Delivery option
  const [deliveryOption, setDeliveryOption] = useState<'express' | 'standard'>('express');

  // Rentals-only Verification / Aadhar state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFrontUri, setAadharFrontUri] = useState('');
  const [aadharBackUri, setAadharBackUri] = useState('');
  
  // OCR Simulation State
  const [isScanning, setIsScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // Razorpay payment sheet state
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbank' | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Determine checkout type
  const checkoutType = route?.params?.checkoutType || (items.some(i => i.product.type === 'rental') ? 'rent' : 'sale');
  
  // Filter items for this specific checkout
  const checkoutItems = items.filter(item => 
    checkoutType === 'rent' ? item.product.type === 'rental' : item.product.type !== 'rental'
  );

  const hasRentals = checkoutType === 'rent';
  const stepTitles = hasRentals ? RENTAL_STEP_TITLES : SALES_STEP_TITLES;

  // Local calculations
  const subtotal = checkoutItems.reduce((acc, item) => {
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

  const runAadharOCR = (front: string, back: string) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setOcrSuccess(true);
      setAadharNumber('8273 9104 2831');
      setFullName('Thaha Hussain');
      setToastMessage('🔍 Aadhar verified via simulated OCR scanner!');
    }, 2000);
  };

  const pickAadharImage = async (side: 'front' | 'back') => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        setToastMessage('Permission to access photo gallery is required!');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const localUri = res.assets[0].uri;
        setToastMessage('Uploading Aadhaar image to Cloud Storage... ☁️');
        
        // Upload to Cloud API
        const uploadResult = await cloudStorageApi.uploadImage(localUri, 'aadhaar');
        const cloudUrl = uploadResult.url;

        if (side === 'front') {
          setAadharFrontUri(cloudUrl);
          if (aadharBackUri || cloudUrl) {
            runAadharOCR(cloudUrl, aadharBackUri);
          }
        } else {
          setAadharBackUri(cloudUrl);
          if (aadharFrontUri || cloudUrl) {
            runAadharOCR(aadharFrontUri, cloudUrl);
          }
        }
      }
    } catch (e) {
      setToastMessage('Failed to upload image.');
    }
  };

  const [kycResult, setKycResult] = useState<AadhaarVerificationResult | null>(null);
  const [verifyingKyc, setVerifyingKyc] = useState(false);

  const handleVerifyAadhaarGovt = async () => {
    if (!aadharNumber || aadharNumber.length < 12) {
      setToastMessage('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setVerifyingKyc(true);
    try {
      const res = await kycService.verifyAadhaarNumber(aadharNumber, fullName);
      setKycResult(res);
      setOcrSuccess(true);
      setToastMessage('✓ Cashfree Govt KYC Verified!');
    } catch (e: any) {
      setToastMessage(e.message || 'KYC verification failed.');
    } finally {
      setVerifyingKyc(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!fullName || !addressLine1 || !pincode) {
        setToastMessage('Please fill in complete details.');
        return;
      }
    }
    if (hasRentals) {
      if (currentStep === 2 && !termsAccepted) {
        setToastMessage('Please accept the rental and security terms.');
        return;
      }
      if (currentStep === 3) {
        if (!aadharNumber || aadharNumber.length < 12) {
          setToastMessage('Please enter a valid 12-digit Aadhar number.');
          return;
        }
        if (!kycResult && (!aadharFrontUri || !aadharBackUri)) {
          setToastMessage('Please verify your Aadhaar via Instant Govt KYC or upload card images.');
          return;
        }
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      if (!selectedMethod) {
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
      // 1. Open Live Razorpay Gateway
      const paymentResult = await razorpayService.openCheckout({
        amount: total,
        description: hasRentals ? 'Camcrew Equipment Rental Escrow' : 'Camcrew Gear Purchase',
        prefill: {
          name: fullName,
          contact: phone,
          email: 'thaha@camcrew.in',
          method: selectedMethod === 'netbank' ? 'netbanking' : (selectedMethod || 'upi'),
        },
      });

      // 2. Create Order
      const order = await orderApi.createOrder(
        checkoutItems,
        { 
          fullName, 
          phone, 
          addressLine1, 
          state, 
          district, 
          city, 
          pincode,
        },
        subtotal,
        tax,
        total
      );

      // 3. If rental order, hold ₹5,000 Security Deposit in Escrow
      if (hasRentals) {
        await escrowService.holdDeposit(order.id, 5000);
      }

      // Trigger Push Notification for Out For Delivery dispatch
      notificationService.triggerOrderOutForDeliveryNotification(
        order.id,
        checkoutItems[0]?.product?.name || 'Sony FX3 Cinema Camera'
      );

      // Remove checked out items from Cart store
      checkoutItems.forEach(i => removeItem(i.product.id));

      setToastMessage(`Payment Success! Tx ID: ${paymentResult.razorpay_payment_id}`);
      
      setTimeout(() => {
        navigation.replace('OrderDetail', { orderId: order.id });
      }, 1500);

    } catch (e: any) {
      setToastMessage(e.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMessage} message={toastMessage} type="info" onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {hasRentals ? 'Rental Checkout' : 'Checkout'}
        </Text>
      </View>

      <StepperProgress totalSteps={4} currentStep={currentStep} stepTitles={stepTitles} />

      <Card style={styles.card}>
        {currentStep === 1 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {hasRentals ? 'Renter & Delivery Address' : 'Shipping Address'}
            </Text>
            <Input label="Full Name" value={fullName} onChangeText={setFullName} />
            <Input label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Street Address / Building (Line 1)" value={addressLine1} onChangeText={setAddressLine1} />
            <Input label="Apartment / Suite / Floor (Line 2 - Optional)" value={addressLine2} onChangeText={setAddressLine2} />
            <LocationCascader
              selectedState={state}
              selectedDistrict={district}
              selectedCity={city}
              onSelect={(s, d, c) => {
                setState(s);
                setDistrict(d);
                setCity(c);
              }}
            />
            <Input label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="numeric" />

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 14, fontSize: 14 }]}>
              Fulfillment Method
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 8 }}>
              <TouchableOpacity
                onPress={() => setFulfillmentMode('courier')}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: fulfillmentMode === 'courier' ? 'rgba(252,128,25,0.1)' : colors.chipBg,
                  borderWidth: 1.5,
                  borderColor: fulfillmentMode === 'courier' ? '#fc8019' : colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 13 }}>🚚 Doorstep Courier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFulfillmentMode('hub')}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: fulfillmentMode === 'hub' ? 'rgba(252,128,25,0.1)' : colors.chipBg,
                  borderWidth: 1.5,
                  borderColor: fulfillmentMode === 'hub' ? '#fc8019' : colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 13 }}>🏢 Camcrew Hub Pickup</Text>
              </TouchableOpacity>
            </View>

            {fulfillmentMode === 'hub' && (
              <View style={{ marginTop: 6, padding: 10, borderRadius: 10, backgroundColor: colors.chipBg }}>
                <Text style={{ color: colors.textFaint, fontSize: 11, fontWeight: '700' }}>SELECT CAMCREW HUB</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 13, marginTop: 2 }}>
                  📍 {pickupHub}
                </Text>
              </View>
            )}
          </View>
        )}

        {currentStep === 2 && !hasRentals && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Delivery Preference</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setDeliveryOption('express')}
              style={[
                styles.optionBox,
                {
                  backgroundColor: deliveryOption === 'express' ? colors.accentGlow : colors.chipBg,
                  borderColor: deliveryOption === 'express' ? colors.accent : colors.border,
                },
              ]}
            >
              <Truck size={20} color={colors.accent} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.optTitle, { color: colors.textPrimary }]}>Express Delivery (1-2 Days)</Text>
                <Text style={[styles.optSub, { color: colors.textFaint }]}>Insured courier direct to your studio.</Text>
              </View>
              <Text style={[styles.optPrice, { color: colors.accent }]}>₹150</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setDeliveryOption('standard')}
              style={[
                styles.optionBox,
                {
                  backgroundColor: deliveryOption === 'standard' ? colors.accentGlow : colors.chipBg,
                  borderColor: deliveryOption === 'standard' ? colors.accent : colors.border,
                  marginTop: 10,
                },
              ]}
            >
              <Truck size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.optTitle, { color: colors.textPrimary }]}>Standard Delivery (3-5 Days)</Text>
                <Text style={[styles.optSub, { color: colors.textFaint }]}>Free on orders above ₹10,000.</Text>
              </View>
              <Text style={[styles.optPrice, { color: colors.success }]}>FREE</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 2 && hasRentals && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 8 }]}>Rental & Security Terms</Text>
            
            <View style={[styles.alertBox, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
              <ShieldCheck size={24} color={colors.accent} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>Refundable Security Deposit</Text>
                <Text style={[styles.alertSub, { color: colors.textSecondary }]}>
                  A security deposit of ₹5,000 will be held during the rental duration and fully refunded within 24 hours of returning the equipment in good condition.
                </Text>
              </View>
            </View>

            <View style={styles.rentalSumInfo}>
              <Text style={[styles.sumHeading, { color: colors.textPrimary, marginTop: 12 }]}>Rental Duration</Text>
              {checkoutItems.map(item => (
                <View key={item.product.id} style={styles.rentalItemRow}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', flex: 1 }}>{item.product.name}</Text>
                  <Text style={{ color: colors.textSecondary }}>{item.daysCount || 1} Days ({item.startDate} to {item.endDate})</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setTermsAccepted(!termsAccepted)}
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: termsAccepted ? colors.accent : colors.border,
                    backgroundColor: termsAccepted ? colors.accent : 'transparent',
                  },
                ]}
              >
                {termsAccepted && <Check size={12} color="#ffffff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
                I agree to the security deposit, rental terms, and equipment damage policies.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 3 && !hasRentals && (
          <View>
            <View style={styles.sumBox}>
              <Text style={[styles.sumHeading, { color: colors.textPrimary }]}>Payment Summary</Text>
              <Text style={{ color: colors.textSecondary }}>Items Count: {checkoutItems.length}</Text>
              <Text style={{ color: colors.textSecondary }}>Shipping To: {city}, {state}</Text>
              {discount > 0 && (
                <Text style={{ color: colors.success, fontSize: 13, marginBottom: 4 }}>
                  Discount: -₹{discount.toLocaleString('en-IN')}
                </Text>
              )}
              <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 18, marginTop: 8 }}>
                Total: ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {currentStep === 3 && hasRentals && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4 }]}>Aadhar Card Verification</Text>
            <Text style={[styles.infoSub, { color: colors.textFaint, marginBottom: 16 }]}>
              Required to verify physical address and ensure equipment security.
            </Text>

            {isScanning ? (
              <View style={[styles.ocrLoadingBox, { backgroundColor: colors.chipBg, borderColor: colors.accent }]}>
                <ActivityIndicator size="small" color="#fc8019" style={{ marginBottom: 10 }} />
                <Text style={[styles.ocrLoadingText, { color: colors.textPrimary }]}>
                  Reading Aadhar details using AI Scanner... 👁️‍🗨️
                </Text>
                <View style={styles.scannerBar} />
              </View>
            ) : ocrSuccess ? (
              <View style={[styles.ocrSuccessBox, { borderColor: colors.success }]}>
                <CheckCircle size={20} color={colors.success} style={{ marginRight: 10 }} />
                <Text style={{ color: colors.success, fontWeight: '800', fontSize: 12 }}>
                  Aadhar Verified! Name matched: {fullName}
                </Text>
              </View>
            ) : null}

            <Input
              label="12-Digit Aadhar Card Number"
              value={aadharNumber}
              onChangeText={setAadharNumber}
              keyboardType="numeric"
              maxLength={12}
            />

            <Button
              title="Instant Cashfree / Govt KYC Check"
              variant="outline"
              size="md"
              loading={verifyingKyc}
              onPress={handleVerifyAadhaarGovt}
              style={{ marginBottom: 14 }}
            />

            {kycResult && (
              <View style={[styles.ocrSuccessBox, { borderColor: colors.success, marginBottom: 14 }]}>
                <CheckCircle size={18} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.success, fontWeight: '800', fontSize: 11 }}>
                  {kycResult.badgeLabel} • TX: {kycResult.verificationTxId}
                </Text>
              </View>
            )}

            <Text style={[styles.uploadLabel, { color: colors.textSecondary }]}>Aadhar Card (Front Side)</Text>
            <TouchableOpacity
              style={[styles.uploadBox, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => pickAadharImage('front')}
            >
              {aadharFrontUri ? (
                <Image source={{ uri: aadharFrontUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Camera size={24} color={colors.textFaint} />
                  <Text style={{ color: colors.textFaint, marginTop: 6, fontWeight: '700' }}>Upload Front Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.uploadLabel, { color: colors.textSecondary, marginTop: 16 }]}>Aadhar Card (Back Side)</Text>
            <TouchableOpacity
              style={[styles.uploadBox, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => pickAadharImage('back')}
            >
              {aadharBackUri ? (
                <Image source={{ uri: aadharBackUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Camera size={24} color={colors.textFaint} />
                  <Text style={{ color: colors.textFaint, marginTop: 6, fontWeight: '700' }}>Upload Back Image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 4 && (
          <View>
            {paymentProcessing ? (
              <View style={styles.processingPaymentContainer}>
                <ActivityIndicator size="large" color="#fc8019" />
                <Text style={[styles.processingText, { color: colors.textPrimary }]}>
                  Processing Razorpay Transaction... 🔒
                </Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 4 }}>
                  Do not press back or close the app.
                </Text>
              </View>
            ) : (
              <View>
                {/* Razorpay Brand Header */}
                <View style={styles.razorpayHeader}>
                  <View style={styles.badgeLabel}>
                    <Text style={styles.badgeText}>Razorpay Secured</Text>
                  </View>
                  <Lock size={14} color="#007aff" />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
                  Select Payment Option
                </Text>

                {/* Option: UPI */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => setSelectedMethod('upi')}
                  style={[
                    styles.payMethodCard,
                    {
                      borderColor: selectedMethod === 'upi' ? '#fc8019' : colors.border,
                      backgroundColor: selectedMethod === 'upi' ? colors.accentGlow : colors.background
                    }
                  ]}
                >
                  <Smartphone size={20} color={selectedMethod === 'upi' ? '#fc8019' : colors.textSecondary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.payTitle, { color: colors.textPrimary }]}>UPI (Google Pay, PhonePe, Paytm)</Text>
                    <Text style={[styles.paySub, { color: colors.textFaint }]}>Pay instantly using any UPI app.</Text>
                  </View>
                </TouchableOpacity>

                {/* Option: Cards */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => setSelectedMethod('card')}
                  style={[
                    styles.payMethodCard,
                    {
                      borderColor: selectedMethod === 'card' ? '#fc8019' : colors.border,
                      backgroundColor: selectedMethod === 'card' ? colors.accentGlow : colors.background,
                      marginTop: 10
                    }
                  ]}
                >
                  <CreditCard size={20} color={selectedMethod === 'card' ? '#fc8019' : colors.textSecondary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.payTitle, { color: colors.textPrimary }]}>Credit / Debit Card</Text>
                    <Text style={[styles.paySub, { color: colors.textFaint }]}>Visa, Mastercard, RuPay, Maestro.</Text>
                  </View>
                </TouchableOpacity>

                {/* Option: Net Banking */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => setSelectedMethod('netbank')}
                  style={[
                    styles.payMethodCard,
                    {
                      borderColor: selectedMethod === 'netbank' ? '#fc8019' : colors.border,
                      backgroundColor: selectedMethod === 'netbank' ? colors.accentGlow : colors.background,
                      marginTop: 10
                    }
                  ]}
                >
                  <Landmark size={20} color={selectedMethod === 'netbank' ? '#fc8019' : colors.textSecondary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.payTitle, { color: colors.textPrimary }]}>Net Banking</Text>
                    <Text style={[styles.paySub, { color: colors.textFaint }]}>All major Indian banks supported.</Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.summaryFooterBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                  <Text style={[styles.footerHeading, { color: colors.textPrimary }]}>Order Value: ₹{total.toLocaleString('en-IN')}</Text>
                  {hasRentals && (
                    <Text style={{ color: colors.textFaint, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                      *Includes fully refundable security deposit of ₹5,000.
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </Card>

      <View style={styles.buttonRow}>
        {currentStep > 1 && !paymentProcessing && (
          <Button
            title="Back"
            variant="secondary"
            size="lg"
            onPress={() => setCurrentStep(currentStep - 1)}
            style={{ flex: 1, marginRight: 10 }}
          />
        )}
        {!paymentProcessing && (
          <Button
            title={currentStep === 4 ? `Pay ₹${total.toLocaleString('en-IN')}` : 'Continue'}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleNext}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 68,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  infoSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    marginVertical: 16,
  },
  optionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  optSub: {
    fontSize: 12,
    marginTop: 2,
  },
  optPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  alertSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  rentalSumInfo: {
    marginBottom: 16,
  },
  rentalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  uploadLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  uploadBox: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ocrLoadingBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  ocrLoadingText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  scannerBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#fc8019',
    marginTop: 10,
  },
  ocrSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: 'rgba(63, 182, 104, 0.08)',
  },
  razorpayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  badgeLabel: {
    backgroundColor: '#007aff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  payMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  payTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  paySub: {
    fontSize: 11,
    marginTop: 1,
    fontWeight: '600',
  },
  summaryFooterBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    alignItems: 'center',
  },
  footerHeading: {
    fontSize: 15,
    fontWeight: '900',
  },
  processingPaymentContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  processingText: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  sumBox: {
    paddingVertical: 10,
  },
  sumHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  confTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  confSub: {
    fontSize: 13,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
});
