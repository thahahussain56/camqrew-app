import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { studioApi } from '../../api/studioApi';
import { ProfessionalProfile } from '../../types/professional';
import { ProCard } from '../../components/cards/ProCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { Search, SlidersHorizontal, MapPin, X, Users, Building2 } from 'lucide-react-native';
import { TextInput as RNTextInput } from 'react-native';

type ServiceType = 'professionals' | 'studios';

export const ServicesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  
  const [serviceType, setServiceType] = useState<ServiceType>('professionals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [results, setResults] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Multi-Level Cascading Location Filter State
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  const proCategories = ['All', 'Photographers', 'Videographers', 'Models', 'Home Bakers', 'Caterers', 'Organisers', 'Travels', 'Makeup Artists', 'Mehendi Artists', 'Developers', 'Designers'];
  const studioCategories = ['All', 'Green Screen', 'Sound Stage', 'Photo Bay', 'VFX Bay', 'Podcast'];
  const currentCategories = serviceType === 'professionals' ? proCategories : studioCategories;

  const fetchData = async () => {
    setLoading(true);
    try {
      if (serviceType === 'professionals') {
        const data = await professionalApi.getProfessionals({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          searchQuery,
        });
        setResults(Array.isArray(data) ? data : []);
      } else {
        const data = await studioApi.getStudios({
          searchQuery: selectedCategory === 'All' ? searchQuery : `${searchQuery} ${selectedCategory}`.trim(),
        });
        setResults(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [serviceType, selectedCategory, searchQuery]);

  const hasLocationFilter = Boolean(state || district || city);

  // Client-side filtering for locations since schema lacks district for studios/pros explicitly
  const safeResults = (Array.isArray(results) ? results : []).filter(item => {
    if (state && item.state && !item.state.toLowerCase().includes(state.toLowerCase())) return false;
    if (district && item.district && !item.district.toLowerCase().includes(district.toLowerCase())) return false;
    if (city && item.city && !item.city.toLowerCase().includes(city.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* ── Minimal Header (Home-Page Design System) ── */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Categories</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Discover top creatives and premium studios</Text>
          </View>
        </View>

        {/* ── Segmented Toggle (Professionals vs Studios) ── */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceElevated }]}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[
              styles.segmentBtn,
              serviceType === 'professionals' && [styles.segmentBtnActive, { backgroundColor: colors.surfaceCard }]
            ]}
            onPress={() => {
              setServiceType('professionals');
              setSelectedCategory('All');
            }}
          >
            <Users size={15} color={serviceType === 'professionals' ? colors.accent : colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentText, { color: serviceType === 'professionals' ? colors.textPrimary : colors.textSecondary, fontWeight: serviceType === 'professionals' ? '800' : '600' }]}>
              Professionals
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[
              styles.segmentBtn,
              serviceType === 'studios' && [styles.segmentBtnActive, { backgroundColor: colors.surfaceCard }]
            ]}
            onPress={() => {
              setServiceType('studios');
              setSelectedCategory('All');
            }}
          >
            <Building2 size={15} color={serviceType === 'studios' ? colors.accent : colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentText, { color: serviceType === 'studios' ? colors.textPrimary : colors.textSecondary, fontWeight: serviceType === 'studios' ? '800' : '600' }]}>
              Studio Bays
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Search size={17} color={colors.textSecondary} style={{ marginLeft: 14 }} />
          <RNTextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={serviceType === 'professionals' ? "Search photographers, editors..." : "Search studio bays..."}
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: colors.surfaceCard },
              hasLocationFilter && { backgroundColor: colors.accentGlow }
            ]}
            onPress={() => setShowFilterDrawer(!showFilterDrawer)}
            activeOpacity={0.8}
          >
            <SlidersHorizontal size={15} color={hasLocationFilter ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {hasLocationFilter && (
          <View style={[styles.activeFilterRow, { backgroundColor: colors.accentGlow }]}>
            <MapPin size={12} color={colors.accent} />
            <Text style={[styles.activeFilterText, { color: colors.textPrimary }]}>
              {[state, district, city].filter(Boolean).join(' • ')}
            </Text>
            <TouchableOpacity onPress={() => { setState(''); setDistrict(''); setCity(''); }} style={styles.clearFilterBtn}>
              <X size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Category Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {currentCategories.map(cat => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: active ? colors.accent : colors.surfaceElevated,
                  }
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color: active ? '#ffffff' : colors.textSecondary,
                      fontWeight: active ? '800' : '600',
                    }
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Location Drawer ── */}
      {showFilterDrawer && (
        <View style={[styles.filterDrawer, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <LocationCascader
            selectedState={state}
            selectedDistrict={district}
            selectedCity={city}
            onSelect={(s, d, c) => { setState(s); setDistrict(d); setCity(c); }}
          />

          <View style={styles.drawerActions}>
            {hasLocationFilter && (
              <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.background }]} onPress={() => { setState(''); setDistrict(''); setCity(''); }}>
                <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.accent }]} onPress={() => { setShowFilterDrawer(false); fetchData(); }}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Main List ── */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View>
            <Skeleton height={200} borderRadius={20} />
            <Skeleton height={200} borderRadius={20} style={{ marginTop: 16 }} />
          </View>
        ) : safeResults.length > 0 ? (
          safeResults.map((item, index) => (
            <ProCard
              key={item.id ? `${serviceType}-${item.id}` : `idx-${index}`}
              professional={item}
              onPressProfile={() => {
                if (serviceType === 'professionals') {
                  navigation.navigate('PublicProfile', { id: item.id });
                } else {
                  // Studio details could go here in the future
                  navigation.navigate('PublicProfile', { id: item.id, type: 'studio' });
                }
              }}
              onPressBook={() => navigation.navigate('Booking', { proId: item.id, type: serviceType })}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.border }]}>
              {serviceType === 'professionals' ? <Users size={32} color={colors.textSecondary} /> : <Building2 size={32} color={colors.textSecondary} />}
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              We couldn't find any {serviceType} matching your current search or location criteria.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  
  // Segmented Mode Switcher
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: { fontSize: 13 },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    height: '100%',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  activeFilterText: { fontSize: 12, fontWeight: '700', marginHorizontal: 6 },
  clearFilterBtn: { padding: 2 },
  
  // Category Chips
  chipsScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  catChipText: {
    fontSize: 12.5,
  },
  
  filterDrawer: {
    padding: 20,
    borderBottomWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  drawerActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  resetBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  resetBtnText: { fontWeight: '800', fontSize: 14 },
  applyBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  applyBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  
  listContent: { padding: 16, paddingBottom: 110 },
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
});
