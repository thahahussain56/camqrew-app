import React, { useState, useEffect, useMemo } from 'react';
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
import { Calendar, Clock, MapPin, CheckCircle, ChevronDown, ArrowLeft, ShieldCheck, FileText, UtensilsCrossed } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { formatLocationString } from '../../constants/locations';
import { useLocationStore } from '../../store/locationStore';
import { getArchetype } from '../../constants/categories';

const { width } = Dimensions.get('window');

const STEP_TITLES = ['Select Service', 'Schedule & Location', 'Review Package', 'Send Request'];

const CATEGORY_EVENT_TYPES: Record<string, string[]> = {
  home_baker: ['Birthday Cake', 'Wedding Cake', 'Anniversary', 'Dessert Table Grazing', 'Artisan Breads Box', 'Corporate Gifting'],
  catering: ['Wedding Reception', 'Corporate Gala', 'Sangeet & Cocktail', 'Birthday Party', 'Pooja / Traditional'],
  modeling_talent: ['High-Fashion Runway', 'Bridal / Couture Lookbook', 'E-Commerce Catalog Fit', 'Commercial TVC', 'Editorial Magazine'],
  event_management: ['Luxury Wedding', 'Corporate Summit', 'Fashion Gala', 'Music Festival', 'Private Social'],
  tech_digital: ['Full-Stack Web App', 'Mobile App MVP', 'UI/UX Design System', 'API / Backend Architecture'],
  beauty_bridal: ['Bridal HD Makeup', 'Sangeet / Reception Glam', 'Bridal Mehendi', 'Party Makeup', 'Editorial / Commercial'],
  media_crew: ['Wedding', 'Corporate', 'Birthday/Party', 'Product Launch', 'Short Film', 'Drone Shoot', 'Podcast'],
};

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

  // Archetype
  const proArchetype = useMemo(() => getArchetype(profile?.categories), [profile?.categories]);
  const archetype = isStudio ? 'media_crew' : proArchetype.archetype;

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

  // Category-specific options
  // 1. Home Baker
  const [bakerDietary, setBakerDietary] = useState('Eggless (100% Veg)');
  const [bakerCakeMessage, setBakerCakeMessage] = useState('');
  const [bakerCandlesKit, setBakerCandlesKit] = useState(true);
  const [bakerTimeSlot, setBakerTimeSlot] = useState('Afternoon (01:00 PM - 05:00 PM)');

  // 2. Catering
  const [catererServingStyle, setCatererServingStyle] = useState('Buffet Setup');
  const [catererDietary, setCatererDietary] = useState('Pure Veg & Jain Counter');
  const [catererGuestCount, setCatererGuestCount] = useState('50');
  const [catererMealSlot, setCatererMealSlot] = useState('Dinner (07:30 PM - 11:30 PM)');

  // 3. Modeling & Talent
  const [modelAssignmentType, setModelAssignmentType] = useState('High-Fashion Runway & Lookbook');
  const [modelLookCount, setModelLookCount] = useState('4 - 6 Looks');
  const [modelUsageRights, setModelUsageRights] = useState('Digital & Social Media (1 Year)');
  const [modelStylingProvided, setModelStylingProvided] = useState('Stylist & MUA Provided on Set');

  // 4. Event Management
  const [eventScope, setEventScope] = useState('Turnkey Event Planning & Decor');
  const [eventScale, setEventScale] = useState('Medium (100 - 500 Guests)');

  // 5. Tech & Digital
  const [techDeliverable, setTechDeliverable] = useState('Full-Stack Web App');
  const [techSpecsLink, setTechSpecsLink] = useState('');

  // 6. Beauty & Bridal
  const [beautyStyle, setBeautyStyle] = useState('HD Bridal Makeup & Hair Styling');
  const [beautyPartyCount, setBeautyPartyCount] = useState('Bride Only');

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

  // Category Configuration Meta
  const categoryConfig = useMemo(() => {
    if (isStudio) {
      return {
        headerTitle: 'Book Studio',
        serviceTitle: 'Studio Bay Rental',
        packageSectionHeading: 'Select Studio Package',
        dateLabel: 'Booking Dates (DD/MM/YYYY)',
        isSingleDate: false,
        locationCascaderLabel: 'Studio Locality',
        locationAddressLabel: 'Studio Location / Address',
        locationAddressPlaceholder: 'Studio Address',
        contractTitle: '📜 CAMQREW STUDIO RENTAL CONTRACT',
        contractSubject: 'Studio Bay Rental',
        notesPlaceholder: 'Specify lighting grids, green room requirements, power load...',
        rateUnitLabel: (days: number) => `Studio Rental (${days} ${days === 1 ? 'day' : 'days'})`,
      };
    }
    switch (archetype) {
      case 'home_baker':
        return {
          headerTitle: 'Order from Baker',
          serviceTitle: 'Custom Artisan Cake & Fresh Bakes Order',
          packageSectionHeading: 'Select Cake / Bake Package',
          dateLabel: 'Delivery / Pickup Date (DD/MM/YYYY)',
          isSingleDate: true,
          locationCascaderLabel: 'Delivery Locality (State → District → City/Town)',
          locationAddressLabel: 'Delivery Address, Landmark & Pincode *',
          locationAddressPlaceholder: 'e.g. Flat 402, Sea Green Apts, Bandra West, Mumbai (or Studio Pickup)',
          contractTitle: '📜 CAMQREW ARTISAN BAKERY ORDER AGREEMENT',
          contractSubject: 'Custom Bakery & Artisan Confectionery Order',
          notesPlaceholder: 'Specify cake flavor notes, color themes, lettering, and special packaging details...',
          rateUnitLabel: () => 'Custom Artisan Bake Order',
        };
      case 'catering':
        return {
          headerTitle: 'Book Caterer',
          serviceTitle: 'Banquet Catering & Culinary Package',
          packageSectionHeading: 'Select Catering Package',
          dateLabel: 'Event & Catering Dates (DD/MM/YYYY)',
          isSingleDate: false,
          locationCascaderLabel: 'Event Locality (State → District → City/Town)',
          locationAddressLabel: 'Banquet / Venue Address & Kitchen Access Details *',
          locationAddressPlaceholder: 'e.g. Royal Palm Banquets, Hall B, Andheri East, Mumbai',
          contractTitle: '📜 CAMQREW BANQUET & CATERING SERVICE CONTRACT',
          contractSubject: 'Catering & Culinary Services',
          notesPlaceholder: 'Buffet setup timing, live counter space, water/power supply, dietary splits...',
          rateUnitLabel: (days: number) => `Catering Service (${days} ${days === 1 ? 'day' : 'days'})`,
        };
      case 'modeling_talent':
        return {
          headerTitle: 'Book Model / Talent',
          serviceTitle: 'High-Fashion Campaign & Lookbook Shoot',
          packageSectionHeading: 'Select Assignment Package',
          dateLabel: 'Shoot / Runway Dates (DD/MM/YYYY)',
          isSingleDate: false,
          locationCascaderLabel: 'Shoot Locality (State → District → City/Town)',
          locationAddressLabel: 'Studio / Location Address & Fitting Venue *',
          locationAddressPlaceholder: 'e.g. Studio 9, Film City, Goregaon, Mumbai',
          contractTitle: '📜 CAMQREW MODELING & TALENT ASSIGNMENT CONTRACT',
          contractSubject: 'Modeling & Fashion Assignment',
          notesPlaceholder: 'Moodboard details, call times, fitting schedules, wardrobe notes...',
          rateUnitLabel: (days: number) => `Modeling Assignment (${days} ${days === 1 ? 'day' : 'days'})`,
        };
      case 'event_management':
        return {
          headerTitle: 'Book Event Planner',
          serviceTitle: 'Turnkey Event Planning & Production Execution',
          packageSectionHeading: 'Select Planning Package',
          dateLabel: 'Event & Setup Dates (DD/MM/YYYY)',
          isSingleDate: false,
          locationCascaderLabel: 'Event Locality (State → District → City/Town)',
          locationAddressLabel: 'Event Venue / Grounds / Banquet Address *',
          locationAddressPlaceholder: 'e.g. Grand Ballroom, JW Marriott, Juhu, Mumbai',
          contractTitle: '📜 CAMQREW EVENT MANAGEMENT & PRODUCTION AGREEMENT',
          contractSubject: 'Event Planning & Production Management',
          notesPlaceholder: 'Venue dimensions, staging, audio-visual scope, vendor coordination...',
          rateUnitLabel: (days: number) => `Event Management (${days} ${days === 1 ? 'day' : 'days'})`,
        };
      case 'tech_digital':
        return {
          headerTitle: 'Book Developer / Designer',
          serviceTitle: 'Full-Stack Web App MVP & Digital Design',
          packageSectionHeading: 'Select Scope / Sprint Package',
          dateLabel: 'Project Sprint Dates (DD/MM/YYYY)',
          isSingleDate: false,
          locationCascaderLabel: 'Client / Work Locality (State → District → City/Town)',
          locationAddressLabel: 'Client Office / Remote Work Base Address *',
          locationAddressPlaceholder: 'e.g. Remote / HSR Layout Sector 4, Bengaluru',
          contractTitle: '📜 CAMQREW DIGITAL & SOFTWARE DEVELOPMENT CONTRACT',
          contractSubject: 'Digital Engineering & Design Sprints',
          notesPlaceholder: 'Tech stack requirements, repository access, project milestone expectations...',
          rateUnitLabel: (days: number) => `Sprint Duration (${days} ${days === 1 ? 'day' : 'days'})`,
        };
      case 'beauty_bridal':
        return {
          headerTitle: 'Book Beauty Artist',
          serviceTitle: 'Full Bridal HD Makeup & Sangeet Mehendi',
          packageSectionHeading: 'Select Artistry Package',
          dateLabel: 'Ceremony / Booking Dates (DD/MM/YYYY)',
          isSingleDate: false,
          locationCascaderLabel: 'Service Locality (State → District → City/Town)',
          locationAddressLabel: 'Bridal Suite / Hotel / Home Venue Address *',
          locationAddressPlaceholder: 'e.g. Suite 501, Taj Lands End, Bandra West, Mumbai',
          contractTitle: '📜 CAMQREW BRIDAL & BEAUTY ARTISTRY AGREEMENT',
          contractSubject: 'Bridal Makeup & Beauty Artistry',
          notesPlaceholder: 'Skin type notes, jewelry draping assistance, ceremony call time...',
          rateUnitLabel: (days: number) => `Artistry Package (${days} ${days === 1 ? 'day' : 'days'})`,
        };
      default:
        return {
          headerTitle: 'Book Creator',
          serviceTitle: 'Video Production & Photography',
          packageSectionHeading: 'Select Package',
          dateLabel: 'Shoot Dates (DD/MM/YYYY)',
          isSingleDate: false,
          locationCascaderLabel: 'Shoot Locality (State → District → City/Town)',
          locationAddressLabel: 'Venue / Landmark Address (Optional)',
          locationAddressPlaceholder: 'e.g. Grand Ballroom, Royal Orchid Hotel',
          contractTitle: '📜 CAMQREW CREATIVE SERVICE CONTRACT',
          contractSubject: 'Production & Creative Services',
          notesPlaceholder: 'Special notes, shotlist references, lighting preferences...',
          rateUnitLabel: (days: number) => `Production Coverage (${days} ${days === 1 ? 'day' : 'days'})`,
        };
    }
  }, [archetype, isStudio]);

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

        // Initialize category event type
        const arch = getArchetype(p.categories);
        const evTypes = CATEGORY_EVENT_TYPES[arch.archetype] || CATEGORY_EVENT_TYPES.media_crew;
        if (evTypes.length > 0) {
          setEventType(evTypes[0]);
        }
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
    const isFixedPackage = Boolean(jobBudget) || (selectedService?.type === 'package') || categoryConfig.isSingleDate;
    const subtotal = isFixedPackage ? rate : (rate * daysCount);
    const platformFee = 499;
    const gst = Math.round((subtotal + platformFee) * 0.18);
    const total = subtotal + platformFee + gst;
    return { subtotal, platformFee, gst, total };
  };

  const totals = calculateTotal();

  // Category Escrow Milestones (30% / 40% / 30%)
  const advanceEscrow = Math.round(totals.total * 0.3);
  const wrapEscrow = Math.round(totals.total * 0.4);
  const finalEscrow = totals.total - advanceEscrow - wrapEscrow;

  const getCategoryMilestones = () => {
    switch (archetype) {
      case 'home_baker':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Order confirmation & ingredient sourcing', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Bake Ready Escrow (40%)', desc: 'Fresh baking & photo proof shared', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Delivery Wrap Escrow (30%)', desc: 'Safe delivery & client confirmation', percentage: 30, amount: finalEscrow },
        ];
      case 'catering':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Date lock & raw material procurement', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Setup Escrow (40%)', desc: 'Live buffet & kitchen counters running', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Service Wrap Escrow (30%)', desc: 'Banquet conclusion & final wrap', percentage: 30, amount: finalEscrow },
        ];
      case 'modeling_talent':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Date reservation & fitting rehearsal', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Shoot Wrap Escrow (40%)', desc: 'Call time wrap & looks completed', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Usage Rights Escrow (30%)', desc: 'Deliverables clearance & commercial license', percentage: 30, amount: finalEscrow },
        ];
      case 'tech_digital':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Sprint kickoff & technical architecture', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Core Sprint Escrow (40%)', desc: 'Prototype & core features deployed', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Production Release Escrow (30%)', desc: 'Code handover, QA testing & sign-off', percentage: 30, amount: finalEscrow },
        ];
      case 'beauty_bridal':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Date lock & bridal vanity prep', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Look Ready Escrow (40%)', desc: 'Bridal styling & draping wrap', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Wrap Escrow (30%)', desc: 'Touch-up wrap & photoshoot ready', percentage: 30, amount: finalEscrow },
        ];
      case 'event_management':
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Vendor lock & material fabrication', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Setup Wrap Escrow (40%)', desc: 'Stage, sound & venue handover', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Event Wrap Escrow (30%)', desc: 'Event conclusion & vendor clearance', percentage: 30, amount: finalEscrow },
        ];
      default:
        return [
          { id: '1', title: 'Advance Escrow (30%)', desc: 'Held now; locks creator calendar', percentage: 30, amount: advanceEscrow },
          { id: '2', title: 'Shoot Wrap Escrow (40%)', desc: 'Released after production wraps', percentage: 40, amount: wrapEscrow },
          { id: '3', title: 'Deliverables Escrow (30%)', desc: 'Released upon final deliverables approval', percentage: 30, amount: finalEscrow },
        ];
    }
  };

  const categoryMilestones = getCategoryMilestones();

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
      if (!startDate) {
        setToastMessage('Please select your date.');
        return;
      }
      if (!categoryConfig.isSingleDate && !endDate) {
        setToastMessage('Please select end date.');
        return;
      }
      if (isStudio && !location.trim()) {
        setToastMessage('Please enter studio location.');
        return;
      }
      if (!isStudio && (!shootState || !shootDistrict || !shootCity)) {
        setToastMessage('Please select your locality.');
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
        // Compile category specifications cleanly into notes
        const specsList: string[] = [];
        if (archetype === 'home_baker') {
          specsList.push(`[Dietary: ${bakerDietary}]`);
          if (bakerCakeMessage.trim()) specsList.push(`[Message on Cake: "${bakerCakeMessage.trim()}"]`);
          specsList.push(`[Candle & Knife Kit: ${bakerCandlesKit ? 'Included' : 'Not Needed'}]`);
          specsList.push(`[Time Slot: ${bakerTimeSlot}]`);
        } else if (archetype === 'catering') {
          specsList.push(`[Serving Style: ${catererServingStyle}]`);
          specsList.push(`[Dietary: ${catererDietary}]`);
          specsList.push(`[Expected Guests: ${catererGuestCount} pax]`);
          specsList.push(`[Meal Service: ${catererMealSlot}]`);
        } else if (archetype === 'modeling_talent') {
          specsList.push(`[Assignment: ${modelAssignmentType}]`);
          specsList.push(`[Looks: ${modelLookCount}]`);
          specsList.push(`[Usage Rights: ${modelUsageRights}]`);
          specsList.push(`[Styling: ${modelStylingProvided}]`);
        } else if (archetype === 'tech_digital') {
          specsList.push(`[Deliverable: ${techDeliverable}]`);
          if (techSpecsLink.trim()) specsList.push(`[Specs/Figma Link: ${techSpecsLink.trim()}]`);
        } else if (archetype === 'beauty_bridal') {
          specsList.push(`[Style: ${beautyStyle}]`);
          specsList.push(`[Party Count: ${beautyPartyCount}]`);
        } else if (archetype === 'event_management') {
          specsList.push(`[Scope: ${eventScope}]`);
          specsList.push(`[Scale: ${eventScale}]`);
        }

        const combinedNotes = [
          `OCCASION / TYPE: ${eventType}`,
          specsList.length > 0 ? `SPECIFICATIONS:\n${specsList.join('\n')}` : '',
          notes.trim() ? `SPECIAL NOTES:\n${notes.trim()}` : '',
        ].filter(Boolean).join('\n\n');

        const payload: any = {
          professionalName: profile.name,
          professionalAvatar: profile.avatar,
          professionalTitle: profile.title,
          customerId: user?.id || 'usr_client',
          customerName: user?.name || 'Client Request',
          serviceTitle: selectedService?.title || (isStudio ? 'Studio Bay Rental' : categoryConfig.serviceTitle),
          startDate,
          endDate: categoryConfig.isSingleDate ? startDate : endDate,
          startTime: archetype === 'home_baker' ? bakerTimeSlot : startTime,
          endTime,
          daysCount: categoryConfig.isSingleDate ? 1 : daysCount,
          location: resolvedLocation,
          ratePerDay: selectedService?.rate || profile.ratePerDay || 15000,
          totalAmount: totals.total,
          notes: combinedNotes,
          contractSignature,
          contractTermsText: categoryConfig.contractTitle,
          contractSignedAt: new Date().toISOString(),
          milestones: categoryMilestones.map(m => ({
            id: `m_${m.id}`,
            title: `${m.title} - ${m.desc}`,
            percentage: m.percentage,
            amount: m.amount,
            status: 'held',
          })),
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
        }, 2200);
      } catch (e) {
        setLoading(false);
        setToastMessage('Booking failed. Please try again.');
      }
    }
  };

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
            Your booking request has been sent to <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{profile.name}</Text>.
          </Text>

          <View style={{ width: '100%', marginVertical: 20, padding: 16, borderRadius: 16, backgroundColor: colors.surfaceElevated }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
              Service: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{selectedService?.title || (isStudio ? 'Studio Booking' : categoryConfig.serviceTitle)}</Text>
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
              Date: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{startDate} {archetype === 'home_baker' ? `(${bakerTimeSlot})` : `(${startTime})`}</Text>
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Status: <Text style={{ color: colors.accent, fontWeight: '800' }}>⏳ Pending Approval & Escrow</Text>
            </Text>
          </View>

          <Button
            title="Open Chat with Creator 💬"
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

  const currentCategoryEventTypes = CATEGORY_EVENT_TYPES[archetype] || CATEGORY_EVENT_TYPES.media_crew;

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
              <Text style={[styles.title, { color: colors.textPrimary }]}>{categoryConfig.headerTitle}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{profile.name}</Text>
            </View>
          </View>
          <StepperProgress currentStep={currentStep} totalSteps={4} stepTitles={STEP_TITLES} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* STEP 1: SELECT PACKAGE / SERVICE */}
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
                {jobId ? 'Selected Package' : categoryConfig.packageSectionHeading}
              </Text>
              {(selectedService && selectedService.id.startsWith('srv_broadcast_') ? [selectedService] : (profile.services && profile.services.length > 0 ? profile.services : [
                {
                  id: 'srv_default',
                  title: isStudio ? 'Full Day Studio Access' : (archetype === 'home_baker' ? 'Custom Artisan Cake Order' : 'Signature Professional Package'),
                  category: isStudio ? 'Studio Rental' : (profile.categories[0] || 'Creative Service'),
                  rate: profile.ratePerDay || 15000,
                  unit: archetype === 'home_baker' ? 'per order' : (archetype === 'catering' ? 'per event' : 'per day'),
                  description: isStudio 
                    ? 'Includes full access to the studio bay, basic grip equipment, and green room.'
                    : (archetype === 'home_baker'
                      ? 'Handcrafted with premium ingredients, custom theme frosting, candle and knife kit included.'
                      : 'Comprehensive coverage with premium deliverables and escrow protection.'),
                }
              ])).map(srv => {
                const isSelected = selectedService?.id === srv.id || (!selectedService && srv.id === 'srv_default');
                return (
                  <TouchableOpacity
                    key={srv.id}
                    activeOpacity={0.9}
                    onPress={() => {
                      setSelectedService(srv);
                      if (srv.type === 'package' || categoryConfig.isSingleDate) {
                        setEndDate(startDate);
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

          {/* STEP 2: SCHEDULE, CATEGORY OPTIONS & LOCATION */}
          {currentStep === 2 && (
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Schedule Details</Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{categoryConfig.dateLabel}</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight, flex: 1 }]} onPress={() => setShowStartDateModal(true)}>
                  <Calendar size={16} color={colors.accent} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>
                      {categoryConfig.isSingleDate ? 'Delivery / Pickup Date' : 'Start Date'}
                    </Text>
                    <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{startDate}</Text>
                  </View>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {!categoryConfig.isSingleDate && selectedService?.type !== 'package' && (
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

              {/* Time Slots for Home Bakers */}
              {archetype === 'home_baker' && (
                <View style={{ marginTop: 8, marginBottom: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Delivery / Pickup Time Slot</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['Morning (09 AM - 01 PM)', 'Afternoon (01 PM - 05 PM)', 'Evening (05 PM - 09 PM)', 'Studio Self-Pickup'].map(slot => {
                      const isSel = bakerTimeSlot.startsWith(slot.substring(0, 7));
                      return (
                        <TouchableOpacity
                          key={slot}
                          onPress={() => setBakerTimeSlot(slot)}
                          style={[
                            styles.slotChip,
                            { backgroundColor: colors.surfaceElevated },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.slotChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Standard Hours for Non-Bakers */}
              {archetype !== 'home_baker' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 12, color: colors.textSecondary }]}>Service Time (Hours)</Text>
                  <View style={styles.pickerRow}>
                    <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]} onPress={() => setShowStartTimeModal(true)}>
                      <Clock size={16} color={colors.accent} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>Check-in / Call</Text>
                        <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{startTime}</Text>
                      </View>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]} onPress={() => setShowEndTimeModal(true)}>
                      <Clock size={16} color={colors.accent} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>Check-out / Wrap</Text>
                        <Text style={[styles.pickerVal, { color: colors.textPrimary }]}>{endTime}</Text>
                      </View>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* LOCATION SECTION */}
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <Text style={[styles.sectionHeading, { color: colors.textPrimary, fontSize: 16, marginBottom: 10 }]}>
                {isStudio ? 'Studio Location' : 'Locality & Address'}
              </Text>

              {isStudio ? (
                <Input
                  label={categoryConfig.locationAddressLabel}
                  value={location}
                  onChangeText={setLocation}
                  leftIcon={<MapPin size={18} color={colors.textSecondary} />}
                  containerStyle={{ marginTop: 8 }}
                  editable={false}
                />
              ) : (
                <View style={{ marginTop: 4 }}>
                  <LocationCascader
                    label={categoryConfig.locationCascaderLabel}
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
                    label={categoryConfig.locationAddressLabel}
                    placeholder={categoryConfig.locationAddressPlaceholder}
                    value={venueAddress}
                    onChangeText={setVenueAddress}
                    leftIcon={<MapPin size={18} color={colors.textSecondary} />}
                    containerStyle={{ marginTop: 12 }}
                  />
                </View>
              )}

              {/* OCCASION / PROJECT TYPE PILLS */}
              {!isStudio && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 16, color: colors.textSecondary }]}>
                    {archetype === 'home_baker' ? 'Occasion / Cake Type' : (archetype === 'catering' ? 'Catering Event Type' : 'Event / Project Type')}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {currentCategoryEventTypes.map(ev => {
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

              {/* CATEGORY-SPECIFIC INTERACTIVE CONTROLS */}
              {/* 1. Home Baker Customizations */}
              {archetype === 'home_baker' && (
                <View style={[styles.customSpecsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Text style={[styles.specsTitle, { color: colors.accent }]}>🍰 Cake Customization & Dietary Options</Text>
                  
                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>Dietary Preference</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {['Eggless (100% Veg)', 'Contains Egg', 'Vegan', 'Gluten-Free', 'Keto / Sugar-Free'].map(diet => {
                      const isSel = bakerDietary === diet;
                      return (
                        <TouchableOpacity
                          key={diet}
                          onPress={() => setBakerDietary(diet)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {diet}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Input
                    label="Message / Inscription on Cake"
                    placeholder="e.g. Happy 25th Birthday Sarah! 🎉"
                    value={bakerCakeMessage}
                    onChangeText={setBakerCakeMessage}
                  />

                  <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() => setBakerCandlesKit(!bakerCandlesKit)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, bakerCandlesKit && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                      {bakerCandlesKit && <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Complimentary Candle & Eco-Knife Kit</Text>
                      <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>Include premium sparkling candle and reusable serving knife</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* 2. Catering Customizations */}
              {archetype === 'catering' && (
                <View style={[styles.customSpecsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Text style={[styles.specsTitle, { color: colors.accent }]}>🍽️ Catering Service Style & Dietary Standards</Text>

                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>Serving Style</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['Buffet Setup', 'Plated Service', 'Live Counters', 'Packed Bento'].map(style => {
                      const isSel = catererServingStyle.startsWith(style.substring(0, 6));
                      return (
                        <TouchableOpacity
                          key={style}
                          onPress={() => setCatererServingStyle(style)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {style}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 6, color: colors.textSecondary }]}>Dietary Classification</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {['Pure Veg & Jain Counter', 'Veg & Non-Veg Mixed', 'Halal Certified Gourmet'].map(diet => {
                      const isSel = catererDietary === diet;
                      return (
                        <TouchableOpacity
                          key={diet}
                          onPress={() => setCatererDietary(diet)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {diet}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Input
                    label="Expected Guest Count (Pax)"
                    placeholder="e.g. 50, 150, 500"
                    value={catererGuestCount}
                    onChangeText={setCatererGuestCount}
                    keyboardType="number-pad"
                  />
                </View>
              )}

              {/* 3. Modeling & Talent Customizations */}
              {archetype === 'modeling_talent' && (
                <View style={[styles.customSpecsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Text style={[styles.specsTitle, { color: colors.accent }]}>✨ Commercial Licensing & Assignment Scope</Text>

                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>Commercial Usage Rights</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['Digital & Social (1 Yr)', 'Omnichannel (2 Yrs)', 'Worldwide Buyout'].map(rights => {
                      const isSel = modelUsageRights.startsWith(rights.substring(0, 7));
                      return (
                        <TouchableOpacity
                          key={rights}
                          onPress={() => setModelUsageRights(rights)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {rights}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 6, color: colors.textSecondary }]}>Expected Look Count</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['1 - 3 Looks', '4 - 6 Looks', 'Full Day 8+ Looks'].map(looks => {
                      const isSel = modelLookCount === looks;
                      return (
                        <TouchableOpacity
                          key={looks}
                          onPress={() => setModelLookCount(looks)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {looks}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 6, color: colors.textSecondary }]}>Styling & Wardrobe Arrangement</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {['Stylist Provided on Set', 'Self-Styled / Clean Base', 'Designer Fitting Arranged'].map(style => {
                      const isSel = modelStylingProvided.startsWith(style.substring(0, 8));
                      return (
                        <TouchableOpacity
                          key={style}
                          onPress={() => setModelStylingProvided(style)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {style}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 4. Event Management Customizations */}
              {archetype === 'event_management' && (
                <View style={[styles.customSpecsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Text style={[styles.specsTitle, { color: colors.accent }]}>🎪 Event Scope & Scale</Text>
                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>Production Scope</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['Turnkey Planning & Decor', 'Day-Of Coordination', 'Stage & Sound Production'].map(scope => {
                      const isSel = eventScope === scope;
                      return (
                        <TouchableOpacity
                          key={scope}
                          onPress={() => setEventScope(scope)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {scope}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 5. Tech & Digital Customizations */}
              {archetype === 'tech_digital' && (
                <View style={[styles.customSpecsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Text style={[styles.specsTitle, { color: colors.accent }]}>💻 Technical Deliverable & Architecture</Text>
                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>Deliverable Type</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['Full-Stack Web App', 'Mobile App MVP', 'UI/UX Design System', 'API Architecture'].map(d => {
                      const isSel = techDeliverable.startsWith(d.substring(0, 8));
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setTechDeliverable(d)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Input
                    label="Figma / PRD / GitHub Repository Link (Optional)"
                    placeholder="https://figma.com/file/... or https://github.com/..."
                    value={techSpecsLink}
                    onChangeText={setTechSpecsLink}
                  />
                </View>
              )}

              {/* 6. Beauty & Bridal Customizations */}
              {archetype === 'beauty_bridal' && (
                <View style={[styles.customSpecsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Text style={[styles.specsTitle, { color: colors.accent }]}>💄 Bridal & Artistry Configuration</Text>
                  <Text style={[styles.inputLabel, { marginTop: 10, color: colors.textSecondary }]}>Party Size</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {['Bride Only', 'Bride + 2 Family', 'Bridal Party (5+ People)'].map(p => {
                      const isSel = beautyPartyCount === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setBeautyPartyCount(p)}
                          style={[
                            styles.miniChip,
                            { backgroundColor: colors.surfaceCard },
                            isSel && { backgroundColor: colors.accentGlow, borderColor: colors.accent }
                          ]}
                        >
                          <Text style={[styles.miniChipText, { color: colors.textSecondary }, isSel && { color: colors.accent, fontWeight: '800' }]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <Input
                label="Special Instructions / Design Notes"
                placeholder={categoryConfig.notesPlaceholder}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                containerStyle={{ marginTop: 14 }}
              />
            </View>
          )}

          {/* STEP 3: CONTRACT & MILESTONE ESCROW REVIEW */}
          {currentStep === 3 && (
            <View>
              <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Service Contract Agreement</Text>

                <View style={[styles.contractBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Text style={[styles.contractTitle, { color: colors.accent }]}>{categoryConfig.contractTitle}</Text>
                  <Text style={[styles.contractText, { color: colors.textSecondary }]}>
                    This legally binding agreement is entered into between {user?.name || 'Client'} ("Client") and {profile.name} ("Creator/Host").
                    The Host agrees to provide {categoryConfig.contractSubject} on {startDate} in {resolvedLocation}.
                    All payments are safeguarded through Camqrew Milestone Escrow Protection and released upon verification.
                  </Text>
                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                  <Input
                    label="Digital Signature (Type Full Legal Name)"
                    placeholder="e.g. Karan Malhotra"
                    value={contractSignature}
                    onChangeText={setContractSignature}
                  />
                  <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreedToTerms(!agreedToTerms)} activeOpacity={0.8}>
                    <View style={[styles.checkbox, agreedToTerms && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                      {agreedToTerms && <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>✓</Text>}
                    </View>
                    <Text style={[styles.agreeText, { color: colors.textPrimary }]}>I agree to the legally binding terms of the Camqrew Service Contract.</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Escrow Milestones Schedule */}
              <View style={[styles.cardBox, { marginTop: 16, backgroundColor: colors.surfaceCard }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <ShieldCheck size={20} color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>Escrow Protection Schedule</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14, lineHeight: 18 }}>
                  Your payment is securely deposited into escrow and released in 3 stages:
                </Text>

                {categoryMilestones.map((ms, idx) => (
                  <View key={ms.id} style={[styles.milestoneRow, { borderBottomColor: colors.borderLight }]}>
                    <View style={[styles.milestoneBadge, { backgroundColor: colors.accentGlow }]}>
                      <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 12 }}>{ms.percentage}%</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.milestoneTitle, { color: colors.textPrimary }]}>{ms.title}</Text>
                      <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>{ms.desc}</Text>
                    </View>
                    <Text style={[styles.milestoneAmt, { color: colors.accent }]}>₹{ms.amount.toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </View>

              {/* Financial Breakdown */}
              <View style={[styles.cardBox, { marginTop: 16, backgroundColor: colors.surfaceCard }]}>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Financial Summary</Text>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>{categoryConfig.rateUnitLabel(daysCount)}</Text>
                  <Text style={[styles.calcVal, { color: colors.textPrimary }]}>₹{totals.subtotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Platform Escrow & Safety Fee</Text>
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

          {/* STEP 4: SEND REQUEST */}
          {currentStep === 4 && (
            <View style={[styles.cardBox, { backgroundColor: colors.surfaceCard }]}>
              <View style={styles.paymentBox}>
                <CheckCircle size={56} color={colors.accent} style={{ marginBottom: 16 }} />
                <Text style={[styles.payTitle, { color: colors.textPrimary }]}>Send Booking Request</Text>
                <Text style={[styles.paySub, { color: colors.textSecondary }]}>
                  No upfront charge right now! Your tailored request will be sent directly to {profile.name}. Once accepted, you will be notified to activate your escrow protection with ₹{totals.total.toLocaleString('en-IN')}.
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
        if (categoryConfig.isSingleDate || selectedService?.type === 'package') {
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
  inputLabel: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  serviceSelectBox: { padding: 16, borderRadius: 16, borderWidth: 2, marginBottom: 12 },
  srvHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  srvTitle: { fontSize: 16, fontWeight: '900' },
  srvRate: { fontSize: 15, fontWeight: '900' },
  srvDesc: { fontSize: 13, marginTop: 8, lineHeight: 20, fontWeight: '500' },
  
  pickerRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  pickerSub: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  pickerVal: { fontSize: 14, fontWeight: '800' },
  
  slotChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent' },
  slotChipText: { fontSize: 12, fontWeight: '600' },

  evChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginRight: 8, borderWidth: 1.5, borderColor: 'transparent' },
  evChipText: { fontSize: 13, fontWeight: '700' },

  customSpecsBox: { padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 12, marginBottom: 8 },
  specsTitle: { fontSize: 14, fontWeight: '900', marginBottom: 6 },

  miniChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent' },
  miniChipText: { fontSize: 12, fontWeight: '700' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  toggleTitle: { fontSize: 13, fontWeight: '800' },
  toggleSub: { fontSize: 11, marginTop: 2 },

  contractBox: { padding: 16, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed' },
  contractTitle: { fontWeight: '900', fontSize: 13, marginBottom: 8 },
  contractText: { fontSize: 13, lineHeight: 22, fontWeight: '500' },
  divider: { height: 1, marginVertical: 16 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  agreeText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },

  milestoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  milestoneBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  milestoneTitle: { fontSize: 13, fontWeight: '800' },
  milestoneDesc: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  milestoneAmt: { fontSize: 14, fontWeight: '900', marginLeft: 8 },

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
