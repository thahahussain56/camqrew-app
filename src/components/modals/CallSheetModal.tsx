import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Booking } from '../../types/booking';
import { callSheetApi } from '../../api/callSheetApi';
import { CallSheet, ScheduleItem, CrewMember } from '../../types/callSheet';
import { 
  X, 
  Share2, 
  Save, 
  Clock, 
  MapPin, 
  Phone, 
  Plus, 
  Trash2, 
  ExternalLink,
  FileText
} from 'lucide-react-native';

interface CallSheetModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export const CallSheetModal: React.FC<CallSheetModalProps> = ({
  visible,
  booking,
  onClose,
}) => {
  const { colors } = useTheme();
  const [sheet, setSheet] = useState<CallSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && booking?.id) {
      loadCallSheet();
    }
  }, [visible, booking?.id]);

  const loadCallSheet = async () => {
    if (!booking?.id) return;
    setLoading(true);
    try {
      const data = await callSheetApi.getCallSheetForBooking(booking.id);
      setSheet(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load call sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sheet) return;
    setSaving(true);
    try {
      const updated = await callSheetApi.saveCallSheet(sheet);
      setSheet(updated);
      Alert.alert('Saved', 'Call sheet updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save call sheet.');
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!sheet) return;
    await callSheetApi.shareCallSheetViaWhatsApp(sheet);
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMaps = () => {
    if (!sheet?.googleMapsUrl) return;
    Linking.openURL(sheet.googleMapsUrl);
  };

  const handleAddScheduleItem = () => {
    if (!sheet) return;
    const newItem: ScheduleItem = {
      id: String(Date.now()),
      time: '12:00 PM',
      event: 'New Scene / Sequence',
      location: sheet.locationName || 'Venue Floor',
      notes: '',
    };
    setSheet({ ...sheet, scheduleItems: [...sheet.scheduleItems, newItem] });
  };

  const handleRemoveScheduleItem = (id: string) => {
    if (!sheet) return;
    setSheet({ ...sheet, scheduleItems: sheet.scheduleItems.filter(i => i.id !== id) });
  };

  const handleAddCrew = () => {
    if (!sheet) return;
    const newCrew: CrewMember = {
      id: String(Date.now()),
      name: '',
      role: 'Production Crew',
      phone: '',
      callTime: sheet.generalCallTime || '08:00 AM',
    };
    setSheet({ ...sheet, crewMembers: [...sheet.crewMembers, newCrew] });
  };

  const handleRemoveCrew = (id: string) => {
    if (!sheet) return;
    setSheet({ ...sheet, crewMembers: sheet.crewMembers.filter(c => c.id !== id) });
  };

  if (!booking) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FileText size={18} color={colors.accent} />
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Production Call Sheet
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {booking.serviceTitle} • {booking.startDate}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Action Bar */}
          <View style={[styles.actionBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity 
              style={[styles.actionPill, { backgroundColor: '#25D366' }]}
              onPress={handleWhatsApp}
            >
              <Share2 size={14} color="#fff" />
              <Text style={styles.actionPillTextWhite}>Share WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionPill, { backgroundColor: colors.accent }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Save size={14} color="#000" />
                  <Text style={styles.actionPillTextBlack}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Content ScrollView */}
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading call sheet...</Text>
              </View>
            ) : !sheet ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Could not load call sheet.</Text>
            ) : (
              <View style={{ gap: 16 }}>
                
                {/* General Info Card */}
                <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
                  <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Production Details</Text>
                  
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Project Title</Text>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.borderLight }]}
                      value={sheet.title}
                      onChangeText={t => setSheet({ ...sheet, title: t })}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>General Call Time</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.borderLight, fontWeight: '700' }]}
                        value={sheet.generalCallTime}
                        onChangeText={t => setSheet({ ...sheet, generalCallTime: t })}
                      />
                    </View>

                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Emergency Contact</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.borderLight }]}
                        value={sheet.emergencyContact || ''}
                        onChangeText={t => setSheet({ ...sheet, emergencyContact: t })}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Venue & Location</Text>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.borderLight }]}
                      value={sheet.locationName}
                      onChangeText={t => setSheet({ ...sheet, locationName: t })}
                    />
                  </View>

                  {sheet.googleMapsUrl ? (
                    <TouchableOpacity style={styles.mapBtn} onPress={handleOpenMaps}>
                      <MapPin size={14} color={colors.accent} />
                      <Text style={[styles.mapBtnText, { color: colors.accent }]}>Open Venue in Google Maps</Text>
                      <ExternalLink size={12} color={colors.accent} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Timeline Card */}
                <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Timeline & Schedule</Text>
                    <TouchableOpacity style={[styles.addSmallBtn, { borderColor: colors.accent }]} onPress={handleAddScheduleItem}>
                      <Plus size={12} color={colors.accent} />
                      <Text style={[styles.addSmallBtnText, { color: colors.accent }]}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {sheet.scheduleItems.map((item, idx) => (
                    <View key={item.id} style={[styles.timelineItem, { borderBottomColor: colors.borderLight }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TextInput 
                          style={[styles.timeInput, { color: colors.accent }]}
                          value={item.time}
                          onChangeText={t => {
                            const next = [...sheet.scheduleItems];
                            next[idx].time = t;
                            setSheet({ ...sheet, scheduleItems: next });
                          }}
                        />
                        <TouchableOpacity onPress={() => handleRemoveScheduleItem(item.id)}>
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      <TextInput 
                        style={[styles.eventInput, { color: colors.textPrimary }]}
                        value={item.event}
                        placeholder="Event name"
                        placeholderTextColor={colors.textSecondary}
                        onChangeText={t => {
                          const next = [...sheet.scheduleItems];
                          next[idx].event = t;
                          setSheet({ ...sheet, scheduleItems: next });
                        }}
                      />

                      <TextInput 
                        style={[styles.notesInput, { color: colors.textSecondary }]}
                        value={item.notes || ''}
                        placeholder="Camera / lens / audio notes..."
                        placeholderTextColor={colors.textSecondary}
                        onChangeText={t => {
                          const next = [...sheet.scheduleItems];
                          next[idx].notes = t;
                          setSheet({ ...sheet, scheduleItems: next });
                        }}
                      />
                    </View>
                  ))}
                </View>

                {/* Crew Directory */}
                <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Crew Roster</Text>
                    <TouchableOpacity style={[styles.addSmallBtn, { borderColor: colors.accent }]} onPress={handleAddCrew}>
                      <Plus size={12} color={colors.accent} />
                      <Text style={[styles.addSmallBtnText, { color: colors.accent }]}>Add Crew</Text>
                    </TouchableOpacity>
                  </View>

                  {sheet.crewMembers.map((m, idx) => (
                    <View key={m.id} style={[styles.crewRow, { borderBottomColor: colors.borderLight }]}>
                      <View style={{ flex: 1 }}>
                        <TextInput 
                          style={[styles.crewNameInput, { color: colors.textPrimary }]}
                          value={m.name}
                          placeholder="Member Name"
                          placeholderTextColor={colors.textSecondary}
                          onChangeText={t => {
                            const next = [...sheet.crewMembers];
                            next[idx].name = t;
                            setSheet({ ...sheet, crewMembers: next });
                          }}
                        />
                        <TextInput 
                          style={[styles.crewRoleInput, { color: colors.textSecondary }]}
                          value={m.role}
                          placeholder="Production Role"
                          placeholderTextColor={colors.textSecondary}
                          onChangeText={t => {
                            const next = [...sheet.crewMembers];
                            next[idx].role = t;
                            setSheet({ ...sheet, crewMembers: next });
                          }}
                        />
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {m.phone ? (
                          <TouchableOpacity 
                            style={[styles.callBtn, { backgroundColor: colors.surfaceElevated }]}
                            onPress={() => handleCall(m.phone)}
                          >
                            <Phone size={14} color={colors.accent} />
                          </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity onPress={() => handleRemoveCrew(m.id)}>
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Notes & Rules Card */}
                <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
                  <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Basecamp Notes & Rules</Text>
                  <TextInput 
                    style={[styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.borderLight }]}
                    multiline={true}
                    numberOfLines={4}
                    value={sheet.notesAndRules || ''}
                    onChangeText={t => setSheet({ ...sheet, notesAndRules: t })}
                    placeholder="Dress code, power outlets, drone regulations, catering details..."
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

              </View>
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionPillTextWhite: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionPillTextBlack: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timelineItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  timeInput: {
    fontSize: 12,
    fontWeight: '800',
  },
  eventInput: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 2,
  },
  notesInput: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  crewNameInput: {
    fontSize: 13,
    fontWeight: '700',
  },
  crewRoleInput: {
    fontSize: 11,
  },
  callBtn: {
    padding: 8,
    borderRadius: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
  },
});
