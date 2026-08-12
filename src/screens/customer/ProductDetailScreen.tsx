import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { productApi } from '../../api/productApi';
import { Product } from '../../types/product';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useCartStore } from '../../store/cartStore';
import { Toast } from '../../components/ui/Toast';
import { ShoppingCart, Truck, ShieldCheck, Star, ArrowLeft } from 'lucide-react-native';

import { DatePickerModal } from '../../components/ui/DatePickerModal';
import { Calendar, ChevronDown } from 'lucide-react-native';

export const ProductDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { addItem } = useCartStore();
  const productId = route?.params?.id || 'prd_1';

  const [product, setProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Rental Date Selection State
  const [fromDate, setFromDate] = useState('24/08/2026');
  const [toDate, setToDate] = useState('27/08/2026');
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);

  useEffect(() => {
    productApi.getProductById(productId).then(setProduct);
  }, [productId]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (product.type === 'rental') {
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
    } else {
      addItem(product);
    }
    setToastMessage('Added to cart!');
  };

  const handleRentalRequest = () => {
    // Calculate days between fromDate and toDate (simple parse for dd/mm/yyyy format)
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
      days = 3; // Fallback
    }

    addItem(product, 1, fromDate, toDate, days);
    setToastMessage(`Added rental equipment to cart for ${days} days!`);
    setTimeout(() => {
      navigation.navigate('Cart');
    }, 1000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMessage} message={toastMessage} type="success" onDismiss={() => setToastMessage('')} />
      <DatePickerModal visible={showFromModal} onClose={() => setShowFromModal(false)} onSelectDate={setFromDate} selectedDate={fromDate} title="Rental From Date" />
      <DatePickerModal visible={showToModal} onClose={() => setShowToModal(false)} onSelectDate={setToDate} selectedDate={toDate} title="Rental To Date" />

      <View style={styles.imageContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={styles.badgeWrapper}>
          <Badge label={product.condition} variant="info" />
        </View>
      </View>

      <View style={styles.metaContainer}>
        <Text style={[styles.brand, { color: colors.textFaint }]}>{product.brand}</Text>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.accent }]}>
            ₹
            {product.type === 'rental'
              ? (product.rentalPricePerDay || product.price).toLocaleString('en-IN')
              : product.price.toLocaleString('en-IN')}
            {product.type === 'rental' && <Text style={{ fontSize: 13, color: colors.textFaint }}> / day</Text>}
          </Text>
          <View style={styles.ratingBox}>
            <Star size={14} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 4 }} />
            <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{product.rating}</Text>
          </View>
        </View>

        {/* Rental Date Range Selector */}
        {product.type === 'rental' && (
          <Card style={{ marginBottom: 14, padding: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 }}>
              📅 Select Rental Duration
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}
                onPress={() => setShowFromModal(true)}
              >
                <Calendar size={14} color="#fc8019" style={{ marginRight: 4 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, color: colors.textFaint }}>FROM</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary }}>{fromDate}</Text>
                </View>
                <ChevronDown size={14} color={colors.textFaint} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}
                onPress={() => setShowToModal(true)}
              >
                <Calendar size={14} color="#fc8019" style={{ marginRight: 4 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, color: colors.textFaint }}>TO</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary }}>{toDate}</Text>
                </View>
                <ChevronDown size={14} color={colors.textFaint} />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        <View style={styles.buttonRow}>
          <Button
            title="Add to Cart"
            variant="secondary"
            size="lg"
            icon={<ShoppingCart size={18} color={colors.textPrimary} />}
            onPress={handleAddToCart}
            style={{ flex: 1, marginRight: 10 }}
          />
          <Button
            title={product.type === 'rental' ? 'Request Rental 🎬' : 'Buy Now'}
            variant="primary"
            size="lg"
            onPress={product.type === 'rental' ? handleRentalRequest : () => {
              addItem(product);
              navigation.navigate('Cart');
            }}
            style={{ flex: 1.2, backgroundColor: '#fc8019' }}
          />
        </View>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Product Description</Text>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>{product.description}</Text>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.perkRow}>
            <Truck size={20} color={colors.accent} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.perkTitle, { color: colors.textPrimary }]}>Express Delivery Across India</Text>
              <Text style={[styles.perkSub, { color: colors.textFaint }]}>Insured shipping in 2-4 business days.</Text>
            </View>
          </View>
          <View style={[styles.perkRow, { marginTop: 12 }]}>
            <ShieldCheck size={20} color={colors.accent} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.perkTitle, { color: colors.textPrimary }]}>Camcrew Verified Authenticity</Text>
              <Text style={[styles.perkSub, { color: colors.textFaint }]}>100% genuine equipment inspected by pros.</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  imageContainer: {
    height: 280,
    position: 'relative',
    backgroundColor: '#0a0d12',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  backBtn: {
    position: 'absolute',
    top: 64,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeWrapper: {
    position: 'absolute',
    top: 64,
    right: 20,
  },
  metaContainer: {
    padding: 20,
  },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sectionCard: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  perkSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
