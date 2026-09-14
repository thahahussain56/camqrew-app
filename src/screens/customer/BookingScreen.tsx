import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { studioApi } from '../../api/studioApi';
import { bookingApi } from '../../api/bookingApi';
import { jobApi } from '../../api/jobApi';
import { ProfessionalProfile, ServiceItem } from '../../types/professional';
import { StepperProgress } from '../../components/ui/StepperProgress';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { DatePickerModal } from '../../components/ui/DatePickerModal';
import { TimePickerModal } from '../../components/ui/TimePickerModal';
import { Calendar, Clock, MapPin, CheckCircle, ChevronDown, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { formatLocationString } from '../../constants/locations';
import { useLocationStore } from '../../store/locationStore';

const { width } = Dimensions.get('window');

const STEP_TITLES = ['Select Service', 'Schedule & Location', 'Review Package', 'Send Request'];

export const BookingScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  
  const proId = route?.params?.proId || route?.params?.professionalId;
  const bookingType = route?.params?.type || 'professionals'; // 'professionals' | 'studios'
  const isStudio = bookingType === 'studios';

  const jobId = route?.params?.jobId;
  const jobTitle = route?.params?.jobTitle;
  const jobBudget = route?.params?.jobBudget ? Number(route?.params?.jobBudget) : null;
  const jobLocation = route?.params?.jobLocation;
  const jobRequirements = route?.params?.jobRequirements;
  const passedJobState = route?.params?.jobState;
  const passedJobDistrict = route?.params?.jobDistrict;
  const passedJobCity = route?.params?.jobCity;

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const [isConfirmed, setIsConfirmed] = useState(false);

  // Booking Form State
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [daysCount, setDaysCount] = useState(1);
  const [location, setLocation] = useState('');
  const { selectedCity: storeLocation } = useLocationStore();
  const [shootState, setShootState] = useState(storeLocation?.state || 'Karnataka');
  const [shootDistrict, setShootDistrict] = useState(storeLocation?.district || 'Dakshina Kannada');
  const [shootCity, setShootCity] = useState(storeLocation?.city || 'Mangalore');
  const [venueAddress, setVenueAddress] = useState('');
  const [eventType, setEventType] = useState('Production');
  const [notes, setNotes] = useState('');

  const resolvedLocation = isStudio
    ? location
    : (venueAddress.trim()
      ? `${venueAddress.trim()}, ${formatLocationString(shootCity, shootDistrict, shootState)}`
      : formatLocationString(shootCity, shootDistrict, shootState));

  // Contract Signature State
  const [contractSignature, setContractSignature] = useState(user?.name || '');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Picker Modal Controls
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

  useEffect(() => {
    if (!proId) return;
    setPageLoading(true);

    const fetcher = isStudio 
      ? studioApi.getStudioById(proId)
      : professionalApi.getProfileById(proId);

    fetcher.then(p => {
      setProfile(p);
      if (jobBudget) {
        setSelectedService({
          id: `srv_broadcast_${jobId || 'job'}`,
          title: jobTitle || 'Custom Broadcast Job',
          category: 'Broadcast Lead',
          rate: jobBudget,
          unit: 'Fixed Package',
          type: 'package',
          description: jobRequirements || 'Agreed broadcast job requirements',
        });
      } else if (p && p.services && p.services.length > 0) {
        setSelectedService(p.services[0]);
      }
      
      // Default dates to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomStr = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;
      setStartDate(tomStr);
      setEndDate(tomStr);
      
      if (isStudio) {
        setLocation(p.name + ', ' + p.city); // Pre-fill studio location
      } else {
        if (passedJobState) setShootState(passedJobState);
        if (passedJobDistrict) setShootDistrict(passedJobDistrict);
        if (passedJobCity) setShootCity(passedJobCity);
        if (jobLocation) setLocation(jobLocation);
        if (jobRequirements) setNotes(jobRequirements);
      }
    }).finally(() => {
      setPageLoading(false);
    });
  }, [proId, isStudio, jobId, jobBudget]);

  useEffect(() => {
    if (!startDate || !endDate) return;
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

  if (pageLoading || !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const calculateTotal = () => {
    const rate = jobBudget 
      ? jobBudget 
      : (selectedService ? selectedService.rate : profile.ratePerDay || 15000);
    const isFixedPackage = Boolean(jobBudget) || (selectedService?.type === 'package');
    const subtotal = isFixedPackage ? rate : (rate * daysCount);
    const platformFee = 499;
    const gst = Math.round((subtotal + platformFee) * 0.18);
    const total = subtotal + platformFee + gst;
    return { subtotal, platformFee, gst, total };
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!selectedService && (!profile.services || profile.services.length === 0)) {
        // Fallback default service is fine
      } else if (!selectedService) {
        setToastMessage('Please select a package to proceed.');
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!startDate || !endDate) {
        setToastMessage('Please select your booking dates.');
        return;
      }
      if (isStudio && !location.trim()) {
        setToastMessage('Please enter studio location.');
        return;
      }
      if (!isStudio && (!shootState || !shootDistrict || !shootCity)) {
        setToastMessage('Please select shoot locality.');
        return;
      }
    }

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
        const payload: any = {
          professionalName: profile.name,
          professionalAvatar: profile.avatar,
          professionalTitle: profile.title,
          customerId: user?.id || 'usr_client',
          customerName: user?.name || 'Client Request',
          serviceTitle: selectedService?.title || (isStudio ? 'Studio Bay Rental' : 'Creative Service'),
          startDate,
          endDate,
          startTime,
          endTime,
          daysCount,
          location: resolvedLocation,
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
        };

        if (isStudio) {
          payload.studioId = profile.id;
        } else {
          payload.professionalId = profile.id;
        }

        const createdBooking = await bookingApi.createBooking(payload);

        if (jobId) {
          try {
            await jobApi.markJobBooked(jobId, createdBooking.id);
          } catch (mErr) {
            console.warn('Could not mark job booked:', mErr);
          }
        }

        setLoading(false);
        setIsConfirmed(true);

        setTimeout(() => {
          navigation.navigate('HomeTab');
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Card style={{ width: '100%', alignItems: 'center', padding: 30, borderRadius: 28, backgroundColor: colors.surfaceCard, shadowColor: colors.accent, shadowOpacity: 0.1, shadowRadius: 24, elevation: 10 }}>
          <LinearGradient colors={['rgba(63, 182, 104, 0.2)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, borderTopLeftRadius: 28, borderTopRightRadius: 28 }} />
          <CheckCircle size={72} color={colors.accent} style={{ marginBottom: 20 }} />
          <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' }}>
            Request Sent! 🎉
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22, fontWeight: '500' }}>
            Your request has been sent to <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{profile.name}</Text>.
          </Text>

          <View style={{ width: '100%', marginVertical: 20, padding: 16, borderRadius: 16, backgroundColor: colors.surfaceElevated }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
              Service: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{selectedService?.title || (isStudio ? 'Studio Booking' : 'Creative Service')}</Text>
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
              Date: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{startDate} ({startTime})</Text>
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Status: <Text style={{ color: colors.accent, fontWeight: '800' }}>⏳ Pending Approval</Text>
            </Text>
          </View>

          <Button
            title="Open Chat with Host 💬"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('ChatTab')}
            style={{ width: '100%', backgroundColor: colors.accent, marginTop: 8 }}
          />

          <Button
            title="View My Bookings"
            variant="ghost"
            size="md"
            onPress={() => navigation.navigate('ProfileTab')}
            style={{ marginTop: 12 }}
          />
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Toast visible={!!toastMessage} message={toastMessage} type="error" onDismiss={() => setToastMessage('')} />

        <View style={[styles.header, { backgroundColor: colors.surfaceCard }]}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigation.goBack()} style={[styles.backIcon, { backgroundColor: colors.surfaceElevated }]}>
              <ArrowLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Book {isStudio ? 'Studio' : 'Creator'}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{profile.name}</Text>
            </View>
          </View>
          <StepperProgress currentStep={currentStep} totalSteps={4} stepTitles={STEP_TITLES} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {currentStep === 1 && (
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              {jobId && (
                <View style={{ marginBottom: 16, padding: 14, borderRadius: 14, backgroundColor: colors.accentGlow, borderWidth: 1.5, borderColor: colors.accent }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <CheckCircle size={16} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Agreed Broadcast Lead Package
                    </Text>
                  </View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>
                    {jobTitle || 'Custom Broadcast Job'}
                  </Text>
                  <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 20, marginTop: 4 }}>
                    ₹{Number(jobBudget).toLocaleString('en-IN')}{' '}
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>(Fixed Agreed Price)</Text>
                  </Text>
                  {jobRequirements ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                      Requirements: {jobRequirements}
                    </Text>
                  ) : null}
                </View>
              )}

              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {jobId ? 'Selected Package' : 'Select Package'}
              </Text>
              {(selectedService && selectedService.id.startsWith('srv_broadcast_') ? [selectedService] : (profile.services && profile.services.length > 0 ? profile.services : [
                {
                  id: 'srv_default',
                  title: isStudio ? 'Full Day Studio Access' : 'Full Day Shoot Package',
                  category: isStudio ? 'Studio Rental' : (profile.categories[0] || 'Creative Service'),
                  rate: profile.ratePerDay || 15000,
                  unit: 'per day',
                  description: isStudio 
                    ? 'Includes full access to the studio bay, basic grip equipment, and green room.'
                    : 'Includes full day coverage with high resolution deliverables.',
                }
              ])).map(srv => {
                const isSelected = selectedService?.id === srv.id || (!selectedService && srv.id === 'srv_default');
                return (
                  <TouchableOpacity
                    key={srv.id}
                    activeOpacity={0.9}
                    onPress={() => {
                      setSelectedService(srv);
                      if (srv.type === 'package') {
                        setEndDate(startDate); // Sync to current start date immediately
                      }
                    }}
                    style={[
                      styles.serviceSelectBox,
                      { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' },
                      isSelected && { borderColor: colors.accent, elevation: 4, shadowColor: colors.accent, shadowOpacity: 0.15, shadowRadius: 12 },
                    ]}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[colors.accentGlow, 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                    <View style={styles.srvHeader}>
                      <Text style={[styles.srvTitle, { color: colors.textPrimary }]}>{srv.title}</Text>
                      <Text style={[styles.srvRate, { color: colors.accent }]}>
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
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Schedule Details</Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Booking Dates (DD/MM/YYYY)</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight, flex: 1 }]} onPress={() => setShowStartDateModal(true)}>
                  <Calendar size={16} color={colors.accent} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>{selectedService?.type === 'package' ? 'Package Date' : 'Start Date'}</Text>
                    <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{startDate}</Text>
                  </View>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {selectedService?.type !== 'package' && (
                  <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight, flex: 1 }]} onPress={() => setShowEndDateModal(true)}>
                    <Calendar size={16} color={colors.accent} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>End Date</Text>
                      <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{endDate}</Text>
                    </View>
                    <ChevronDown size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16, color: colors.textSecondary }]}>Booking Time (Hours)</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]} onPress={() => setShowStartTimeModal(true)}>
                  <Clock size={16} color={colors.accent} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>Check-in</Text>
                    <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{startTime}</Text>
                  </View>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]} onPress={() => setShowEndTimeModal(true)}>
                  <Clock size={16} color={colors.accent} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>Check-out</Text>
                    <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{endTime}</Text>
                  </View>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {isStudio ? (
                <Input
                  label="Studio Location / Address"
                  value={location}
                  onChangeText={setLocation}
                  leftIcon={<MapPin size={18} color={colors.textSecondary} />}
                  containerStyle={{ marginTop: 16 }}
                  editable={false}
                />
              ) : (
                <View style={{ marginTop: 16 }}>
                  <LocationCascader
                    label="Shoot Locality (State → District → City/Town)"
                    selectedState={shootState}
                    selectedDistrict={shootDistrict}
                    selectedCity={shootCity}
                    onSelect={(s, d, c) => {
                      setShootState(s);
                      setShootDistrict(d);
                      setShootCity(c);
                    }}
                  />
                  <Input
                    label="Venue / Landmark Address (Optional)"
                    placeholder="e.g. Grand Ballroom, Royal Orchid Hotel"
                    value={venueAddress}
                    onChangeText={setVenueAddress}
                    leftIcon={<MapPin size={18} color={colors.textSecondary} />}
                    containerStyle={{ marginTop: 12 }}
                  />
                </View>
              )}

              {!isStudio && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 16, color: colors.textSecondary }]}>Event / Project Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {['Wedding', 'Corporate', 'Birthday/Party', 'Product Launch', 'Short Film', 'Drone Shoot', 'Podcast'].map(ev => {
                      const isSel = eventType === ev;
                      return (
                        <TouchableOpacity
                          key={ev}
                          onPress={() => setEventType(ev)}
                          style={[
                            styles.evChip,
                            { backgroundColor: colors.surfaceElevated },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.evChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '900' }]}>{ev}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <Input
                label="Special Notes / Instructions"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                containerStyle={{ marginTop: 12 }}
              />
            </View>
          )}

          {currentStep === 3 && (
            <View>
              <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Service Contract Agreement</Text>

                <View style={[styles.contractBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Text style={[styles.contractTitle, { color: colors.accent }]}>📜 CAMCREW {isStudio ? 'STUDIO RENTAL' : 'CREATIVE SERVICE'} CONTRACT</Text>
                  <Text style={[styles.contractText, { color: colors.textSecondary }]}>
                    This agreement is entered into between {user?.name || 'Client'} ("Client") and {profile.name} ("Host").
                    The Host agrees to provide {selectedService?.title || 'Services'} on {startDate} in {resolvedLocation}.
                    All deliverables and payments will be held in Escrow Protection until final milestone release.
                  </Text>
                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                  <Input
                    label="Digital Signature (Type Full Legal Name)"
                    placeholder="e.g. Karan Malhotra"
                    value={contractSignature}
                    onChangeText={setContractSignature}
                  />
                  <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreedToTerms(!agreedToTerms)} activeOpacity={0.8}>
                    <View style={[styles.checkbox, agreedToTerms && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}>
                      {agreedToTerms && <Text style={{ color: colors.background, fontWeight: '900', fontSize: 12 }}>✓</Text>}
                    </View>
                    <Text style={[styles.agreeText, { color: colors.textPrimary }]}>I agree to the legally binding terms of the Camcrew Service Contract.</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.cardBox, { marginTop: 16, backgroundColor: colors.surfaceCard }]}>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Financial Summary</Text>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>{selectedService?.type === 'package' ? 'Package Fixed Rate' : `Base Rate (${daysCount} days)`}</Text>
                  <Text style={[styles.calcVal, { color: colors.textPrimary }]}>₹{totals.subtotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Platform Safety Fee</Text>
                  <Text style={[styles.calcVal, { color: colors.textPrimary }]}>₹{totals.platformFee}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>GST (18%)</Text>
                  <Text style={[styles.calcVal, { color: colors.textPrimary }]}>₹{totals.gst.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.totalRow, { borderTopColor: colors.borderLight }]}>
                  <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Payable</Text>
                  <Text style={[styles.totalVal, { color: colors.accent }]}>₹{totals.total.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          )}

          {currentStep === 4 && (
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              <View style={styles.paymentBox}>
                <CheckCircle size={56} color={colors.accent} style={{ marginBottom: 16 }} />
                <Text style={[styles.payTitle, { color: colors.textPrimary }]}>Send Booking Request</Text>
                <Text style={[styles.paySub, { color: colors.textSecondary }]}>
                  No upfront payment is required! Your request will be sent directly to {profile.name}. Once accepted, you will receive a notification to complete your secure Escrow payment of ₹{totals.total.toLocaleString('en-IN')}.
                </Text>
              </View>
            </View>
          )}

        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.surfaceCard }]}>
          <View style={styles.buttonRow}>
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={() => setCurrentStep(currentStep - 1)}
                style={[styles.backBtnStyle, { borderColor: colors.border }]}
              >
                <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              disabled={loading}
              activeOpacity={0.8}
              testID="btn-booking-next"
              style={{ flex: currentStep > 1 ? 2 : 1, marginLeft: currentStep > 1 ? 12 : 0 }}
            >
              <LinearGradient colors={[colors.accent, '#2c9a51']} style={styles.primaryGradBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.primaryGradText}>
                    {currentStep === 4 ? 'Send Request' : 'Continue →'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Picker Modals */}
      <DatePickerModal visible={showStartDateModal} onClose={() => setShowStartDateModal(false)} onSelectDate={(date) => {
        setStartDate(date);
        if (selectedService?.type === 'package') {
          setEndDate(date);
        }
      }} selectedDate={startDate} blockedDates={profile.blockedDates || []} title="Select Start Date" />
      <DatePickerModal visible={showEndDateModal} onClose={() => setShowEndDateModal(false)} onSelectDate={setEndDate} selectedDate={endDate} blockedDates={profile.blockedDates || []} title="Select End Date" />
      <TimePickerModal visible={showStartTimeModal} onClose={() => setShowStartTimeModal(false)} onSelectTime={setStartTime} selectedTime={startTime} title="Select Check-in Time" />
      <TimePickerModal visible={showEndTimeModal} onClose={() => setShowEndTimeModal(false)} onSelectTime={setEndTime} selectedTime={endTime} title="Select Check-out Time" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  
  content: { padding: 16, paddingBottom: 120 },
  cardBox: {
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 3,
  },
  sectionHeading: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  
  serviceSelectBox: { padding: 16, borderRadius: 16, borderWidth: 2, marginBottom: 12 },
  srvHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  srvTitle: { fontSize: 16, fontWeight: '900' },
  srvRate: { fontSize: 15, fontWeight: '900' },
  srvDesc: { fontSize: 13, marginTop: 8, lineHeight: 20, fontWeight: '500' },
  
  pickerRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 24, borderWidth: 1, borderColor: 'transparent' },
  pickerSub: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  pickerVal: { fontSize: 14, fontWeight: '800' },
  
  evChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginRight: 8, borderWidth: 1.5, borderColor: 'transparent' },
  evChipText: { fontSize: 13, fontWeight: '700' },

  contractBox: { padding: 16, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed' },
  contractTitle: { fontWeight: '900', fontSize: 13, marginBottom: 8 },
  contractText: { fontSize: 13, lineHeight: 22, fontWeight: '500' },
  divider: { height: 1, marginVertical: 16 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  agreeText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },

  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calcLabel: { fontWeight: '600', fontSize: 14 },
  calcVal: { fontWeight: '800', fontSize: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderStyle: 'dashed' },
  totalLabel: { fontWeight: '900', fontSize: 16 },
  totalVal: { fontWeight: '900', fontSize: 20 },

  paymentBox: { paddingVertical: 20, alignItems: 'center' },
  payTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  paySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 40, borderTopWidth: 0, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: -6 }, shadowRadius: 16, elevation: 20 },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
  primaryGradBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryGradText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  backBtnStyle: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 16, fontWeight: '800' },
});
