import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { studioApi } from '../../api/studioApi';
import { ProfessionalProfile } from '../../types/professional';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { ProCard } from '../../components/cards/ProCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { Search, SlidersHorizontal, MapPin, X, Users, Building2, Filter } from 'lucide-react-native';
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

  const proCategories = ['All', 'Photographers', 'Videographers', 'Designers', 'Developers', 'Organisers', 'Caterers'];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (serviceType === 'professionals') {
        const data = await professionalApi.getProfessionals({
          category: selectedCategory,
          searchQuery,
        });
        setResults(Array.isArray(data) ? data : []);
      } else {
        const data = await studioApi.getStudios({
          searchQuery,
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
      
      {/* ── Premium Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Categories</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Discover top creatives and premium studios</Text>

        {/* ── Segmented Toggle (Professionals vs Studios) ── */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.toggleBtn, serviceType === 'professionals' && { backgroundColor: colors.surfaceElevated }]}
            onPress={() => setServiceType('professionals')}
          >
            <Users size={16} color={serviceType === 'professionals' ? colors.accent : colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.toggleText, { color: colors.textSecondary }, serviceType === 'professionals' && { color: colors.textPrimary, fontWeight: '900' }]}>
              Professionals
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.toggleBtn, serviceType === 'studios' && { backgroundColor: colors.surfaceElevated }]}
            onPress={() => {
              setServiceType('studios');
              setSelectedCategory('All');
            }}
          >
            <Building2 size={16} color={serviceType === 'studios' ? colors.accent : colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.toggleText, { color: colors.textSecondary }, serviceType === 'studios' && { color: colors.textPrimary, fontWeight: '900' }]}>
              Studio Bays
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Search size={18} color={colors.textSecondary} style={{ marginLeft: 16 }} />
          <RNTextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={serviceType === 'professionals' ? "Search photographers, editors..." : "Search studio bays..."}
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: colors.textPrimary }, hasLocationFilter && { backgroundColor: colors.accent }]}
            onPress={() => setShowFilterDrawer(!showFilterDrawer)}
            activeOpacity={0.85}
          >
            <Filter size={16} color={colors.background} />
          </TouchableOpacity>
        </View>

        {hasLocationFilter && (
          <View style={[styles.activeFilterRow, { backgroundColor: colors.accentGlow }]}>
            <MapPin size={12} color={colors.accent} />
            <Text style={[styles.activeFilterText, { color: colors.textPrimary }]}>
              {[state, district, city].filter(Boolean).join(' • ')}
            </Text>
            <TouchableOpacity onPress={() => { setState(''); setDistrict(''); setCity(''); }} style={styles.clearFilterBtn}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Category Chips (Only for Professionals) ── */}
        {serviceType === 'professionals' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {proCategories.map(cat => (
              <Chip
                key={cat}
                label={cat}
                active={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
              />
            ))}
          </ScrollView>
        )}
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
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2, marginBottom: 16 },
  
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { fontSize: 13, fontWeight: '700' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    height: '100%',
  },
  filterBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },
  
  activeFilterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  activeFilterText: { fontSize: 12, fontWeight: '800', marginHorizontal: 6 },
  clearFilterBtn: { padding: 2 },
  
  chipsScroll: { marginTop: 16 },
  
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
