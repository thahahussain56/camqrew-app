import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { productApi } from '../../api/productApi';
import { Product } from '../../types/product';
import { useCartStore } from '../../store/cartStore';
import { Toast } from '../../components/ui/Toast';
import { Calendar, ChevronDown, Flag, Heart, MapPin, Search, ShieldCheck, ShoppingCart, Star, Truck, X, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DatePickerModal } from '../../components/ui/DatePickerModal';

const { width } = Dimensions.get('window');

const SpecRow = ({ label, value, colors, isWarning }: { label: string, value: string, colors: any, isWarning?: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 }}>
    <Text style={{ color: colors.textSecondary, width: 120, fontSize: 14 }}>{label}</Text>
    <Text style={{ color: isWarning ? colors.danger : colors.textPrimary, flex: 1, fontSize: 14, fontWeight: isWarning ? '500' : 'normal' }}>{value}</Text>
  </View>
);

export const ProductDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { addItem } = useCartStore();
  const productId = route?.params?.id || 'prd_1';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Rental Date Selection State
  const [fromDate, setFromDate] = useState('24/08/2026');
  const [toDate, setToDate] = useState('27/08/2026');
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    productApi.getProductById(productId)
      .then(setProduct)
      .catch(() => {
        setToastType('error');
        setToastMessage('Failed to load product details.');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Product Not Found</Text>
        <TouchableOpacity style={{ padding: 12, backgroundColor: colors.surfaceCard, borderRadius: 8 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.textPrimary }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOfficial = product.isOfficial || false;
  const isUsed = product.isUsed || false;
  const isRental = product.isRental || product.type === 'rental';

  let badgeText = '';
  let badgeColor = '';
  if (isOfficial) { badgeText = '✨ OFFICIAL'; badgeColor = colors.accent; }
  else if (isUsed) { badgeText = '♻️ PRO USED'; badgeColor = colors.success; }
  else if (isRental) { badgeText = '🎬 RENTAL'; badgeColor = '#7C3AED'; }

  const allImages = product.gallery && product.gallery.length > 0 ? [product.image, ...product.gallery] : [product.image];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setActiveImageIndex(index);
  };

  const handleAddToCart = () => {
    if (isRental) {
      let days = 1;
      try {
        const [fromD, fromM, fromY] = fromDate.split('/').map(Number);
        const [toD, toM, toY] = toDate.split('/').map(Number);
        const start = new Date(fromY, fromM - 1, fromD);
        const end = new Date(toY, toM - 1, toD);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        days = diffDays > 0 ? diffDays : 1;
      } catch (e) {
        days = 3;
      }
      addItem(product, 1, fromDate, toDate, days);
      setToastMessage(`Added rental equipment for ${days} days!`);
    } else {
      addItem(product);
      setToastMessage('Added to cart!');
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      navigation.navigate('Cart');
    }, 500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Toast visible={!!toastMessage} message={toastMessage} type={toastType} onDismiss={() => setToastMessage('')} />
      <DatePickerModal visible={showFromModal} onClose={() => setShowFromModal(false)} onSelectDate={setFromDate} selectedDate={fromDate} title="Rental Start Date" />
      <DatePickerModal visible={showToModal} onClose={() => setShowToModal(false)} onSelectDate={setToDate} selectedDate={toDate} title="Rental End Date" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── Image Header ── */}
        <View style={styles.imageWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          >
            {allImages.map((uri, idx) => (
              <View key={idx} style={{ width, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={{ uri }} style={styles.mainImage} />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surfaceCard }]} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          {allImages.length > 1 && (
            <View style={styles.paginationDots}>
              {allImages.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    { backgroundColor: idx === activeImageIndex ? colors.accent : 'rgba(255,255,255,0.5)' }
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          {/* Title & Rating */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandText, { color: colors.textSecondary }]}>{product.brand} • {product.category}</Text>
              <Text style={[styles.nameText, { color: colors.textPrimary }]}>{product.name}</Text>
            </View>
            <View style={[styles.ratingBadge, { backgroundColor: colors.surfaceCard }]}>
              <Star size={14} color={colors.warning} fill={colors.warning} />
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{(product.rating || 5.0).toFixed(1)}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            {product.salePrice && !isRental ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={[styles.priceText, { color: colors.accent }]}>
                  ₹{product.salePrice.toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.originalPriceText, { color: colors.textSecondary, textDecorationLine: 'line-through', fontSize: 16 }]}>
                  ₹{product.price.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.priceText, { color: colors.accent }]}>
                ₹{isRental 
                    ? (product.rentalPricePerDay || product.price).toLocaleString('en-IN')
                    : product.price.toLocaleString('en-IN')}
              </Text>
            )}
            {isRental && <Text style={[styles.pricePer, { color: colors.textSecondary }]}> / day</Text>}
            {!product.inStock && (
              <View style={[styles.outOfStockBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
              </View>
            )}
          </View>

          {/* ── Bullet Points ── */}
          {product.bulletPoints && product.bulletPoints.length > 0 && (
            <View style={[styles.section, { paddingTop: 0, marginTop: -8 }]}>
              {product.bulletPoints.map((point, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
                  <Text style={{ color: colors.textPrimary, marginRight: 8, fontSize: 16, lineHeight: 22 }}>•</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, flex: 1, lineHeight: 20 }}>{point}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Rental Dates ── */}
          {isRental && (
            <View style={[styles.rentalCard, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.rentalCardTitle, { color: colors.textPrimary }]}>📅 Rental Duration</Text>
              <View style={[styles.datesRow, { backgroundColor: colors.surfaceElevated }]}>
                <TouchableOpacity style={[styles.dateSelector, { backgroundColor: colors.surfaceCard }]} onPress={() => setShowFromModal(true)}>
                  <Calendar size={18} color="#7C3AED" />
                  <View style={styles.dateTextWrap}>
                    <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>FROM</Text>
                    <Text style={[styles.dateValue, { color: colors.textPrimary }]}>{fromDate}</Text>
                  </View>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={[styles.dateSeparator, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={[styles.dateSelector, { backgroundColor: colors.surfaceCard }]} onPress={() => setShowToModal(true)}>
                  <Calendar size={18} color="#7C3AED" />
                  <View style={styles.dateTextWrap}>
                    <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>TO</Text>
                    <Text style={[styles.dateValue, { color: colors.textPrimary }]}>{toDate}</Text>
                  </View>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Condition / Specs Info ── */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoBox, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Condition</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{product.condition}</Text>
            </View>
            <View style={[styles.infoBox, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Stock</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{product.inStock ? 'Available' : 'Unavailable'}</Text>
            </View>
          </View>

          {/* ── Description ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{product.description}</Text>
          </View>

          {/* ── Technical Specifications & Compliance ── */}
          {(product.itemDimensions || product.itemWeight || product.batteryInfo || product.countryOfOrigin || product.safetyWarnings || product.gtin || product.sku) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Specifications & Compliance</Text>
              <View style={{ gap: 12 }}>
                {product.gtin && <SpecRow label="GTIN" value={product.gtin} colors={colors} />}
                {product.sku && <SpecRow label="SKU" value={product.sku} colors={colors} />}
                {product.itemDimensions && <SpecRow label="Dimensions" value={product.itemDimensions} colors={colors} />}
                {product.itemWeight && <SpecRow label="Weight" value={product.itemWeight} colors={colors} />}
                {product.batteryInfo && <SpecRow label="Battery Info" value={product.batteryInfo} colors={colors} />}
                {product.countryOfOrigin && <SpecRow label="Origin" value={product.countryOfOrigin} colors={colors} />}
                {product.safetyWarnings && <SpecRow label="Safety Warning" value={product.safetyWarnings} colors={colors} isWarning />}
              </View>
            </View>
          )}

          {/* ── Trust Perks ── */}
          <View style={[styles.perksContainer, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.perkItem}>
              <ShieldCheck size={24} color={colors.success} />
              <View style={styles.perkTexts}>
                <Text style={[styles.perkTitle, { color: colors.textPrimary }]}>Verified Gear</Text>
                <Text style={[styles.perkSub, { color: colors.textSecondary }]}>100% genuine equipment inspected by pros.</Text>
              </View>
            </View>
            {isOfficial && (
              <View style={styles.perkItem}>
                <Truck size={24} color={colors.success} />
                <View style={styles.perkTexts}>
                  <Text style={[styles.perkTitle, { color: colors.textPrimary }]}>Express Delivery</Text>
                  <Text style={[styles.perkSub, { color: colors.textSecondary }]}>Insured shipping in 2-4 business days.</Text>
                </View>
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* ── Fixed Bottom Actions ── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surfaceCard, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.surfaceElevated }, !product.inStock && { opacity: 0.5 }]}
          onPress={handleAddToCart}
          disabled={!product.inStock}
        >
          <ShoppingCart size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyBtn, !product.inStock && { opacity: 0.5 }]}
          onPress={handleBuyNow}
          disabled={!product.inStock}
        >
          <LinearGradient colors={isRental ? ['#7C3AED', '#6D28D9'] : [colors.accent, colors.accent]} style={styles.buyBtnGrad}>
            <Text style={styles.buyBtnText}>{isRental ? 'Rent Now' : 'Buy Now'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  imageWrap: {
    width, height: 340,
    position: 'relative',
    marginBottom: 10,
  },
  mainImage: { 
    width: '90%', 
    height: '90%', 
    resizeMode: 'cover', 
    borderRadius: 24 
  },
  paginationDots: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  backBtn: {
    position: 'absolute', top: 24, left: 24,
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    zIndex: 10,
  },

  detailsContainer: { padding: 20, paddingTop: 30 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  nameText: { fontSize: 24, fontWeight: '900', lineHeight: 32 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  ratingText: { fontSize: 14, fontWeight: '900', marginLeft: 4 },

  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 24, flexWrap: 'wrap', gap: 8 },
  priceText: { fontSize: 28, fontWeight: '900' },
  originalPriceText: { fontSize: 16, textDecorationLine: 'line-through' },
  pricePer: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  outOfStockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 12 },
  outOfStockText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },

  rentalCard: {
    borderRadius: 20, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  rentalCardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
  datesRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 4 },
  dateSelector: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  dateTextWrap: { flex: 1, paddingHorizontal: 8 },
  dateLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '800' },
  dateSeparator: { width: 1, height: '60%', marginHorizontal: 4 },

  infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  infoBox: { flex: 1, padding: 16, borderRadius: 16 },
  infoLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '800' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  descriptionText: { fontSize: 15, lineHeight: 24 },

  perksContainer: { borderRadius: 20, padding: 20, marginBottom: 20 },
  perkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  perkTexts: { marginLeft: 16, flex: 1 },
  perkTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  perkSub: { fontSize: 13, lineHeight: 18 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, paddingBottom: 40, gap: 12,
    borderTopWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: -4 }, shadowRadius: 10, elevation: 10,
  },
  addBtn: {
    width: 60, height: 60, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  buyBtn: { flex: 1, height: 60, borderRadius: 20, overflow: 'hidden' },
  buyBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buyBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});
