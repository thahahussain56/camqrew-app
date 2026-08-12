import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { bookingApi } from '../../api/bookingApi';
import { ProfessionalProfile, ServiceItem } from '../../types/professional';
import { StepperProgress } from '../../components/ui/StepperProgress';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { DatePickerModal } from '../../components/ui/DatePickerModal';
import { TimePickerModal } from '../../components/ui/TimePickerModal';
import { Calendar, Clock, MapPin, CheckCircle, ChevronDown } from 'lucide-react-native';

const STEP_TITLES = ['Select Service', 'Date & Time & Location', 'Review Package', 'Payment'];

import { useAuthStore } from '../../store/authStore';

export const BookingScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const proId = route?.params?.proId || 'mohammad_thaha_hussain_2';

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [isConfirmed, setIsConfirmed] = useState(false);

  // Booking Form State
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [startDate, setStartDate] = useState('15/08/2026');
  const [endDate, setEndDate] = useState('15/08/2026');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [daysCount, setDaysCount] = useState(1);
  const [location, setLocation] = useState('Bandra Studio 4, Mumbai');
  const [eventType, setEventType] = useState('Wedding');
  const [notes, setNotes] = useState('');

  // Contract Signature State
  const [contractSignature, setContractSignature] = useState(user?.name || 'Karan Malhotra');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Picker Modal Controls
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

  useEffect(() => {
    professionalApi.getProfileById(proId).then(p => {
      setProfile(p);
      if (p && p.services && p.services.length > 0) setSelectedService(p.services[0]);
    });
  }, [proId]);

  useEffect(() => {
    try {
      const p1 = startDate.split('/');
      const p2 = endDate.split('/');
      if (p1.length === 3 && p2.length === 3) {
        const d1 = new Date(parseInt(p1[2]), parseInt(p1[1]) - 1, parseInt(p1[0]));
        const d2 = new Date(parseInt(p2[2]), parseInt(p2[1]) - 1, parseInt(p2[0]));
        const diffDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setDaysCount(diffDays > 0 ? diffDays : 1);
      }
    } catch (e) {
      setDaysCount(1);
    }
  }, [startDate, endDate]);

  if (!profile) return null;

  const calculateTotal = () => {
    const rate = selectedService ? selectedService.rate : profile.ratePerDay || 15000;
    const subtotal = rate * daysCount;
    const platformFee = 499;
    const gst = Math.round((subtotal + platformFee) * 0.18);
    const total = subtotal + platformFee + gst;
    return { subtotal, platformFee, gst, total };
  };

  const handleNext = async () => {
    if (currentStep === 3) {
      if (!contractSignature.trim()) {
        Alert.alert('Required', 'Please type your digital signature before proceeding.');
        return;
      }
      if (!agreedToTerms) {
        Alert.alert('Required', 'Please agree to the service contract terms.');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      try {
        const totals = calculateTotal();
        await bookingApi.createBooking({
          professionalId: profile.id,
          professionalName: profile.name,
          professionalAvatar: profile.avatar,
          professionalTitle: profile.title,
          customerId: user?.id || 'usr_client',
          customerName: user?.name || 'Client Request',
          serviceTitle: selectedService?.title || 'Studio Shoot',
          startDate,
          endDate,
          startTime,
          endTime,
          daysCount,
          location,
          ratePerDay: selectedService?.rate || profile.ratePerDay || 15000,
          totalAmount: totals.total,
          contractSignature,
          contractTermsText: 'Standard Camcrew Creative Service Agreement',
          contractSignedAt: new Date().toISOString(),
          milestones: [
            { id: 'm1', title: 'Advance Escrow (30%)', percentage: 30, amount: Math.round(totals.total * 0.3), status: 'held' },
            { id: 'm2', title: 'Shoot Wrap Escrow (40%)', percentage: 40, amount: Math.round(totals.total * 0.4), status: 'held' },
            { id: 'm3', title: 'Final Deliverables Escrow (30%)', percentage: 30, amount: Math.round(totals.total * 0.3), status: 'held' },
          ],
        });

        setLoading(false);
        setIsConfirmed(true);

        // Auto redirect to Profile tab after 2 seconds
        setTimeout(() => {
          navigation.navigate('ProfileTab');
        }, 2000);
      } catch (e) {
        setLoading(false);
        setToastMessage('Booking failed. Please try again.');
      }
    }
  };

  const totals = calculateTotal();

  if (isConfirmed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Card style={{ width: '100%', alignItems: 'center', padding: 24, borderRadius: 24 }}>
          <CheckCircle size={64} color="#fc8019" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' }}>
            Booking Request Sent! 🎉
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Your shoot request has been sent to <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{profile.name}</Text>.
          </Text>

          <View style={{ width: '100%', marginVertical: 16, padding: 14, borderRadius: 14, backgroundColor: colors.background }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              Service: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{selectedService?.title}</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              Shoot Date: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{startDate} ({startTime})</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Status: <Text style={{ color: '#fc8019', fontWeight: '800' }}>⏳ Pending Creator Approval</Text>
            </Text>
          </View>

          <Button
            title="Open Chat with Creator 💬"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('Chat', { creatorId: profile.id, creatorName: profile.name, isPaidUnlocked: true })}
            style={{ width: '100%', backgroundColor: '#fc8019', marginTop: 12 }}
          />

          <Button
            title="View My Bookings"
            variant="ghost"
            size="md"
            onPress={() => navigation.navigate('ProfileTab')}
            style={{ marginTop: 8 }}
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toastMessage} message={toastMessage} type="success" onDismiss={() => setToastMessage('')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Book {profile.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{profile.title}</Text>
        </View>

        <StepperProgress currentStep={currentStep} totalSteps={4} stepTitles={STEP_TITLES} />

        {currentStep === 1 && (
          <View>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Select Service / Package</Text>
            {(profile.services && profile.services.length > 0 ? profile.services : [
              {
                id: 'srv_default',
                title: 'Full Day Shoot Package',
                category: profile.categories[0] || 'Photography',
                rate: profile.ratePerDay || 15000,
                unit: 'per day',
                description: 'Includes full day studio photography/videography coverage with high resolution deliverables.',
              }
            ]).map(srv => {
              const isSelected = selectedService?.id === srv.id;
              return (
                <TouchableOpacity
                  key={srv.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedService(srv)}
                  style={[
                    styles.serviceSelectBox,
                    {
                      backgroundColor: isSelected ? 'rgba(252,128,25,0.08)' : colors.surfaceCard,
                      borderColor: isSelected ? '#fc8019' : colors.border,
                    },
                  ]}
                >
                  <View style={styles.srvHeader}>
                    <Text style={[styles.srvTitle, { color: colors.textPrimary }]}>{srv.title}</Text>
                    <Text style={[styles.srvRate, { color: '#fc8019' }]}>
                      ₹{(srv.rate || 15000).toLocaleString('en-IN')}/{srv.unit}
                    </Text>
                  </View>
                  <Text style={[styles.srvDesc, { color: colors.textSecondary }]}>{srv.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {currentStep === 2 && (
          <View>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Shoot Schedule & Location</Text>

            {/* Date Pickers (DD/MM/YYYY) */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Shoot Dates (DD/MM/YYYY)</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                onPress={() => setShowStartDateModal(true)}
              >
                <Calendar size={16} color="#fc8019" style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerSub, { color: colors.textFaint }]}>Start Date</Text>
                  <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{startDate}</Text>
                </View>
                <ChevronDown size={16} color={colors.textFaint} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                onPress={() => setShowEndDateModal(true)}
              >
                <Calendar size={16} color="#fc8019" style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerSub, { color: colors.textFaint }]}>End Date</Text>
                  <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{endDate}</Text>
                </View>
                <ChevronDown size={16} color={colors.textFaint} />
              </TouchableOpacity>
            </View>

            {/* Time Pickers (Start Time & End Time) */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>Shoot Hours (Time)</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                onPress={() => setShowStartTimeModal(true)}
              >
                <Clock size={16} color="#fc8019" style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerSub, { color: colors.textFaint }]}>Start Time</Text>
                  <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{startTime}</Text>
                </View>
                <ChevronDown size={16} color={colors.textFaint} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                onPress={() => setShowEndTimeModal(true)}
              >
                <Clock size={16} color="#fc8019" style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerSub, { color: colors.textFaint }]}>End Time</Text>
                  <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{endTime}</Text>
                </View>
                <ChevronDown size={16} color={colors.textFaint} />
              </TouchableOpacity>
            </View>

            <Input
              label="Shoot Location & Venue Address"
              value={location}
              onChangeText={setLocation}
              leftIcon={<MapPin size={18} color={colors.textSecondary} />}
              style={{ marginTop: 12 }}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>Event / Project Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {['Wedding', 'Corporate', 'Birthday/Party', 'Product Launch', 'Short Film', 'Drone Shoot', 'Podcast'].map(ev => {
                const isSel = eventType === ev;
                return (
                  <TouchableOpacity
                    key={ev}
                    onPress={() => setEventType(ev)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isSel ? '#fc8019' : colors.surfaceCard,
                      borderWidth: 1,
                      borderColor: isSel ? '#fc8019' : colors.border,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: isSel ? '#ffffff' : colors.textPrimary, fontSize: 12, fontWeight: '800' }}>
                      {ev}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Input
              label="Special Notes / Instructions"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ height: 70 }}
            />
          </View>
        )}

        {currentStep === 3 && (
          <View>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Contract Agreement & Terms</Text>

            {/* Service Contract Document Box */}
            <Card style={[styles.breakdownCard, { backgroundColor: colors.surfaceCard }]}>
              <Text style={{ color: '#fc8019', fontWeight: '900', fontSize: 14, marginBottom: 6 }}>
                📜 CAMCREW CREATIVE SERVICE CONTRACT
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>
                This agreement is entered into between {user?.name || 'Client'} ("Client") and {profile.name} ("Creator").
                The Creator agrees to provide {selectedService?.title || 'Creative Services'} on {startDate} in {location}.
                All deliverables will be held in Escrow Protection until final milestone release.
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <Input
                label="Digital Signature (Type Full Legal Name)"
                placeholder="e.g. Karan Malhotra"
                value={contractSignature}
                onChangeText={setContractSignature}
              />

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: agreedToTerms ? '#fc8019' : colors.textFaint,
                    backgroundColor: agreedToTerms ? '#fc8019' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  {agreedToTerms && <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>✓</Text>}
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>
                  I agree to the terms of the Camcrew Service Contract.
                </Text>
              </TouchableOpacity>
            </Card>

            {/* Financial Summary */}
            <Card style={[styles.breakdownCard, { marginTop: 12 }]}>
              <View style={styles.calcRow}>
                <Text style={{ color: colors.textSecondary }}>Service Base Rate</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>₹{totals.subtotal.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={{ color: colors.textSecondary }}>Platform Safety Fee</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>₹{totals.platformFee}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={{ color: colors.textSecondary }}>GST (18%)</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>₹{totals.gst.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.calcRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: 16 }}>Total Payable</Text>
                <Text style={{ color: '#fc8019', fontWeight: '900', fontSize: 19 }}>₹{totals.total.toLocaleString('en-IN')}</Text>
              </View>
            </Card>
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.paymentBox}>
            <CheckCircle size={48} color="#fc8019" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.payTitle, { color: colors.textPrimary }]}>Send Booking Request</Text>
            <Text style={[styles.paySub, { color: colors.textSecondary }]}>
              No upfront payment is required! Your request will be sent directly to {profile.name}. Once the creator accepts your request, you will receive a notification to complete payment of ₹{totals.total.toLocaleString('en-IN')}.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <Button
              title="Back"
              variant="secondary"
              size="lg"
              onPress={() => setCurrentStep(currentStep - 1)}
              style={{ flex: 1, marginRight: 10 }}
            />
          )}
          <Button
            title={currentStep === 4 ? 'Submit Request (No Payment)' : 'Continue'}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleNext}
            style={{ flex: 1, backgroundColor: '#fc8019' }}
          />
        </View>
      </ScrollView>

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showStartDateModal}
        onClose={() => setShowStartDateModal(false)}
        onSelectDate={setStartDate}
        selectedDate={startDate}
        blockedDates={profile.blockedDates || []}
        title="Select Shoot Start Date"
      />
      <DatePickerModal
        visible={showEndDateModal}
        onClose={() => setShowEndDateModal(false)}
        onSelectDate={setEndDate}
        selectedDate={endDate}
        blockedDates={profile.blockedDates || []}
        title="Select Shoot End Date"
      />

      {/* Time Picker Modals */}
      <TimePickerModal
        visible={showStartTimeModal}
        onClose={() => setShowStartTimeModal(false)}
        onSelectTime={setStartTime}
        selectedTime={startTime}
        title="Select Shoot Start Time"
      />
      <TimePickerModal
        visible={showEndTimeModal}
        onClose={() => setShowEndTimeModal(false)}
        onSelectTime={setEndTime}
        selectedTime={endTime}
        title="Select Shoot End Time"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 68,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  serviceSelectBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  srvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  srvTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  srvRate: {
    fontSize: 15,
    fontWeight: '900',
  },
  srvDesc: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerSub: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pickerVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  breakdownCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  metaRow: {
    fontSize: 14,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  paymentBox: {
    padding: 24,
    alignItems: 'center',
  },
  payTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  paySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
});
