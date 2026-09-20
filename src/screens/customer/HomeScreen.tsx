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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useNotificationStore } from '../../store/notificationStore';
import { professionalApi } from '../../api/professionalApi';
import { studioApi } from '../../api/studioApi';
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
  MessageSquare,
  Video,
  Building2,
  Film,
  Package,
  Briefcase,
  Send,
} from 'lucide-react-native';
import { ALL_INDIAN_CITIES } from '../../constants/locations';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';

const CREATOR_BUBBLES = [
  { id: 'cat_1', name: 'Photographers', icon: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=200' },
  { id: 'cat_2', name: 'Videographers', icon: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=200' },
  { id: 'cat_3', name: 'Caterers', icon: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=200' },
  { id: 'cat_4', name: 'Organisers', icon: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=200' },
  { id: 'cat_5', name: 'Makeup Artists', icon: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=200' },
  { id: 'cat_6', name: 'Mehendi Artists', icon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=200' },
  { id: 'cat_7', name: 'Developers', icon: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=200' },
  { id: 'cat_8', name: 'Designers', icon: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=200' },
];

const STUDIO_BUBBLES = [
  { id: 'st_1', name: 'Green Screen', icon: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200' },
  { id: 'st_2', name: 'Sound Stage', icon: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200' },
  { id: 'st_3', name: 'Photo Bay', icon: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=200' },
  { id: 'st_4', name: 'VFX Bay', icon: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200' },
  { id: 'st_5', name: 'Podcast', icon: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=200' },
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { notifications, unreadCount } = useNotificationStore();
  const { addItem } = useCartStore();
  const { selectedCity, setSelectedCity, loadPersistedLocation, isLoadingLocation } = useLocationStore();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const filteredCities = ALL_INDIAN_CITIES.filter(c =>
    c.city.toLowerCase().includes(locationSearch.toLowerCase()) ||
    c.state.toLowerCase().includes(locationSearch.toLowerCase()) ||
    c.district.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const [activeSegment, setActiveSegment] = useState<'creators' | 'studios' | 'rentals' | 'store'>('creators');
  const [selectedBubble, setSelectedBubble] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [ratingFilter, setRatingFilter] = useState(false);
  const [instantFilter, setInstantFilter] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [featuredPros, setFeaturedPros] = useState<ProfessionalProfile[]>([]);
  const [featuredStudios, setFeaturedStudios] = useState<ProfessionalProfile[]>([]);
  const [featuredGear, setFeaturedGear] = useState<Product[]>([]);

  useEffect(() => {
    loadPersistedLocation();
    professionalApi.getProfessionals().then(res => setFeaturedPros(Array.isArray(res) ? res : []));
    studioApi.getStudios().then(res => setFeaturedStudios(Array.isArray(res) ? res : []));
    productApi.getProducts().then(res => setFeaturedGear(Array.isArray(res) ? res : []));
  }, []);

  const getFilteredList = (list: ProfessionalProfile[]) => {
    return list.filter(pro => {
      if (selectedBubble && !(pro.categories || []).includes(selectedBubble)) return false;
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
  };

  const safePros = getFilteredList(featuredPros);
  const safeStudios = getFilteredList(featuredStudios);
  const safeGear = Array.isArray(featuredGear) ? featuredGear : [];
  const recentNotification = notifications && notifications.length > 0 ? notifications[0] : null;

  const currentBubbles = activeSegment === 'studios' ? STUDIO_BUBBLES : CREATOR_BUBBLES;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Toast visible={!!toastMsg} message={toastMsg} type="success" onDismiss={() => setToastMsg('')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Brand Logo Row Above Location */}
        <View style={styles.brandHeaderRow}>
          <Image
            source={isDark ? require('../../../assets/camcrew-logo-white.png') : require('../../../assets/camcrew-logo-dark.png')}
            style={styles.brandLogo}
            resizeMode="contain"
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
              <MapPin size={12} color={colors.accent} strokeWidth={3} />
              <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>CURRENT LOCATION</Text>
            </View>
            <Text style={[styles.selectedCityText, { color: colors.textPrimary }]} numberOfLines={1}>
              {isLoadingLocation ? 'Detecting...' : `${selectedCity.city}, ${selectedCity.state}`}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Broadcast & Job Board Hub Button */}
            <TouchableOpacity
              style={[styles.topBellBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent, borderWidth: 1 }]}
              activeOpacity={0.8}
              onPress={() => {
                if (user?.role === 'professional') {
                  setShowBroadcastModal(true);
                } else {
                  navigation.navigate('CreateJob');
                }
              }}
            >
              <Briefcase size={20} color={colors.accent} />
            </TouchableOpacity>

            {/* Top Message Button */}
            <TouchableOpacity
              style={[styles.topBellBtn, { backgroundColor: colors.surfaceCard }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ChatList')}
            >
              <MessageSquare size={20} color={colors.textPrimary} />
              <View style={[styles.bellBadgeDot, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.bellBadgeText}>3</Text>
              </View>
            </TouchableOpacity>

            {/* Top Bell Button */}
            <TouchableOpacity
              style={[styles.topBellBtn, { backgroundColor: colors.surfaceCard }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Bell size={20} color={colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={[styles.bellBadgeDot, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Top Segmented Mode Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modePillsScroll}>
          <TouchableOpacity
            style={[styles.modePill, { backgroundColor: colors.surfaceCard }, activeSegment === 'creators' && { backgroundColor: colors.accentGlow }]}
            onPress={() => setActiveSegment('creators')}
          >
            <Video size={16} color={activeSegment === 'creators' ? colors.accent : colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.modePillText, { color: activeSegment === 'creators' ? colors.accent : colors.textPrimary }]}>
              Creators
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, { backgroundColor: colors.surfaceCard }, activeSegment === 'studios' && { backgroundColor: colors.accentGlow }]}
            onPress={() => setActiveSegment('studios')}
          >
            <Building2 size={16} color={activeSegment === 'studios' ? colors.accent : colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.modePillText, { color: activeSegment === 'studios' ? colors.accent : colors.textPrimary }]}>
              Studios
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, { backgroundColor: colors.surfaceCard }, activeSegment === 'rentals' && { backgroundColor: colors.accentGlow }]}
            onPress={() => {
              setActiveSegment('rentals');
              navigation.navigate('MarketplaceTab', { screen: 'MarketplaceScreen', params: { initialType: 'rental' } });
            }}
          >
            <Film size={16} color={activeSegment === 'rentals' ? colors.accent : colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.modePillText, { color: activeSegment === 'rentals' ? colors.accent : colors.textPrimary }]}>
              Gear Rental
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, { backgroundColor: colors.surfaceCard }, activeSegment === 'store' && { backgroundColor: colors.accentGlow }]}
            onPress={() => {
              setActiveSegment('store');
              navigation.navigate('MarketplaceTab', { screen: 'MarketplaceScreen', params: { initialType: 'sale' } });
            }}
          >
            <Package size={16} color={activeSegment === 'store' ? colors.accent : colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.modePillText, { color: activeSegment === 'store' ? colors.accent : colors.textPrimary }]}>
              Gear Store
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 3. Search & Voice Mic Bar */}
        <View style={styles.searchBarRow}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.surfaceCard }]}>
            <Search size={18} color={colors.textFaint} style={{ marginLeft: 14 }} />
            <TextInput
              placeholder={activeSegment === 'studios' ? "Search 'Green Screen', 'VFX'..." : "Search 'Wedding', 'Sony FX3'..."}
              placeholderTextColor={colors.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            <TouchableOpacity style={styles.micBtn}>
              <Mic size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.verifiedToggleBtn, { backgroundColor: verifiedOnly ? 'rgba(34, 197, 94, 0.15)' : colors.surfaceCard }]}
            onPress={() => setVerifiedOnly(!verifiedOnly)}
          >
            <Text style={[styles.verifiedToggleLabel, { color: verifiedOnly ? colors.success : colors.textFaint }]}>VERIFIED</Text>
            <View style={[styles.toggleDot, { backgroundColor: verifiedOnly ? colors.success : colors.textFaint }]}>
              {verifiedOnly && <Check size={8} color="#ffffff" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Circular Category Story Bubbles */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bubblesScroll}>
          {currentBubbles.map(b => {
            const isActive = selectedBubble === b.name;
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.bubbleItem}
                onPress={() => {
                  setSelectedBubble(isActive ? '' : b.name);
                }}
              >
                <View style={[styles.bubbleRing, isActive && { borderColor: colors.accent }]}>
                  <Image source={{ uri: b.icon }} style={styles.bubbleImg} />
                  {isActive && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.accent, borderColor: colors.background }]}>
                      <Check size={8} color="#ffffff" />
                    </View>
                  )}
                </View>
                <Text style={[styles.bubbleName, { color: isActive ? colors.accent : colors.textPrimary }]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Filter Chips Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <TouchableOpacity style={[styles.filterChip, { backgroundColor: colors.surfaceCard }]} onPress={() => navigation.navigate('ExploreTab', { screen: 'ServicesList' })}>
            <SlidersHorizontal size={14} color={colors.textPrimary} />
            <Text style={[styles.filterChipText, { color: colors.textPrimary }]}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, { backgroundColor: colors.surfaceCard }]}>
            <Text style={[styles.filterChipText, { color: colors.textPrimary }]}>Sort By</Text>
            <ChevronDown size={14} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: instantFilter ? colors.accentGlow : colors.surfaceCard }]}
            onPress={() => setInstantFilter(!instantFilter)}
          >
            <Text style={[styles.filterChipText, { color: instantFilter ? colors.accent : colors.textPrimary }]}>Instant Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: ratingFilter ? 'rgba(245, 158, 11, 0.15)' : colors.surfaceCard }]}
            onPress={() => setRatingFilter(!ratingFilter)}
          >
            <Text style={[styles.filterChipText, { color: ratingFilter ? colors.warning : colors.textPrimary }]}>4.5+ Rated</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 6. Main Feed Segment */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.exploreCount, { color: colors.textPrimary }]}>
              {activeSegment === 'studios' ? safeStudios.length : safePros.length} {activeSegment === 'studios' ? 'Studios' : 'Creators'} in {selectedCity.city}
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textFaint }]}>Top Rated {activeSegment === 'studios' ? 'Studio Bays' : 'Creative Professionals'}</Text>
          </View>
        </View>

        {(activeSegment === 'studios' ? safeStudios : safePros).map(pro => (
          <ProCard
            key={pro.id}
            professional={{ ...pro, city: pro.city || selectedCity.city, state: pro.state || selectedCity.state }}
            onPressProfile={() => navigation.navigate('PublicProfile', { id: pro.id, type: activeSegment === 'studios' ? 'studios' : 'professionals' })}
            onPressBook={() => navigation.navigate('Booking', { proId: pro.id, type: activeSegment === 'studios' ? 'studios' : 'professionals' })}
          />
        ))}

        {/* 7. Cinema Gear Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View>
            <Text style={[styles.exploreCount, { color: colors.textPrimary }]}>Cinema Gear Marketplace</Text>
            <Text style={[styles.sectionSub, { color: colors.textFaint }]}>Rent or Buy Professional Equipment</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MarketplaceTab')}>
            <Text style={[styles.seeAllText, { color: colors.accent }]}>Shop All →</Text>
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

      {/* Editable Location City Selector Modal */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Your City</Text>
                <Text style={[styles.modalSub, { color: colors.textFaint }]}>Show creators, studios & gear in your location</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalSearchWrapper, { backgroundColor: colors.background }]}>
              <Search size={18} color={colors.textFaint} style={{ marginLeft: 14 }} />
              <TextInput
                placeholder="Search city or state..."
                placeholderTextColor={colors.textFaint}
                value={locationSearch}
                onChangeText={setLocationSearch}
                style={[styles.modalSearchInput, { color: colors.textPrimary }]}
              />
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {filteredCities.map(item => {
                const isSelected = selectedCity.city === item.city;
                return (
                  <TouchableOpacity
                    key={`${item.state}-${item.district}-${item.city}`}
                    style={[styles.cityRow, isSelected && { backgroundColor: colors.accentGlow }]}
                    onPress={() => {
                      setSelectedCity(item);
                      setShowLocationModal(false);
                      setToastMsg(`Location updated to ${item.city}, ${item.state}`);
                    }}
                  >
                    <MapPin size={20} color={isSelected ? colors.accent : colors.textFaint} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.cityName, { color: isSelected ? colors.accent : colors.textPrimary }]}>{item.city}</Text>
                      <Text style={[styles.stateName, { color: colors.textSecondary }]}>{item.state}</Text>
                    </View>
                    {isSelected && <Check size={20} color={colors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Broadcast & Job Board Hub Modal */}
      <Modal visible={showBroadcastModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Broadcast & Job Board</Text>
                <Text style={[styles.modalSub, { color: colors.textFaint }]}>Shoot requirements and live creator pitching</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBroadcastModal(false)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.hubOptionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent, borderWidth: 1 }]}
                activeOpacity={0.85}
                onPress={() => {
                  setShowBroadcastModal(false);
                  navigation.navigate('CreateJob');
                }}
              >
                <View style={[styles.hubIconCircle, { backgroundColor: colors.accentGlow }]}>
                  <Send size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.hubOptionTitle, { color: colors.textPrimary }]}>Post a Broadcast Job</Text>
                  <Text style={[styles.hubOptionSub, { color: colors.textSecondary }]}>
                    Publish shoot date, budget & requirements to verified local crew in {selectedCity.city}.
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textFaint} />
              </TouchableOpacity>

              {user?.role === 'professional' && (
                <TouchableOpacity
                  style={[styles.hubOptionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setShowBroadcastModal(false);
                    navigation.navigate('JobBoardScreen');
                  }}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Briefcase size={22} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.hubOptionTitle, { color: colors.textPrimary }]}>Live Pro Job Board</Text>
                    <Text style={[styles.hubOptionSub, { color: colors.textSecondary }]}>
                      Browse active client shoot requests, review budgets & claim jobs with reverse pitching.
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textFaint} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 10, paddingBottom: 160 },
  brandHeaderRow: { marginBottom: 12, alignItems: 'flex-start' },
  brandLogo: { width: 160, height: 40 },
  topLocationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  locationMeta: { flex: 1 },
  locationLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  selectedCityText: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  topBellBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute', top: 6, right: 6, borderRadius: 10, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  
  modePillsScroll: { marginBottom: 16, flexGrow: 0 },
  modePill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 16, marginRight: 10,
  },
  modeEmoji: { fontSize: 16, marginRight: 6 },
  modePillText: { fontSize: 14, fontWeight: '800' },
  
  searchBarRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 20 },
  searchInputWrapper: {
    flex: 1, height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, paddingHorizontal: 12, height: '100%' },
  micBtn: { padding: 14 },
  verifiedToggleBtn: {
    height: 54, paddingHorizontal: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  verifiedToggleLabel: { fontSize: 10, fontWeight: '900' },
  toggleDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  
  bubblesScroll: { marginBottom: 20, flexGrow: 0 },
  bubbleItem: { alignItems: 'center', marginRight: 18, width: 70 },
  bubbleRing: { width: 64, height: 64, borderRadius: 32, padding: 3, borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  bubbleImg: { width: '100%', height: '100%', borderRadius: 30 },
  checkBadge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  bubbleName: { fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  
  filtersScroll: { marginBottom: 24, flexGrow: 0 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, marginRight: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  
  // Hub Modal Cards
  hubOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
  },
  hubIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubOptionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  hubOptionSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  exploreCount: { fontSize: 20, fontWeight: '900' },
  sectionSub: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  seeAllText: { fontSize: 14, fontWeight: '800' },
  gearGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  modalSub: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  closeBtn: { padding: 4, borderRadius: 20 },
  modalSearchWrapper: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalSearchInput: { flex: 1, fontSize: 16, paddingHorizontal: 12, height: '100%' },
  cityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, borderRadius: 16, marginBottom: 4 },
  cityName: { fontSize: 16, fontWeight: '700' },
  stateName: { fontSize: 13, marginTop: 2, fontWeight: '500' },
});
