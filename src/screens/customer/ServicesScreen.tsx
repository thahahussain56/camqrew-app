import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { ProfessionalProfile } from '../../types/professional';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';
import { ProCard } from '../../components/cards/ProCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react-native';

export const ServicesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const initialCategory = route?.params?.category || 'All';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Multi-Level Cascading Location Filter State (State -> District -> City)
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  const categories = ['All', 'Photographers', 'Videographers', 'Designers', 'Developers', 'Organisers', 'Caterers'];

  const fetchPros = async () => {
    setLoading(true);
    try {
      const data = await professionalApi.getProfessionals({
        category: selectedCategory,
        searchQuery,
      });
      setProfessionals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch professionals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPros();
  }, [selectedCategory, searchQuery]);

  const hasLocationFilter = Boolean(state || district || city);

  // Filter professionals by State -> District -> City
  const safeProfessionals = (Array.isArray(professionals) ? professionals : []).filter(pro => {
    if (state && pro.state && !pro.state.toLowerCase().includes(state.toLowerCase())) return false;
    if (district && pro.district && !pro.district.toLowerCase().includes(district.toLowerCase())) return false;
    if (city && pro.city && !pro.city.toLowerCase().includes(city.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Find Creative Pros</Text>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Search by name, title, or city..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={18} color={colors.textSecondary} />}
            />
          </View>

          {/* Filter Toggle Button */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor: hasLocationFilter ? '#fc8019' : colors.surfaceCard,
              },
            ]}
            onPress={() => setShowFilterDrawer(!showFilterDrawer)}
            activeOpacity={0.85}
          >
            <SlidersHorizontal size={20} color={hasLocationFilter ? '#ffffff' : colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Active Location Filter Pill */}
        {hasLocationFilter && (
          <View style={styles.activeFilterRow}>
            <MapPin size={12} color="#fc8019" />
            <Text style={[styles.activeFilterText, { color: colors.textPrimary }]}>
              {[state, district, city].filter(Boolean).join(' • ')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setState('');
                setDistrict('');
                setCity('');
              }}
              style={styles.clearFilterBtn}
            >
              <X size={14} color={colors.textFaint} />
            </TouchableOpacity>
          </View>
        )}

        {/* Category Horizontal Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {categories.map(cat => (
            <Chip
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Slide-down Cascading Location Filter Box */}
      {showFilterDrawer && (
        <View style={[styles.filterDrawer, { backgroundColor: colors.surfaceCard }]}>
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

          <View style={styles.drawerActions}>
            {hasLocationFilter && (
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.background }]}
                onPress={() => {
                  setState('');
                  setDistrict('');
                  setCity('');
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>Reset</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: '#fc8019' }]}
              onPress={() => {
                setShowFilterDrawer(false);
                fetchPros();
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 14 }}>Apply Location Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View>
            <Skeleton height={200} borderRadius={16} />
            <Skeleton height={200} borderRadius={16} style={{ marginTop: 12 }} />
          </View>
        ) : safeProfessionals.length > 0 ? (
          safeProfessionals.map((pro, index) => (
            <ProCard
              key={pro.id ? `pro-${pro.id}` : `pro-idx-${index}`}
              professional={pro}
              onPressProfile={() => navigation.navigate('PublicProfile', { id: pro.id })}
              onPressBook={() => navigation.navigate('Booking', { proId: pro.id })}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No professionals found matching your search or location criteria.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 68,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  clearFilterBtn: {
    padding: 2,
    marginLeft: 4,
  },
  chipsScroll: {
    marginTop: 10,
  },
  filterDrawer: {
    padding: 18,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
