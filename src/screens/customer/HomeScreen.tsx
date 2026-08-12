import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useNotificationStore } from '../../store/notificationStore';
import { professionalApi } from '../../api/professionalApi';
import { productApi } from '../../api/productApi';
import { ProfessionalProfile } from '../../types/professional';
import { Product } from '../../types/product';
import { ProCard } from '../../components/cards/ProCard';
import { ProductCard } from '../../components/cards/ProductCard';
import { useCartStore } from '../../store/cartStore';
import { Toast } from '../../components/ui/Toast';
import {
  Search,
  Mic,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  MapPin,
  Bell,
  Check,
  X,
  Star,
  Zap,
} from 'lucide-react-native';

const POPULAR_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Delhi NCR', state: 'Delhi' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Goa', state: 'Goa' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Chandigarh', state: 'Punjab' },
];

const CATEGORY_BUBBLES = [
  {
    id: 'cat_1',
    name: 'Wedding',
    icon: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200',
  },
  {
    id: 'cat_2',
    name: 'Cinema',
    icon: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=200',
  },
  {
    id: 'cat_3',
    name: 'Fashion',
    icon: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=200',
  },
  {
    id: 'cat_4',
    name: 'Catering',
    icon: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=200',
  },
  {
    id: 'cat_5',
    name: 'Web Dev',
    icon: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=200',
  },
  {
    id: 'cat_6',
    name: 'Drone FX',
    icon: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=200',
  },
];

import { ALL_INDIAN_CITIES } from '../../constants/locations';
import * as Location from 'expo-location';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { notifications, unreadCount } = useNotificationStore();
  const { addItem } = useCartStore();

  const [selectedCity, setSelectedCity] = useState({ city: 'Mumbai', state: 'Maharashtra' });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const filteredCities = ALL_INDIAN_CITIES.filter(c =>
    c.city.toLowerCase().includes(locationSearch.toLowerCase()) ||
    c.state.toLowerCase().includes(locationSearch.toLowerCase()) ||
    c.district.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const [activeSegment, setActiveSegment] = useState<'creators' | 'rentals' | 'store'>('creators');
  const [selectedBubble, setSelectedBubble] = useState('Wedding');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [ratingFilter, setRatingFilter] = useState(false);
  const [instantFilter, setInstantFilter] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [featuredPros, setFeaturedPros] = useState<ProfessionalProfile[]>([]);
  const [featuredGear, setFeaturedGear] = useState<Product[]>([]);

  useEffect(() => {
    professionalApi.getProfessionals().then(res => setFeaturedPros(Array.isArray(res) ? res : []));
    productApi.getProducts().then(res => setFeaturedGear(Array.isArray(res) ? res : []));
  }, []);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const geocodes = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geocodes && geocodes.length > 0) {
          const geocode = geocodes[0];
          const detectedCity = geocode.city || geocode.subregion || geocode.district;
          
          if (detectedCity) {
            // Find a match in our location database
            const match = ALL_INDIAN_CITIES.find(
              c =>
                c.city.toLowerCase().includes(detectedCity.toLowerCase()) ||
                detectedCity.toLowerCase().includes(c.city.toLowerCase())
            );

            if (match) {
              setSelectedCity({ city: match.city, state: match.state });
              setToastMsg(`Location auto-detected: ${match.city}, ${match.state}`);
            } else {
              // Try matching district
              const matchDist = ALL_INDIAN_CITIES.find(
                c =>
                  geocode.district &&
                  (c.district.toLowerCase().includes(geocode.district.toLowerCase()) ||
                    geocode.district.toLowerCase().includes(c.district.toLowerCase()))
              );
              if (matchDist) {
                setSelectedCity({ city: matchDist.city, state: matchDist.state });
                setToastMsg(`Location auto-detected: ${matchDist.city}, ${matchDist.state}`);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error auto-detecting location:', error);
      }
    };

    detectLocation();
  }, []);

  const safePros = (Array.isArray(featuredPros) ? featuredPros : []).filter(pro => {
    if (verifiedOnly && !pro.verified) return false;
    if (ratingFilter && (pro.rating ?? 0) < 4.5) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = pro.name.toLowerCase().includes(q);
      const matchCat = (pro.categories || []).some(c => c.toLowerCase().includes(q));
      if (!matchName && !matchCat) return false;
    }
    return true;
  });

  const safeGear = Array.isArray(featuredGear) ? featuredGear : [];
  const recentNotification = notifications && notifications.length > 0 ? notifications[0] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toastMsg} message={toastMsg} type="success" onDismiss={() => setToastMsg('')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Brand Logo Row Above Location */}
        <View style={styles.brandHeaderRow}>
          <Image
            source={
              isDark
                ? require('../../../assets/camcrew-logo-white.png')
                : require('../../../assets/camcrew-logo-dark.png')
            }
            style={styles.brandLogo}
          />
        </View>

        {/* 1. Editable Location Header */}
        <View style={styles.topLocationRow}>
          <TouchableOpacity
            style={styles.locationMeta}
            activeOpacity={0.75}
            onPress={() => setShowLocationModal(true)}
          >
            <View style={styles.locationLabelRow}>
              <MapPin size={14} color="#fc8019" />
              <Text style={styles.locationLabel}>LOCATION</Text>
              <ChevronDown size={14} color="#fc8019" />
            </View>
            <Text style={[styles.selectedCityText, { color: colors.textPrimary }]} numberOfLines={1}>
              {selectedCity.city}, {selectedCity.state}
            </Text>
          </TouchableOpacity>

          {/* Top Bell Button */}
          <TouchableOpacity
            style={[styles.topBellBtn, { backgroundColor: colors.surfaceCard }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={20} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.bellBadgeDot}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Top Segmented Mode Pills (Fully Functioning Navigation) */}
        <View style={styles.modePillsRow}>
          <TouchableOpacity
            style={[
              styles.modePill,
              activeSegment === 'creators' && styles.modePillActive,
              { backgroundColor: colors.surfaceCard },
            ]}
            onPress={() => setActiveSegment('creators')}
          >
            <Text style={styles.modeEmoji}>🎥</Text>
            <Text
              style={[
                styles.modePillText,
                { color: activeSegment === 'creators' ? '#fc8019' : colors.textPrimary },
              ]}
            >
              Creators
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modePill,
              activeSegment === 'rentals' && styles.modePillActive,
              { backgroundColor: colors.surfaceCard },
            ]}
            onPress={() => {
              setActiveSegment('rentals');
              navigation.navigate('MarketplaceTab', { screen: 'MarketplaceMain', params: { initialType: 'rental' } });
            }}
          >
            <Text style={styles.modeEmoji}>🎬</Text>
            <Text
              style={[
                styles.modePillText,
                { color: activeSegment === 'rentals' ? '#fc8019' : colors.textPrimary },
              ]}
            >
              Gear Rental
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modePill,
              activeSegment === 'store' && styles.modePillActive,
              { backgroundColor: colors.surfaceCard },
            ]}
            onPress={() => {
              setActiveSegment('store');
              navigation.navigate('MarketplaceTab', { screen: 'MarketplaceMain', params: { initialType: 'sale' } });
            }}
          >
            <Text style={styles.modeEmoji}>📦</Text>
            <Text
              style={[
                styles.modePillText,
                { color: activeSegment === 'store' ? '#fc8019' : colors.textPrimary },
              ]}
            >
              Gear Store
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Search & Voice Mic Bar */}
        <View style={styles.searchBarRow}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.surfaceCard }]}>
            <Search size={18} color={colors.textFaint} style={{ marginLeft: 14 }} />
            <TextInput
              placeholder="Search for 'Wedding', 'Sony FX3'..."
              placeholderTextColor={colors.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => {
                setToastMsg('Listening for voice search query...');
              }}
            >
              <Mic size={18} color="#fc8019" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.verifiedToggleBtn,
              {
                backgroundColor: verifiedOnly ? 'rgba(22, 163, 74, 0.12)' : colors.surfaceCard,
              },
            ]}
            onPress={() => setVerifiedOnly(!verifiedOnly)}
          >
            <Text style={[styles.verifiedToggleLabel, { color: verifiedOnly ? '#16a34a' : colors.textFaint }]}>VERIFIED</Text>
            <View style={[styles.toggleDot, { backgroundColor: verifiedOnly ? '#16a34a' : colors.textFaint }]}>
              {verifiedOnly && <Check size={8} color="#ffffff" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Circular Category Story Bubbles */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bubblesScroll}>
          {CATEGORY_BUBBLES.map(b => {
            const isActive = selectedBubble === b.name;
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.bubbleItem}
                onPress={() => {
                  setSelectedBubble(b.name);
                  navigation.navigate('ExploreTab', { screen: 'ServicesList', params: { category: b.name } });
                }}
              >
                <View style={[styles.bubbleRing, isActive && styles.bubbleRingActive]}>
                  <Image source={{ uri: b.icon }} style={styles.bubbleImg} />
                  {isActive && (
                    <View style={styles.checkBadge}>
                      <Check size={8} color="#ffffff" />
                    </View>
                  )}
                </View>
                <Text style={[styles.bubbleName, { color: isActive ? '#fc8019' : colors.textPrimary }]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Filter Chips Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: colors.surfaceCard }]}
            onPress={() => navigation.navigate('ExploreTab', { screen: 'ServicesList' })}
          >
            <SlidersHorizontal size={14} color={colors.textPrimary} />
            <Text style={[styles.filterChipText, { color: colors.textPrimary }]}>Filter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: colors.surfaceCard }]}
            onPress={() => {
              setToastMsg('Sorted by Rating & Popularity');
            }}
          >
            <Text style={[styles.filterChipText, { color: colors.textPrimary }]}>Sort By</Text>
            <ChevronDown size={14} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: instantFilter ? 'rgba(252, 128, 25, 0.2)' : 'rgba(252, 128, 25, 0.12)' },
            ]}
            onPress={() => {
              setInstantFilter(!instantFilter);
              setToastMsg(instantFilter ? 'Showing all bookings' : 'Filtered by Instant Booking');
            }}
          >
            <Text style={[styles.filterChipText, { color: '#fc8019' }]}>⚡ Instant Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: ratingFilter ? 'rgba(245, 158, 11, 0.2)' : colors.surfaceCard },
            ]}
            onPress={() => {
              setRatingFilter(!ratingFilter);
              setToastMsg(ratingFilter ? 'Showing all ratings' : 'Filtered 4.5+ Rated creators');
            }}
          >
            <Text style={[styles.filterChipText, { color: ratingFilter ? '#f59e0b' : colors.textPrimary }]}>
              ⭐ 4.5+ Rated
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 6. Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.exploreCount, { color: colors.textPrimary }]}>
              {safePros.length} Creators & Studios in {selectedCity.city}
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textFaint }]}>Top Rated Creative Studios</Text>
          </View>
        </View>

        {/* 7. Creators List */}
        {safePros.map(pro => (
          <ProCard
            key={pro.id}
            professional={{ ...pro, city: pro.city || selectedCity.city, state: pro.state || selectedCity.state }}
            onPressProfile={() => navigation.navigate('PublicProfile', { id: pro.id })}
            onPressBook={() => navigation.navigate('Booking', { proId: pro.id })}
          />
        ))}

        {/* 8. Cinema Gear Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.exploreCount, { color: colors.textPrimary }]}>Cinema Gear Marketplace</Text>
            <Text style={[styles.sectionSub, { color: colors.textFaint }]}>Rent or Buy Professional Equipment</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MarketplaceTab')}>
            <Text style={[styles.seeAllText, { color: '#fc8019' }]}>Shop All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gearGrid}>
          {safeGear.map(item => (
            <ProductCard
              key={item.id}
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
              onAddToCart={() => {
                addItem(item);
                setToastMsg(`Added "${item.name}" to cart!`);
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* 9. Recent Notification Banner */}
      {recentNotification && (
        <TouchableOpacity
          style={[styles.recentNotifBanner, { backgroundColor: colors.surfaceCard }]}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={styles.notifIconBox}>
            <Bell size={18} color="#ffffff" />
          </View>

          <View style={styles.notifMeta}>
            <View style={styles.notifHeaderRow}>
              <Text style={[styles.notifTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {recentNotification.title}
              </Text>
              <Text style={styles.notifTime}>{recentNotification.timestamp}</Text>
            </View>
            <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={1}>
              {recentNotification.body}
            </Text>
          </View>

          <ChevronRight size={18} color={colors.textFaint} />
        </TouchableOpacity>
      )}

      {/* 10. Editable Location City Selector Modal */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Your City</Text>
                <Text style={[styles.modalSub, { color: colors.textFaint }]}>
                  Show creators & gear available in your location
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalSearchWrapper, { backgroundColor: colors.background }]}>
              <Search size={16} color={colors.textFaint} style={{ marginLeft: 12 }} />
              <TextInput
                placeholder="Search city or state..."
                placeholderTextColor={colors.textFaint}
                value={locationSearch}
                onChangeText={setLocationSearch}
                style={[styles.modalSearchInput, { color: colors.textPrimary }]}
              />
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {filteredCities.map(item => {
                const isSelected = selectedCity.city === item.city;
                return (
                  <TouchableOpacity
                    key={`${item.state}-${item.district}-${item.city}`}
                    style={[
                      styles.cityRow,
                      isSelected && { backgroundColor: 'rgba(252, 128, 25, 0.1)' },
                    ]}
                    onPress={() => {
                      setSelectedCity(item);
                      setShowLocationModal(false);
                      setToastMsg(`Location updated to ${item.city}, ${item.state}`);
                    }}
                  >
                    <MapPin size={18} color={isSelected ? '#fc8019' : colors.textFaint} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.cityName, { color: isSelected ? '#fc8019' : colors.textPrimary }]}>
                        {item.city}
                      </Text>
                      <Text style={[styles.stateName, { color: colors.textFaint }]}>{item.state}</Text>
                    </View>
                    {isSelected && <Check size={18} color="#fc8019" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 64,
    paddingBottom: 165,
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
  topLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationMeta: {
    flex: 1,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fc8019',
    letterSpacing: 1,
  },
  selectedCityText: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  topBellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fc8019',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  modePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  modePillActive: {
    backgroundColor: 'rgba(252, 128, 25, 0.12)',
  },
  modeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 18,
  },
  searchInputWrapper: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
    height: '100%',
  },
  micBtn: {
    padding: 12,
  },
  verifiedToggleBtn: {
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  verifiedToggleLabel: {
    fontSize: 9,
    fontWeight: '900',
  },
  toggleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubblesScroll: {
    marginBottom: 18,
  },
  bubbleItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 64,
  },
  bubbleRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  bubbleRingActive: {
    borderColor: '#fc8019',
  },
  bubbleImg: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  checkBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fc8019',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  filtersScroll: {
    marginBottom: 22,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: 6,
  },
  exploreCount: {
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '800',
  },
  gearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recentNotifBanner: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 20,
  },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fc8019',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifMeta: {
    flex: 1,
    marginRight: 8,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  notifTime: {
    fontSize: 10,
    color: '#fc8019',
    fontWeight: '700',
  },
  notifBody: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalSearchWrapper: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
    height: '100%',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '800',
  },
  stateName: {
    fontSize: 12,
    marginTop: 1,
  },
});
