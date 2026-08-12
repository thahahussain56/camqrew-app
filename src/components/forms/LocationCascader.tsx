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
}

export const LocationCascader: React.FC<LocationCascaderProps> = ({
  selectedState,
  selectedDistrict,
  selectedCity,
  onSelect,
}) => {
  const { colors } = useTheme();
  const { states, getDistricts, getCities } = useIndiaLocations();

  const [activeModal, setActiveModal] = useState<'state' | 'district' | 'city' | null>(null);
  const [filterSearch, setFilterSearch] = useState('');

  const districts = selectedState ? ['All Districts', ...getDistricts(selectedState)] : [];
  const cities = selectedState && selectedDistrict && selectedDistrict !== 'All Districts'
    ? ['All Cities', ...getCities(selectedState, selectedDistrict)]
    : [];

  const handleOpenModal = (modalType: 'state' | 'district' | 'city') => {
    setFilterSearch('');
    setActiveModal(modalType);
  };

  const getFilteredList = () => {
    const query = filterSearch.toLowerCase();
    if (activeModal === 'state') {
      const allStates = ['All States', ...states];
      return allStates.filter(s => s.toLowerCase().includes(query));
    }
    if (activeModal === 'district') {
      return districts.filter(d => d.toLowerCase().includes(query));
    }
    if (activeModal === 'city') {
      return cities.filter(c => c.toLowerCase().includes(query));
    }
    return [];
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Filter Location (State → District → City)</Text>

      <View style={styles.selectorsRow}>
        {/* State Selector */}
        <TouchableOpacity
          style={[styles.picker, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={() => handleOpenModal('state')}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickerLabel, { color: colors.textFaint }]}>STATE</Text>
            <Text style={[styles.pickerText, { color: selectedState ? colors.textPrimary : colors.textFaint }]} numberOfLines={1}>
              {selectedState || 'All States'}
            </Text>
          </View>
          <ChevronDown size={14} color="#fc8019" />
        </TouchableOpacity>

        {/* District Selector */}
        <TouchableOpacity
          style={[
            styles.picker,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: selectedState ? 1 : 0.5 },
          ]}
          onPress={() => selectedState && handleOpenModal('district')}
          disabled={!selectedState}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickerLabel, { color: colors.textFaint }]}>DISTRICT</Text>
            <Text style={[styles.pickerText, { color: selectedDistrict ? colors.textPrimary : colors.textFaint }]} numberOfLines={1}>
              {selectedDistrict || 'All Districts'}
            </Text>
          </View>
          <ChevronDown size={14} color="#fc8019" />
        </TouchableOpacity>

        {/* City Selector */}
        <TouchableOpacity
          style={[
            styles.picker,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: selectedDistrict && selectedDistrict !== 'All Districts' ? 1 : 0.5 },
          ]}
          onPress={() => selectedDistrict && selectedDistrict !== 'All Districts' && handleOpenModal('city')}
          disabled={!selectedDistrict || selectedDistrict === 'All Districts'}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickerLabel, { color: colors.textFaint }]}>CITY</Text>
            <Text style={[styles.pickerText, { color: selectedCity ? colors.textPrimary : colors.textFaint }]} numberOfLines={1}>
              {selectedCity || 'All Cities'}
            </Text>
          </View>
          <ChevronDown size={14} color="#fc8019" />
        </TouchableOpacity>
      </View>

      {/* Cascader Options Modal */}
      <Modal visible={activeModal !== null} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Select {activeModal === 'state' ? 'State' : activeModal === 'district' ? 'District' : 'City'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Filter Search Input */}
            <View style={[styles.searchBox, { backgroundColor: colors.background }]}>
              <Search size={16} color={colors.textFaint} style={{ marginLeft: 10 }} />
              <TextInput
                placeholder={`Search ${activeModal}...`}
                placeholderTextColor={colors.textFaint}
                value={filterSearch}
                onChangeText={setFilterSearch}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
            </View>

            {/* Options List */}
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {getFilteredList().map(item => {
                const isSelected =
                  (activeModal === 'state' && (selectedState === item || (!selectedState && item === 'All States'))) ||
                  (activeModal === 'district' && (selectedDistrict === item || (!selectedDistrict && item === 'All Districts'))) ||
                  (activeModal === 'city' && (selectedCity === item || (!selectedCity && item === 'All Cities')));

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.optionRow,
                      isSelected && { backgroundColor: 'rgba(252,128,25,0.1)' },
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
                    <MapPin size={16} color={isSelected ? '#fc8019' : colors.textFaint} style={{ marginRight: 10 }} />
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? '#fc8019' : colors.textPrimary, fontWeight: isSelected ? '800' : '600' },
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && <Check size={16} color="#fc8019" style={{ marginLeft: 'auto' }} />}
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
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
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
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
    alignItems: 'center',
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
