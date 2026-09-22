import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MenuDishItem } from '../../types/professional';
import {
  ChevronLeft,
  Plus,
  Minus,
  ShieldCheck,
  UtensilsCrossed,
  ArrowRight,
  Users,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface QuotationSummaryScreenProps {
  navigation: any;
  route: any;
}

export const QuotationSummaryScreen: React.FC<QuotationSummaryScreenProps> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();

  const catererName: string = route?.params?.catererName || 'Caterer';
  const catererTitle: string = route?.params?.catererTitle || 'Catering Professional';
  const professionalId: string = route?.params?.professionalId || '';
  const ratePerDay: number = route?.params?.ratePerDay || 0;
  const initialSelections: Record<string, number> = route?.params?.selections || {};
  const allItems: MenuDishItem[] = route?.params?.menuItems || [];
  const isBaker: boolean = Boolean(route?.params?.isBaker || route?.params?.archetype === 'home_baker');

  const [quantities, setQuantities] = useState<Record<string, number>>(initialSelections);
  const [guestCount, setGuestCount] = useState(50);

  const selectedItems = useMemo(
    () => allItems.filter(d => d.isAvailable && (quantities[d.id] || 0) > 0),
    [allItems, quantities],
  );

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, d) => sum + d.pricePerPlate * (quantities[d.id] || 0), 0),
    [selectedItems, quantities],
  );

  const totalPerGuest = useMemo(
    () => selectedItems.reduce((sum, d) => sum + d.pricePerPlate * (quantities[d.id] || 0), 0),
    [selectedItems, quantities],
  );

  // For home bakers: total is direct sum of items (no guest multiplier)
  const grandTotal = isBaker ? subtotal : (totalPerGuest * guestCount);

  const adjust = (id: string, delta: number) => {
    setQuantities(prev => {
      const next = (prev[id] || 0) + delta;
      return { ...prev, [id]: Math.max(0, next) };
    });
  };

  const handleProceedToBook = () => {
    const itemSummary = selectedItems
      .map(d => `${d.name} ×${quantities[d.id]} (₹${d.pricePerPlate}${d.unit ? `/${d.unit}` : (isBaker ? '/kg' : '/plate')})`)
      .join(', ');
    const notesText = isBaker
      ? `Bakery Order:\nItems: ${itemSummary}\nTotal Order Amount: ₹${grandTotal.toLocaleString('en-IN')}`
      : `Menu Quotation — ${guestCount} guests\nItems: ${itemSummary}\nEstimated Total: ₹${grandTotal.toLocaleString('en-IN')}`;

    navigation.navigate('Booking', {
      professionalId,
      professionalName: catererName,
      professionalTitle: catererTitle,
      ratePerDay,
      serviceTitle: isBaker ? `Bakery Order — ${selectedItems.length} Items` : `Catering Package — ${guestCount} Guests`,
      notes: notesText,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surfaceCard }]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isBaker ? 'Order Summary' : 'Quotation Summary'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{catererName}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Guest Count Card for Caterers OR Order Info Card for Home Bakers */}
        {!isBaker ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: colors.accentGlow }]}>
                <Users size={18} color={colors.accent} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Guest Count</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Prices will be multiplied by the number of guests
            </Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => setGuestCount(g => Math.max(10, g - 10))}
              >
                <Minus size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.stepperValueWrap}>
                <Text style={[styles.stepperValue, { color: colors.textPrimary }]}>{guestCount}</Text>
                <Text style={[styles.stepperUnit, { color: colors.textSecondary }]}>guests</Text>
              </View>
              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => setGuestCount(g => g + 10)}
              >
                <Plus size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <UtensilsCrossed size={18} color="#f59e0b" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Bakery Order Details</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Freshly baked to order. Calculated directly from individual item quantities without per-head rates.
            </Text>
          </View>
        )}

        {/* Selected Dishes */}
        {selectedItems.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: colors.accentGlow }]}>
                <UtensilsCrossed size={18} color={colors.accent} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {isBaker ? 'Selected Bakes & Foods' : 'Selected Dishes'}
              </Text>
            </View>

            {/* Column headers */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { color: colors.textSecondary, flex: 1 }]}>
                {isBaker ? 'Item' : 'Dish'}
              </Text>
              <Text style={[styles.tableColHeader, { color: colors.textSecondary, width: 60, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.tableColHeader, { color: colors.textSecondary, width: 70, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.tableColHeader, { color: colors.textSecondary, width: 80, textAlign: 'right' }]}>
                {isBaker ? 'Total' : 'Sub×Guests'}
              </Text>
            </View>

            {selectedItems.map((dish, idx) => {
              const qty = quantities[dish.id] || 0;
              const sub = isBaker ? (dish.pricePerPlate * qty) : (dish.pricePerPlate * qty * guestCount);
              const isGreen = dish.dietaryTags.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan');
              return (
                <View key={dish.id} style={[styles.tableRow, idx < selectedItems.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight }]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.dishNameRow}>
                      <View style={[styles.vegDot, { backgroundColor: isGreen ? '#16a34a' : '#dc2626' }]} />
                      <Text style={[styles.dishName, { color: colors.textPrimary }]} numberOfLines={1}>{dish.name}</Text>
                    </View>
                    <Text style={[styles.dishCategory, { color: colors.textSecondary }]}>{dish.category}</Text>
                  </View>
                  <View style={{ width: 60, alignItems: 'center' }}>
                    <View style={styles.miniStepper}>
                      <TouchableOpacity onPress={() => adjust(dish.id, -1)} style={styles.miniStepBtn}>
                        <Minus size={12} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <Text style={[styles.miniStepValue, { color: colors.textPrimary }]}>{qty}</Text>
                      <TouchableOpacity onPress={() => adjust(dish.id, 1)} style={styles.miniStepBtn}>
                        <Plus size={12} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.tableCell, { color: colors.textSecondary, width: 70 }]}>
                    ₹{dish.pricePerPlate.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.accent, width: 80, fontWeight: '700' }]}>
                    ₹{sub.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surfaceCard, alignItems: 'center', paddingVertical: 32 }]}>
            <UtensilsCrossed size={36} color={colors.textFaint} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isBaker ? 'No bakery items selected' : 'No dishes selected'}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>Browse Menu ↩</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cost Breakdown */}
        {selectedItems.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 14 }]}>
              {isBaker ? 'Order Breakdown' : 'Cost Breakdown'}
            </Text>

            {!isBaker ? (
              <>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Per plate (per guest)</Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                    ₹{(subtotal).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>× {guestCount} guests</Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>= ₹{grandTotal.toLocaleString('en-IN')}</Text>
                </View>
              </>
            ) : (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Total Selected Items</Text>
                <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                  {selectedItems.reduce((acc, d) => acc + (quantities[d.id] || 0), 0)} items
                </Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.breakdownRow}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
                {isBaker ? 'Order Total' : 'Estimated Total'}
              </Text>
              <Text style={[styles.totalValue, { color: colors.accent }]}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={[styles.escrowBadge, { backgroundColor: colors.accentGlow }]}>
              <ShieldCheck size={13} color={colors.accent} />
              <Text style={[styles.escrowText, { color: colors.accent }]}>
                {isBaker ? 'Protected by Camcrew Escrow until order delivery' : 'Final price confirmed & protected by Escrow after booking'}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating CTA */}
      {selectedItems.length > 0 && (
        <View style={[styles.ctaBar, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.ctaTotalLabel, { color: colors.textSecondary }]}>Estimated Total</Text>
            <Text style={[styles.ctaTotalValue, { color: colors.textPrimary }]}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleProceedToBook}
            style={styles.ctaBtnWrapper}
          >
            <LinearGradient
              colors={['#3fb668', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaBtnText}>Proceed to Book</Text>
              <ArrowRight size={16} color="#ffffff" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  // Card
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  cardSubtitle: { fontSize: 13, marginBottom: 14, lineHeight: 18 },

  // Guest stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 4,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueWrap: { alignItems: 'center', minWidth: 60 },
  stepperValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  stepperUnit: { fontSize: 12, fontWeight: '500', marginTop: -2 },

  // Table
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  tableColHeader: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dishNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  vegDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dishName: { fontSize: 13, fontWeight: '600', flex: 1 },
  dishCategory: { fontSize: 11, fontWeight: '500', marginLeft: 14 },
  tableCell: { fontSize: 12, fontWeight: '600', textAlign: 'right' },

  miniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStepBtn: { padding: 4 },
  miniStepValue: { fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  // Breakdown
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: { fontSize: 14, fontWeight: '500' },
  breakdownValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  escrowText: { fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 16 },

  emptyText: { fontSize: 14, fontWeight: '500', marginTop: 10 },

  // CTA
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaTotalLabel: { fontSize: 11, fontWeight: '500' },
  ctaTotalValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginTop: 2 },
  ctaBtnWrapper: { borderRadius: 26, overflow: 'hidden' },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 26,
  },
  ctaBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
