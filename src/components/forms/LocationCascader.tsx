import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useIndiaLocations } from '../../hooks/useIndiaLocations';
import { ChevronDown, MapPin, Search, X, Check } from 'lucide-react-native';

interface LocationCascaderProps {
  selectedState: string;
  selectedDistrict: string;
  selectedCity: string;
  onSelect: (state: string, district: string, city: string) => void;
  label?: string;
  allowAll?: boolean;
  required?: boolean;
}

export const LocationCascader: React.FC<LocationCascaderProps> = ({
  selectedState,
  selectedDistrict,
  selectedCity,
  onSelect,
  label = 'Location (State → District → City/Town)',
  allowAll = false,
  required = false,
}) => {
  const { colors } = useTheme();
  const { states, getDistricts, getCities } = useIndiaLocations();

  const [activeModal, setActiveModal] = useState<'state' | 'district' | 'city' | null>(null);
  const [filterSearch, setFilterSearch] = useState('');

  const rawDistricts = selectedState ? getDistricts(selectedState) : [];
  const districts = allowAll
    ? (selectedState ? ['All Districts', ...rawDistricts] : [])
    : rawDistricts;

  const rawCities = selectedState && selectedDistrict && selectedDistrict !== 'All Districts'
    ? getCities(selectedState, selectedDistrict)
    : [];
  const cities = allowAll
    ? (selectedDistrict && selectedDistrict !== 'All Districts' ? ['All Cities', ...rawCities] : [])
    : rawCities;

  const handleOpenModal = (modalType: 'state' | 'district' | 'city') => {
    setFilterSearch('');
    setActiveModal(modalType);
  };

  const getFilteredList = () => {
    const query = filterSearch.toLowerCase().trim();
    if (activeModal === 'state') {
      const stateList = allowAll ? ['All States', ...states] : states;
      return stateList.filter(s => s.toLowerCase().includes(query));
    }
    if (activeModal === 'district') {
      return districts.filter(d => d.toLowerCase().includes(query));
    }
    if (activeModal === 'city') {
      return cities.filter(c => c.toLowerCase().includes(query));
    }
    return [];
  };

  const hasFullSelection = selectedState && selectedDistrict && selectedCity;

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label} {required && <Text style={{ color: colors.accent }}>*</Text>}
        </Text>
      ) : null}

      <View style={styles.selectorsRow}>
        {/* 1. State Selector */}
        <TouchableOpacity
          style={[styles.picker, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={() => handleOpenModal('state')}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1, marginRight: 4 }}>
            <Text style={[styles.pickerLabel, { color: colors.textFaint }]}>STATE</Text>
            <Text
              style={[
                styles.pickerText,
                { color: selectedState ? colors.textPrimary : colors.textFaint }
              ]}
              numberOfLines={1}
            >
              {selectedState || (allowAll ? 'All States' : 'Select State')}
            </Text>
          </View>
          <ChevronDown size={14} color="#3fb668" />
        </TouchableOpacity>

        {/* 2. District Selector */}
        <TouchableOpacity
          style={[
            styles.picker,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              opacity: selectedState ? 1 : 0.5,
            },
          ]}
          onPress={() => selectedState && handleOpenModal('district')}
          disabled={!selectedState}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1, marginRight: 4 }}>
            <Text style={[styles.pickerLabel, { color: colors.textFaint }]}>DISTRICT</Text>
            <Text
              style={[
                styles.pickerText,
                { color: selectedDistrict ? colors.textPrimary : colors.textFaint }
              ]}
              numberOfLines={1}
            >
              {selectedDistrict || (allowAll ? 'All Districts' : 'Select District')}
            </Text>
          </View>
          <ChevronDown size={14} color="#3fb668" />
        </TouchableOpacity>

        {/* 3. City/Town Selector */}
        <TouchableOpacity
          style={[
            styles.picker,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              opacity: selectedDistrict && selectedDistrict !== 'All Districts' ? 1 : 0.5,
            },
          ]}
          onPress={() => selectedDistrict && selectedDistrict !== 'All Districts' && handleOpenModal('city')}
          disabled={!selectedDistrict || selectedDistrict === 'All Districts'}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1, marginRight: 4 }}>
            <Text style={[styles.pickerLabel, { color: colors.textFaint }]}>CITY / TOWN</Text>
            <Text
              style={[
                styles.pickerText,
                { color: selectedCity ? colors.textPrimary : colors.textFaint }
              ]}
              numberOfLines={1}
            >
              {selectedCity || (allowAll ? 'All Cities' : 'Select City')}
            </Text>
          </View>
          <ChevronDown size={14} color="#3fb668" />
        </TouchableOpacity>
      </View>

      {/* Selected Location Confirmation Pill */}
      {hasFullSelection && (
        <View style={[styles.selectedPill, { backgroundColor: colors.accentGlow }]}>
          <MapPin size={13} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.selectedPillText, { color: colors.accent }]} numberOfLines={1}>
            {selectedCity}, {selectedDistrict}, {selectedState}
          </Text>
        </View>
      )}

      {/* Cascader Options Modal */}
      <Modal visible={activeModal !== null} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Select {activeModal === 'state' ? 'State' : activeModal === 'district' ? 'District' : 'City or Town'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>
                  {activeModal === 'state'
                    ? '28 States & 8 Union Territories of India'
                    : activeModal === 'district'
                    ? `Districts in ${selectedState}`
                    : `Cities & Towns in ${selectedDistrict}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Filter Search Input */}
            <View style={[styles.searchBox, { backgroundColor: colors.background }]}>
              <Search size={16} color={colors.textFaint} style={{ marginLeft: 10 }} />
              <TextInput
                placeholder={`Search ${activeModal === 'city' ? 'city or town' : activeModal}...`}
                placeholderTextColor={colors.textFaint}
                value={filterSearch}
                onChangeText={setFilterSearch}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                autoCapitalize="words"
              />
              {filterSearch.length > 0 && (
                <TouchableOpacity onPress={() => setFilterSearch('')} style={{ padding: 8 }}>
                  <X size={14} color={colors.textFaint} />
                </TouchableOpacity>
              )}
            </View>

            {/* Options List */}
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {getFilteredList().length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.textFaint, fontSize: 14 }}>No matches found for "{filterSearch}"</Text>
                </View>
              ) : (
                getFilteredList().map(item => {
                  const isSelected =
                    (activeModal === 'state' && (selectedState === item || (!selectedState && item === 'All States'))) ||
                    (activeModal === 'district' && (selectedDistrict === item || (!selectedDistrict && item === 'All Districts'))) ||
                    (activeModal === 'city' && (selectedCity === item || (!selectedCity && item === 'All Cities')));

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.optionRow,
                        isSelected && { backgroundColor: 'rgba(63, 182, 104, 0.12)' },
                      ]}
                      onPress={() => {
                        if (activeModal === 'state') {
                          if (item === 'All States') {
                            onSelect('', '', '');
                          } else {
                            const dists = getDistricts(item);
                            const firstDist = dists[0] || '';
                            const firstCity = getCities(item, firstDist)[0] || '';
                            onSelect(item, firstDist, firstCity);
                          }
                          setActiveModal(null);
                        } else if (activeModal === 'district') {
                          if (item === 'All Districts') {
                            onSelect(selectedState, '', '');
                          } else {
                            const firstCity = getCities(selectedState, item)[0] || '';
                            onSelect(selectedState, item, firstCity);
                          }
                          setActiveModal(null);
                        } else if (activeModal === 'city') {
                          onSelect(selectedState, selectedDistrict, item === 'All Cities' ? '' : item);
                          setActiveModal(null);
                        }
                      }}
                    >
                      <MapPin size={16} color={isSelected ? '#3fb668' : colors.textFaint} style={{ marginRight: 10 }} />
                      <Text
                        style={[
                          styles.optionText,
                          { color: isSelected ? '#3fb668' : colors.textPrimary, fontWeight: isSelected ? '800' : '600' },
                        ]}
                      >
                        {item}
                      </Text>
                      {isSelected && <Check size={16} color="#3fb668" style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  picker: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pickerText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  selectedPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  optionText: {
    fontSize: 14,
  },
});
