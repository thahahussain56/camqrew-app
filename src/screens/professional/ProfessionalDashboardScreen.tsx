import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { professionalApi } from '../../api/professionalApi';
import { bookingApi } from '../../api/bookingApi';
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import { supabase } from '../../api/supabaseClient';
import { createShiprocketOrder, generateShippingLabel, getShiprocketTrackingUrl } from '../../api/shiprocketService';
import { ProfessionalProfile, MenuDishItem } from '../../types/professional';
import { Product } from '../../types/product';
import { Booking } from '../../types/booking';
import { Order } from '../../types/order';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BookingCard } from '../../components/cards/BookingCard';
import { ProductCard } from '../../components/cards/ProductCard';
import { EarningsChart } from '../../components/charts/EarningsChart';
import { BookingsDonut } from '../../components/charts/BookingsDonut';
import { Toast } from '../../components/ui/Toast';
import { ListProductModal } from '../../components/forms/ListProductModal';
import { ListMenuDishModal } from '../../components/forms/ListMenuDishModal';
import { CreatorPickupModal, CreatorPickupData } from '../../components/forms/CreatorPickupModal';
import { DollarSign, Calendar, Eye, Star, Edit3, Bell, PlusCircle, LayoutDashboard, ShoppingBag, FolderGit2, Film, UtensilsCrossed, Trash2, Plus, Clock, Building2, Truck, ExternalLink, Download, Package } from 'lucide-react-native';

type DashTab = 'overview' | 'bookings' | 'sales_rentals' | 'listings';

export const ProfessionalDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [showListGearModal, setShowListGearModal] = useState(false);
  const [showMenuDishModal, setShowMenuDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuDishItem | null>(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('All');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeTab, setActiveTab] = useState<DashTab>('overview');

  // Creator Shiprocket Logistics State
  const [creatorPickup, setCreatorPickup] = useState<CreatorPickupData | null>(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [fulfillingOrderId, setFulfillingOrderId] = useState<string | null>(null);
  const [generatingLabelOrderId, setGeneratingLabelOrderId] = useState<string | null>(null);

  const isBaker = Boolean(
    profile?.categories?.some(c =>
      c.toLowerCase().includes('baker') ||
      c.toLowerCase().includes('bake') ||
      c.toLowerCase().includes('cake') ||
      c.toLowerCase().includes('pastry')
    )
  );

  const isCaterer = Boolean(
    isBaker ||
    profile?.categories?.some(c =>
      c.toLowerCase().includes('cater') ||
      c.toLowerCase().includes('chef') ||
      c.toLowerCase().includes('food') ||
      c.toLowerCase().includes('culinary')
    )
  );

  const handleSaveMenuDish = async (
    dishData: Omit<MenuDishItem, 'id' | 'isAvailable'>,
    editingId?: string
  ) => {
    if (!profile) return;
    const existing = profile.menuItems || [];
    let updated: MenuDishItem[];
    if (editingId) {
      updated = existing.map(d => (d.id === editingId ? { ...d, ...dishData } : d));
    } else {
      const newDish: MenuDishItem = {
        id: 'dish_' + Date.now(),
        ...dishData,
        isAvailable: true,
      };
      updated = [newDish, ...existing];
    }
    await professionalApi.updateProfile({ menuItems: updated });
    setProfile(prev => (prev ? { ...prev, menuItems: updated } : null));
  };

  const handleToggleDishAvailability = async (dishId: string) => {
    if (!profile) return;
    const existing = profile.menuItems || [];
    const updated = existing.map(d =>
      d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d
    );
    await professionalApi.updateProfile({ menuItems: updated });
    setProfile(prev => (prev ? { ...prev, menuItems: updated } : null));
    setToastMsg('Dish availability updated.');
  };

  const handleDeleteMenuDish = (dishId: string) => {
    Alert.alert(
      'Remove Dish',
      'Are you sure you want to remove this dish from your catering menu?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!profile) return;
            const existing = profile.menuItems || [];
            const updated = existing.filter(d => d.id !== dishId);
            await professionalApi.updateProfile({ menuItems: updated });
            setProfile(prev => (prev ? { ...prev, menuItems: updated } : null));
            setToastMsg('Dish removed from menu.');
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (user?.id) {
        setLoading(true);
        professionalApi.getProfileById(user.id)
          .then(data => {
            if (isMounted) setProfile(data);
          })
          .catch(err => {
            console.warn('Failed to load professional profile:', err);
            // Fallback for UI testing if profile row doesn't exist
            if (isMounted) {
              setProfile({
                id: user.id,
                userId: user.id,
                name: user.name || 'Creative Studio',
                title: 'Professional Creator',
                bio: '',
                experienceYears: 0,
                avatar: user.avatar || '',
                bannerImage: '',
                verified: false,
                rating: 0,
                reviewCount: 0,
                city: '',
                state: '',
                district: '',
                locations: [],
                categories: [],
                ratePerDay: 0,
                equipment: [],
                certifications: [],
                portfolio: [],
                services: [],
                reviews: [],
                weeklyAvailability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
                blockedDates: [],
                totalEarnings: 0,
                views: 0,
              } as ProfessionalProfile);
            }
          })
          .finally(() => {
            if (isMounted) setLoading(false);
          });
      } else {
        setLoading(false);
      }
      bookingApi.getProfessionalBookings().then(res => {
        if (isMounted) setUpcomingBookings(Array.isArray(res) ? res : []);
      });
      productApi.getUserProducts().then(res => {
        if (isMounted) setUserProducts(Array.isArray(res) ? res : []);
      });

      if (user?.id) {
        // Load creator studio pickup address
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('label', 'Studio Pickup')
          .maybeSingle()
          .then(({ data: addrData }) => {
            if (addrData && isMounted) {
              setCreatorPickup({
                name: user.name || 'Studio Owner',
                phone: user.phone || '9999999999',
                address: addrData.line1,
                address2: addrData.line2 || '',
                city: addrData.city,
                state: addrData.state,
                pincode: addrData.pincode,
                pickup_nickname: `STUDIO-${user.id.slice(0, 8)}`,
              });
            } else if ((user as any).user_metadata?.pickup_address && isMounted) {
              setCreatorPickup((user as any).user_metadata.pickup_address);
            }
          });

        // Load incoming seller orders
        orderApi.getSellerOrders().then(orders => {
          if (isMounted) setSellerOrders(orders);
        });
      }

      return () => { isMounted = false; };
    }, [user?.id])
  );

  const handleCreatorFulfillOrder = async (order: Order) => {
    if (!creatorPickup) {
      setShowPickupModal(true);
      setToastMsg('Please configure your Studio Pickup Address first before requesting courier pickup!');
      return;
    }

    setFulfillingOrderId(order.id);
    try {
      const rawAddress = order.shippingAddress || (order as any).shipping_address || {};
      const rawItems = Array.isArray(order.items) ? order.items : [];
      const mappedItems = rawItems.map((it: any, idx: number) => {
        const prod = it.product || it;
        return {
          name: prod.name || prod.title || 'Gear Package',
          sku: prod.sku || `SKU-${prod.id ? String(prod.id).slice(0, 8) : idx}`,
          units: Number(it.quantity || 1),
          selling_price: String(prod.price || prod.salePrice || Math.round((order.total || 1000) / (rawItems.length || 1))),
        };
      });

      const response = await createShiprocketOrder({
        order_id: order.id,
        order_date: order.createdAt || new Date().toISOString(),
        pickup_location: creatorPickup.pickup_nickname || `STUDIO-${user?.id?.slice(0, 8)}` || 'warehouse',
        billing_customer_name: rawAddress.fullName || 'Customer',
        billing_address: rawAddress.addressLine1 || 'Delivery Address',
        billing_address_2: rawAddress.addressLine2 || '',
        billing_city: rawAddress.city || 'Mumbai',
        billing_pincode: rawAddress.pincode || '400001',
        billing_state: rawAddress.state || 'Maharashtra',
        billing_country: 'India',
        billing_email: (order as any).customerEmail || (order as any).email || 'customer@client.in',
        billing_phone: rawAddress.phone || '9999999999',
        shipping_is_billing: true,
        order_items: mappedItems,
        payment_method: 'Prepaid',
        sub_total: order.subtotal || order.total || 1000,
        length: 20,
        breadth: 20,
        height: 15,
        weight: 2.0,
      });

      // Update in Supabase
      await supabase.from('orders').update({
        awb_code: response.awb_code,
        courier_name: response.courier_name,
        shiprocket_order_id: response.order_id,
        shipment_id: response.shipment_id,
        status: 'shipped',
      }).eq('id', order.id);

      // Update local state
      setSellerOrders(prev => prev.map(o => o.id === order.id ? {
        ...o,
        status: 'shipped',
        awb_code: response.awb_code,
        courier_name: response.courier_name,
        shiprocket_order_id: response.order_id,
        shipment_id: response.shipment_id,
      } : o));

      Alert.alert(
        'Courier Pickup Scheduled! 🚚',
        `Dispatched via ${response.courier_name}.\nAWB: ${response.awb_code}\n\nCourier agent will arrive at your studio for pickup.`
      );
    } catch (err: any) {
      console.error('Shiprocket fulfillment error:', err);
      Alert.alert('Fulfillment Notice', err.message || 'Could not schedule courier pickup.');
    } finally {
      setFulfillingOrderId(null);
    }
  };

  const handleDownloadShippingLabel = async (order: Order) => {
    const shipmentId = order.shipment_id || order.shiprocket_order_id || order.id;
    setGeneratingLabelOrderId(order.id);
    try {
      const labelUrl = await generateShippingLabel(shipmentId);
      if (labelUrl) {
        await Linking.openURL(labelUrl);
      } else {
        Alert.alert('Label Processing', 'Label generation is in progress. Please retry in 30 seconds.');
      }
    } catch (err: any) {
      console.error('Label generation error:', err);
      Alert.alert('Label Notice', err.message || 'Could not download label. Ensure courier has assigned an AWB.');
    } finally {
      setGeneratingLabelOrderId(null);
    }
  };

  const handleTrackShipment = (order: Order) => {
    const url = getShiprocketTrackingUrl(order.awb_code, order.shiprocket_order_id);
    Linking.openURL(url);
  };

  const safeBookings = Array.isArray(upcomingBookings) ? upcomingBookings : [];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Profile not found.</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 10 }}>Please complete your creator onboarding.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMsg} message={toastMsg} type="success" onDismiss={() => setToastMsg('')} />

      {/* Brand Logo Header */}
      <View style={styles.brandHeaderRow}>
        <Image
          source={
            isDark
              ? require('../../../assets/camqrew-logo-white.png')
              : require('../../../assets/camqrew-logo-dark.png')
          }
          style={styles.brandLogo}
        />
      </View>

      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: '#3fb668' }]}>PRO STUDIO DASHBOARD</Text>
          <Text style={[styles.proName, { color: colors.textPrimary }]}>{profile.name}</Text>
        </View>

        <View style={styles.topRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surfaceCard }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'bookings', label: 'Bookings' },
          { key: 'sales_rentals', label: isCaterer ? 'Menu Orders' : 'Sales & Rentals' },
          { key: 'listings', label: isCaterer ? 'Menu & Prices' : 'Gear Store' },
        ] as { key: DashTab; label: string }[]).map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
              backgroundColor: activeTab === tab.key ? colors.accent : colors.surfaceCard,
              marginRight: 8, borderWidth: 1, borderColor: activeTab === tab.key ? colors.accent : colors.borderLight,
            }}
          >
            <Text style={{
              color: activeTab === tab.key ? '#fff' : colors.textSecondary,
              fontSize: 13, fontWeight: '700',
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <DollarSign size={16} color="#3fb668" />
                <Text style={[styles.statTitle, { color: colors.textFaint }]}>Total Earnings</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                ₹{(profile.totalEarnings || 0).toLocaleString('en-IN')}
              </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Calendar size={16} color="#3fb668" />
                <Text style={[styles.statTitle, { color: colors.textFaint }]}>This Month</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{safeBookings.length} Bookings</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Eye size={16} color="#3fb668" />
                <Text style={[styles.statTitle, { color: colors.textFaint }]}>Profile Views</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{profile.views || 0}</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Text style={[styles.statTitle, { color: colors.textFaint }]}>Avg. Rating</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {profile.rating ? `${profile.rating.toFixed(1)} ★` : '0.0 ★'}
              </Text>
            </Card>
          </ScrollView>

          <Card style={styles.chartCard}>
            <EarningsChart />
          </Card>
          <Card style={styles.chartCard}>
            <BookingsDonut />
          </Card>
        </>
      )}

      {/* ── BOOKINGS TAB ── */}
      {activeTab === 'bookings' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Availability')}>
              <Text style={[styles.seeAll, { color: '#3fb668' }]}>Manage Calendar →</Text>
            </TouchableOpacity>
          </View>
          {safeBookings.length > 0 ? safeBookings.map((b, idx) => (
            <BookingCard
              key={b.id ? `bk-${b.id}` : `bk-idx-${idx}`}
              booking={b}
              isProfessionalMode={true}
              onAccept={async () => {
                await bookingApi.acceptBooking(b.id);
                setToastMsg(`Accepted booking request! Client notified for payment.`);
                bookingApi.getProfessionalBookings().then(res => setUpcomingBookings(Array.isArray(res) ? res : []));
              }}
              onDecline={async () => {
                await bookingApi.declineBooking(b.id);
                setToastMsg(`Declined booking request.`);
                bookingApi.getProfessionalBookings().then(res => setUpcomingBookings(Array.isArray(res) ? res : []));
              }}
              onChat={() => navigation.navigate('Chat', { otherUserId: b.customerId, otherUserName: b.customerName })}
            />
          )) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40 }}>📅</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 10 }}>No bookings yet</Text>
            </View>
          )}
        </>
      )}

      {/* ── SALES & RENTALS TAB ── */}
      {activeTab === 'sales_rentals' && (
        <View style={{ gap: 14 }}>
          {/* Creator Studio Pickup Hub Status Card */}
          <Card
            style={[
              styles.studioPickupCard,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: creatorPickup ? 'rgba(63, 182, 104, 0.4)' : 'rgba(234, 179, 8, 0.4)',
                borderWidth: 1.5,
              },
            ]}
          >
            <View style={styles.pickupHeaderRow}>
              <View
                style={[
                  styles.pickupIconBox,
                  { backgroundColor: creatorPickup ? 'rgba(63, 182, 104, 0.15)' : 'rgba(234, 179, 8, 0.15)' },
                ]}
              >
                <Building2 size={20} color={creatorPickup ? colors.accent : colors.warning} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={[styles.pickupTitle, { color: colors.textPrimary }]}>
                    {creatorPickup ? 'Studio Pickup Location Active' : 'Studio Pickup Address Required'}
                  </Text>
                  <Badge
                    label={creatorPickup ? 'Shiprocket Verified' : 'Setup Needed'}
                    variant={creatorPickup ? 'verified' : 'warning'}
                  />
                </View>
                {creatorPickup?.pickup_nickname ? (
                  <Text style={[styles.pickupNickname, { color: colors.textFaint }]}>
                    Shiprocket Hub ID: {creatorPickup.pickup_nickname}
                  </Text>
                ) : null}
              </View>
            </View>

            {creatorPickup ? (
              <View style={[styles.pickupDetailsBox, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.pickupPersonName, { color: colors.textPrimary }]}>
                  {creatorPickup.name} • {creatorPickup.phone}
                </Text>
                <Text style={[styles.pickupAddressText, { color: colors.textSecondary }]}>
                  {creatorPickup.address}
                  {creatorPickup.address2 ? `, ${creatorPickup.address2}` : ''}, {creatorPickup.city},{' '}
                  {creatorPickup.state} - {creatorPickup.pincode}
                </Text>
              </View>
            ) : (
              <Text style={[styles.pickupDesc, { color: colors.textSecondary }]}>
                Configure your studio address once so Shiprocket courier partners (Bluedart, Delhivery, DTDC) can pick up rental gear and sold equipment directly from your doorstep.
              </Text>
            )}

            <Button
              title={creatorPickup ? 'Edit Studio Address' : '+ Set Studio Pickup Address'}
              variant={creatorPickup ? 'outline' : 'primary'}
              size="sm"
              icon={<Building2 size={14} color={creatorPickup ? colors.textPrimary : '#000000'} />}
              onPress={() => setShowPickupModal(true)}
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
            />
          </Card>

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {isCaterer ? 'Incoming Catering Orders' : 'Incoming Gear Orders'} ({sellerOrders.length})
            </Text>
          </View>

          {sellerOrders.length === 0 ? (
            <View style={{ padding: 36, alignItems: 'center', backgroundColor: colors.surfaceCard, borderRadius: 20 }}>
              <ShoppingBag size={40} color={colors.textFaint} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 10 }}>
                No Orders Yet
              </Text>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 18 }}>
                Incoming orders for your gear will appear here. When buyers order, you can dispatch Shiprocket couriers with 1 tap.
              </Text>
            </View>
          ) : (
            sellerOrders.map((ord: Order) => {
              const itemsList = Array.isArray(ord.items) ? ord.items : [];
              const shippingAddr: any = ord.shippingAddress || {};
              const isShipped = ord.status === 'shipped' || !!ord.awb_code;
              const isFulfilling = fulfillingOrderId === ord.id;
              const isGenerating = generatingLabelOrderId === ord.id;

              return (
                <Card
                  key={ord.id}
                  style={[styles.orderCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                >
                  {/* Status & Type Pills */}
                  <View style={styles.orderTopRow}>
                    <Badge
                      label={(ord.status || 'placed').toUpperCase()}
                      variant={isShipped ? 'success' : 'warning'}
                    />
                    <Text style={[styles.orderTypePill, { color: colors.textSecondary }]}>
                      {ord.orderType === 'rental' ? '🎥 Rental' : '📦 Sale'}
                    </Text>
                    <Text style={[styles.orderDate, { color: colors.textFaint }]}>
                      {ord.createdAt
                        ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                    </Text>
                  </View>

                  <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
                    Order #{String(ord.id).slice(0, 8).toUpperCase()}
                  </Text>

                  {/* Items Chips */}
                  <View style={styles.orderItemsContainer}>
                    {itemsList.map((item: any, idx: number) => {
                      const prod = item.product || item;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.orderItemChip,
                            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                          ]}
                        >
                          <Package size={12} color={colors.accent} />
                          <Text style={[styles.orderItemText, { color: colors.textPrimary }]} numberOfLines={1}>
                            {prod.name || prod.title || 'Gear'} × {item.quantity || 1}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Customer Destination Info */}
                  <View style={[styles.orderDestBox, { borderTopColor: colors.border }]}>
                    <Text style={[styles.destClient, { color: colors.textPrimary }]}>
                      Client: <Text style={{ fontWeight: '700' }}>{shippingAddr.fullName || 'Customer'}</Text>
                    </Text>
                    <Text style={[styles.destLocation, { color: colors.textSecondary }]}>
                      📍{' '}
                      {shippingAddr.city
                        ? `${shippingAddr.city}, ${shippingAddr.state || ''} (${shippingAddr.pincode || ''})`
                        : 'Delivery Address'}
                    </Text>
                    {shippingAddr.phone ? (
                      <Text style={[styles.destPhone, { color: colors.textFaint }]}>
                        📞 {shippingAddr.phone}
                      </Text>
                    ) : null}
                  </View>

                  {/* Courier Shipped Bar */}
                  {isShipped && (
                    <View
                      style={[
                        styles.shippedBanner,
                        { backgroundColor: 'rgba(63, 182, 104, 0.12)', borderColor: 'rgba(63, 182, 104, 0.3)' },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Truck size={16} color={colors.accent} />
                        <Text style={[styles.shippedText, { color: colors.accent }]}>
                          {ord.courier_name || 'Shiprocket'} • AWB: {ord.awb_code || 'Pending'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleTrackShipment(ord)}
                        style={styles.trackLinkBtn}
                      >
                        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>Track ↗</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Price & Action Row */}
                  <View style={[styles.orderActionRow, { borderTopColor: colors.border }]}>
                    <View>
                      <Text style={[styles.orderTotalLabel, { color: colors.textFaint }]}>Total Value</Text>
                      <Text style={[styles.orderTotalAmount, { color: colors.textPrimary }]}>
                        ₹{Number(ord.total || ord.subtotal || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {!isShipped ? (
                        <Button
                          title="Schedule Courier Pickup"
                          variant="primary"
                          size="sm"
                          loading={isFulfilling}
                          icon={<Truck size={14} color="#000000" />}
                          onPress={() => handleCreatorFulfillOrder(ord)}
                        />
                      ) : (
                        <Button
                          title="Download Label"
                          variant="outline"
                          size="sm"
                          loading={isGenerating}
                          icon={<Download size={14} color={colors.accent} />}
                          onPress={() => handleDownloadShippingLabel(ord)}
                        />
                      )}
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* ── LISTINGS / MENU TAB ── */}
      {activeTab === 'listings' && (
        <>
          {isCaterer ? (
            /* ════════════════════════════════════════════════════════
               SWIGGY-STYLE CATERING MENU & PRICES VIEW
               ════════════════════════════════════════════════════════ */
            <View>
              {/* Swiggy-style Action Banner */}
              <TouchableOpacity
                style={[styles.swiggyMenuBanner, { backgroundColor: colors.surfaceCard }]}
                activeOpacity={0.88}
                onPress={() => {
                  setEditingDish(null);
                  setShowMenuDishModal(true);
                }}
              >
                <View style={styles.swiggyBannerIconBox}>
                  <UtensilsCrossed size={22} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.swiggyBannerTitle, { color: colors.textPrimary }]}>
                    {isBaker ? 'Cakes, Bakes & Food Menu' : 'Catering Menu & Dishes'}
                  </Text>
                  <Text style={[styles.swiggyBannerSub, { color: colors.textSecondary }]}>
                    {profile.menuItems?.length || 0} items • {isBaker ? 'Real-time bakery menu' : 'Real-time Swiggy style menu'}
                  </Text>
                </View>
                <View style={styles.swiggyAddPill}>
                  <Text style={styles.swiggyAddPillText}>{isBaker ? '+ Add Bake' : '+ Add Dish'}</Text>
                </View>
              </TouchableOpacity>

              {/* Swiggy Filter & Veg Toggle Bar */}
              <View style={styles.swiggyFilterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }}>
                  {['All', 'Starter', 'Main Course', 'Dessert', 'Beverage', 'Live Counter', 'Other'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedMenuCategory(cat)}
                      style={[
                        styles.swiggyCatChip,
                        {
                          backgroundColor: selectedMenuCategory === cat ? colors.accent : colors.surfaceCard,
                          borderColor: selectedMenuCategory === cat ? colors.accent : colors.borderLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.swiggyCatChipText,
                          { color: selectedMenuCategory === cat ? '#ffffff' : colors.textSecondary },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Veg Only Toggle */}
                  <TouchableOpacity
                    onPress={() => setVegOnlyFilter(v => !v)}
                    style={[
                      styles.swiggyVegOnlyBtn,
                      {
                        backgroundColor: vegOnlyFilter ? 'rgba(22,163,74,0.15)' : colors.surfaceCard,
                        borderColor: vegOnlyFilter ? '#16a34a' : colors.borderLight,
                      },
                    ]}
                  >
                    <View style={styles.vegSymbolBox}>
                      <View style={styles.vegSymbolDot} />
                    </View>
                    <Text style={[styles.swiggyVegOnlyText, { color: vegOnlyFilter ? '#16a34a' : colors.textSecondary }]}>
                      Veg Only
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Items Summary Pill */}
              <View style={styles.swiggySummaryRow}>
                <Text style={[styles.swiggySummaryText, { color: colors.textSecondary }]}>
                  {profile.menuItems?.filter(d => {
                    if (selectedMenuCategory !== 'All' && d.category !== selectedMenuCategory) return false;
                    if (vegOnlyFilter && !d.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan')) return false;
                    return true;
                  }).length || 0} Dishes listed
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>
                    ● {profile.menuItems?.filter(d => d.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan')).length || 0} Veg
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>
                    ▲ {profile.menuItems?.filter(d => d.dietaryTags?.includes('Non-Veg')).length || 0} Non-Veg
                  </Text>
                </View>
              </View>

              {/* Swiggy Dishes List */}
              {profile.menuItems && profile.menuItems.length > 0 ? (
                profile.menuItems
                  .filter(d => {
                    if (selectedMenuCategory !== 'All' && d.category !== selectedMenuCategory) return false;
                    if (vegOnlyFilter && !d.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan')) return false;
                    return true;
                  })
                  .map(dish => {
                    const isGreen = dish.dietaryTags?.some(t => t === 'Veg' || t === 'Jain' || t === 'Vegan');
                    return (
                      <View key={dish.id} style={[styles.swiggyDishCard, { backgroundColor: colors.surfaceCard }]}>
                        {dish.imageUrl ? (
                          <Image
                            source={{ uri: dish.imageUrl }}
                            style={styles.swiggyDishThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.swiggyDishThumb, { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
                            <UtensilsCrossed size={20} color={colors.textFaint} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          {/* Veg/Non-Veg icon + name */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <View style={[styles.vegSymbolBox, { borderColor: isGreen ? '#16a34a' : '#dc2626' }]}>
                              <View style={[styles.vegSymbolDot, { backgroundColor: isGreen ? '#16a34a' : '#dc2626' }]} />
                            </View>
                            <Text style={[styles.swiggyDishName, { color: colors.textPrimary }]} numberOfLines={1}>
                              {dish.name}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginVertical: 3 }}>
                            <View style={[styles.swiggyCategoryBadge, { backgroundColor: colors.surfaceElevated }]}>
                              <Text style={[styles.swiggyCategoryBadgeText, { color: colors.textSecondary }]}>
                                {dish.category}
                              </Text>
                            </View>
                            {dish.minQuantity ? (
                              <View style={[styles.swiggyCategoryBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                <Text style={[styles.swiggyCategoryBadgeText, { color: '#f59e0b', fontWeight: '800' }]}>
                                  Min: {dish.minQuantity}
                                </Text>
                              </View>
                            ) : null}
                            {dish.prepTime ? (
                              <View style={[styles.swiggyCategoryBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)', flexDirection: 'row', alignItems: 'center' }]}>
                                <Clock size={10} color="#3b82f6" style={{ marginRight: 3 }} />
                                <Text style={[styles.swiggyCategoryBadgeText, { color: '#3b82f6', fontWeight: '800' }]}>
                                  Prep: {dish.prepTime}
                                </Text>
                              </View>
                            ) : null}
                            {dish.dietaryTags?.map(t => (
                              <View
                                key={t}
                                style={[
                                  styles.swiggyCategoryBadge,
                                  {
                                    backgroundColor: (t === 'Veg' || t === 'Jain' || t === 'Vegan')
                                      ? 'rgba(34,197,94,0.1)'
                                      : 'rgba(239,68,68,0.1)',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.swiggyCategoryBadgeText,
                                    { color: (t === 'Veg' || t === 'Jain' || t === 'Vegan') ? '#16a34a' : '#dc2626' },
                                  ]}
                                >
                                  {t}
                                </Text>
                              </View>
                            ))}
                          </View>

                          {dish.description ? (
                            <Text style={[styles.swiggyDishDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                              {dish.description}
                            </Text>
                          ) : null}

                          <View style={{ marginTop: 8 }}>
                            <Text style={[styles.swiggyDishPrice, { color: colors.textPrimary }]}>
                              ₹{dish.pricePerPlate.toLocaleString('en-IN')}
                              <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}> /{dish.unit || (isBaker ? 'kg' : 'plate')}</Text>
                            </Text>
                          </View>
                        </View>

                        {/* Right Column: In Stock Toggle + Edit / Delete */}
                        <View style={styles.swiggyRightCol}>
                          <TouchableOpacity
                            onPress={() => handleToggleDishAvailability(dish.id)}
                            style={[
                              styles.swiggyStockToggle,
                              {
                                backgroundColor: dish.isAvailable ? 'rgba(34,197,94,0.12)' : colors.surfaceElevated,
                                borderColor: dish.isAvailable ? '#16a34a' : colors.borderLight,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.swiggyStockText,
                                { color: dish.isAvailable ? '#16a34a' : colors.textSecondary },
                              ]}
                            >
                              {dish.isAvailable ? '● IN STOCK' : '○ SOLD OUT'}
                            </Text>
                          </TouchableOpacity>

                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                            <TouchableOpacity
                              onPress={() => {
                                setEditingDish(dish);
                                setShowMenuDishModal(true);
                              }}
                              style={[styles.swiggyMiniBtn, { backgroundColor: colors.surfaceElevated }]}
                            >
                              <Edit3 size={13} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteMenuDish(dish.id)}
                              style={[styles.swiggyMiniBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                            >
                              <Trash2 size={13} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
              ) : (
                <View style={[styles.swiggyEmptyCard, { backgroundColor: colors.surfaceCard }]}>
                  <UtensilsCrossed size={40} color={colors.textFaint} />
                  <Text style={[styles.swiggyEmptyTitle, { color: colors.textPrimary }]}>
                    No dishes added yet
                  </Text>
                  <Text style={[styles.swiggyEmptySub, { color: colors.textSecondary }]}>
                    Add your starters, main courses, and desserts so customers can calculate quotations without contacting you.
                  </Text>
                  <Button
                    title="+ Add First Dish"
                    variant="primary"
                    size="md"
                    onPress={() => {
                      setEditingDish(null);
                      setShowMenuDishModal(true);
                    }}
                    style={{ marginTop: 16, backgroundColor: '#3fb668' }}
                  />
                </View>
              )}

              {/* Manage Catering Studio Options */}
              <Card style={styles.quickCard}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>
                  Catering Profile Setup
                </Text>

                <TouchableOpacity style={styles.manageRow} onPress={() => navigation.navigate('ProfessionalEdit')}>
                  <View style={styles.manageIcon}><UtensilsCrossed size={20} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>Cuisines & Equipment</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Mughlai, Italian, Buffet Warmers, Live Counters</Text>
                  </View>
                  <Edit3 size={16} color={colors.textFaint} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.manageRow} onPress={() => navigation.navigate('ProfessionalEdit')}>
                  <View style={styles.manageIcon}><Star size={20} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>FSSAI & Food Licenses</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>ISO 22000, Food Safety Compliance</Text>
                  </View>
                  <Edit3 size={16} color={colors.textFaint} />
                </TouchableOpacity>

                <Button
                  title="View Public Profile"
                  variant="outline"
                  size="md"
                  onPress={() => navigation.navigate('PublicProfile', { professionalId: user?.id })}
                  style={{ marginTop: 10 }}
                />
              </Card>
            </View>
          ) : (
            /* Standard Equipment Listing for Media Crew */
            <>
              <TouchableOpacity
                style={styles.listGearBanner}
                activeOpacity={0.88}
                onPress={() => setShowListGearModal(true)}
              >
                <View style={styles.listGearIconBox}>
                  <PlusCircle size={24} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listGearTitle}>List Equipment for Rent</Text>
                  <Text style={styles.listGearSub}>Earn daily rental income with escrow deposits</Text>
                </View>
                <View style={styles.listGearPill}>
                  <Text style={styles.listGearPillText}>Rent Out +</Text>
                </View>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {userProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onPress={() => {}}
                    onAddToCart={() => {}}
                  />
                ))}
              </View>

              {userProducts.length === 0 && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>No products listed yet.</Text>
                </View>
              )}

              <Card style={styles.quickCard}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Manage Studio</Text>
                
                <TouchableOpacity style={styles.manageRow} onPress={() => navigation.navigate('ProfessionalEdit')}>
                  <View style={styles.manageIcon}><FolderGit2 size={20} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>Update Portfolio</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Add new photos/videos to your public profile</Text>
                  </View>
                  <Edit3 size={16} color={colors.textFaint} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.manageRow} onPress={() => navigation.navigate('ProfessionalEdit')}>
                  <View style={styles.manageIcon}><Film size={20} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>Video Reels & Showreels</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Upload video reels & showreels directly</Text>
                  </View>
                  <Edit3 size={16} color={colors.textFaint} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.manageRow} onPress={() => navigation.navigate('ProfessionalEdit')}>
                  <View style={styles.manageIcon}><Star size={20} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>Edit Services & Pricing</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Update your day rates and specialties</Text>
                  </View>
                  <Edit3 size={16} color={colors.textFaint} />
                </TouchableOpacity>

                <Button
                  title="View Public Profile"
                  variant="outline"
                  size="md"
                  onPress={() => navigation.navigate('PublicProfile', { professionalId: user?.id })}
                  style={{ marginTop: 10 }}
                />
              </Card>
            </>
          )}
        </>
      )}

      {/* Modals */}
      {isCaterer ? (
        <ListMenuDishModal
          visible={showMenuDishModal}
          dishToEdit={editingDish}
          isBaker={isBaker}
          onClose={() => {
            setShowMenuDishModal(false);
            setEditingDish(null);
          }}
          onSuccess={(msg) => setToastMsg(msg)}
          onSave={handleSaveMenuDish}
        />
      ) : (
        <ListProductModal
          visible={showListGearModal}
          onClose={() => setShowListGearModal(false)}
          onSuccess={(msg) => {
            setToastMsg(msg);
            productApi.getUserProducts().then(res => {
              setUserProducts(Array.isArray(res) ? res : []);
            });
          }}
        />
      )}

      {/* Creator Studio Pickup Address Modal (Shiprocket) */}
      <CreatorPickupModal
        visible={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        initialData={creatorPickup}
        userId={user?.id}
        userEmail={user?.email}
        onSuccess={(updated) => {
          setCreatorPickup(updated);
          setToastMsg('Studio Pickup Address successfully verified with Shiprocket! 📦');
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 64,
    paddingBottom: 115,
  },
  brandHeaderRow: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  brandLogo: {
    width: 160,
    height: 34,
    resizeMode: 'contain',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  proName: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  listGearBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  listGearIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3fb668',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listGearTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  listGearSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  listGearPill: {
    backgroundColor: '#3fb668',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },
  listGearPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  statsScroll: {
    marginBottom: 16,
  },
  statCard: {
    width: 155,
    padding: 16,
    marginRight: 10,
    borderWidth: 0,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
  },
  chartCard: {
    marginBottom: 16,
    borderWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickCard: {
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 0,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  manageIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(63, 182, 104, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },

  // ── Swiggy Menu Styles ──
  swiggyMenuBanner: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  swiggyBannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3fb668',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  swiggyBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  swiggyBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  swiggyAddPill: {
    backgroundColor: '#3fb668',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginLeft: 8,
  },
  swiggyAddPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  swiggyFilterBar: {
    marginBottom: 6,
  },
  swiggyCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  swiggyCatChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  swiggyVegOnlyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 6,
  },
  swiggyVegOnlyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  swiggySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  swiggySummaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  swiggyDishCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  swiggyDishThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#1c222b',
    marginRight: 12,
  },
  swiggyDishName: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  swiggyCategoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  swiggyCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  swiggyDishDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  swiggyDishPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  swiggyRightCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  swiggyStockToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  swiggyStockText: {
    fontSize: 10,
    fontWeight: '800',
  },
  swiggyMiniBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swiggyEmptyCard: {
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    marginVertical: 10,
  },
  swiggyEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  swiggyEmptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  vegSymbolBox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#16a34a',
  },
  vegSymbolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  studioPickupCard: {
    padding: 16,
    borderRadius: 16,
  },
  pickupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  pickupNickname: {
    fontSize: 11,
    marginTop: 2,
  },
  pickupDetailsBox: {
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  pickupPersonName: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickupAddressText: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  pickupDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 10,
  },
  orderCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orderTypePill: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  orderItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  orderItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  orderItemText: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 200,
  },
  orderDestBox: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginBottom: 10,
  },
  destClient: {
    fontSize: 12,
  },
  destLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  destPhone: {
    fontSize: 11,
    marginTop: 2,
  },
  shippedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  shippedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trackLinkBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  orderActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  orderTotalLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  orderTotalAmount: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1,
  },
});

