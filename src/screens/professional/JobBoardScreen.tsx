import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { jobApi, JobLocationFilter } from '../../api/jobApi';
import { professionalApi } from '../../api/professionalApi';
import { JobRequest } from '../../types/job';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Wallet, CalendarClock, Compass, Globe, Building2, Map, ArrowLeft, Send, Briefcase } from 'lucide-react-native';
import { useLocationStore } from '../../store/locationStore';

type ScopeType = 'city' | 'district' | 'state' | 'all';

export const JobBoardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { selectedCity } = useLocationStore();
  const isCustomer = user?.role === 'customer';
  
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState<ScopeType>('city');

  const [proCity, setProCity] = useState('');
  const [proDistrict, setProDistrict] = useState('');
  const [proState, setProState] = useState('');

  useEffect(() => {
    loadProProfileAndJobs();
  }, [scope, isCustomer]);

  const loadProProfileAndJobs = async () => {
    // For customer account, they should not get leads in job board, they should only be able to post job requests
    if (isCustomer) {
      setJobs([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      let c = selectedCity?.city || 'Mumbai';
      let d = selectedCity?.district || 'Mumbai Suburban';
      let s = selectedCity?.state || 'Maharashtra';

      if (user?.id) {
        try {
          const profile = await professionalApi.getProfileById(user.id);
          if (profile) {
            c = profile.city || c;
            d = profile.district || profile.city || d;
            s = profile.state || s;
          }
        } catch {
          // User might be customer or profile loading, use fallback
        }
      }

      setProCity(c);
      setProDistrict(d);
      setProState(s);

      const filter: JobLocationFilter = {
        city: c,
        district: d,
        state: s,
        scope,
      };

      const openJobs = await jobApi.getOpenJobs(filter, user?.id);
      setJobs(openJobs);
    } catch (e) {
      console.warn('Error loading jobs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProProfileAndJobs();
  };

  const handleAccept = async (jobId: string) => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to pitch on broadcast jobs.');
      return;
    }
    if (user?.role !== 'professional') {
      Alert.alert('Creator Profile Required', 'Only registered creators and crew can pitch on broadcast jobs. Please switch to or register a professional account.');
      return;
    }

    Alert.alert(
      'Accept & Pitch',
      'Are you sure you want to accept this job? This will lock it for you while the client reviews your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept Job', 
          onPress: async () => {
            try {
              if (!user?.id) return;
              await jobApi.acceptJob(jobId, user.id);
              Alert.alert('Job Locked!', 'The client has been notified to review your profile. You can message them in your Chat Tab.');
              loadProProfileAndJobs();
            } catch (e) {
              Alert.alert('Error', 'Could not accept job. Someone else might have claimed it.');
            }
          }
        }
      ]
    );
  };

  const scopeTabs: { id: ScopeType; label: string; icon: any }[] = [
    { id: 'city', label: proCity || 'My City', icon: MapPin },
    { id: 'district', label: proDistrict || 'District', icon: Building2 },
    { id: 'state', label: proState || 'State', icon: Map },
    { id: 'all', label: 'All India', icon: Globe },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: 12, padding: 4 }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {isCustomer ? 'Broadcast Shoot Leads' : 'Pro Job Board'}
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2, fontSize: 13 }}>
              {isCustomer ? 'Crew Matching & Requests' : 'Reverse Pitching Broadcasts'}
            </Text>
          </View>
        </View>

        {proCity && !isCustomer ? (
          <View style={[styles.locationBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Compass size={12} color="#3fb668" style={{ marginRight: 4 }} />
            <Text style={[styles.locationBadgeText, { color: colors.textPrimary }]} numberOfLines={1}>
              {proCity}, {proState}
            </Text>
          </View>
        ) : null}
      </View>

      {/* For customer account, they should not get leads in job board; show post job request card */}
      {isCustomer ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.customerRestrictedCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={[styles.customerIconBadge, { backgroundColor: colors.accentGlow }]}>
              <Briefcase size={36} color={colors.accent} />
            </View>
            <Text style={[styles.customerRestrictedTitle, { color: colors.textPrimary }]}>
              Exclusive for Creative Professionals
            </Text>
            <Text style={[styles.customerRestrictedDesc, { color: colors.textSecondary }]}>
              The Job Board and reverse pitching leads are available exclusively to verified cinematographers, photographers, and crew members to receive shoot jobs.
            </Text>
            <View style={[styles.customerHighlightBox, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.customerHighlightTitle, { color: colors.textPrimary }]}>
                Need to hire a crew for your shoot?
              </Text>
              <Text style={[styles.customerHighlightSub, { color: colors.textSecondary }]}>
                Post your shoot date, budget, and requirements. Nearby verified creators in your city will receive instant alerts and pitch directly.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.customerPostBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CreateJob')}
            >
              <Send size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.customerPostBtnText}>Post a Job Request</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Locality Scope Filter Pills */}
          <View style={styles.scopeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeScroll}>
          {scopeTabs.map(tab => {
            const isActive = scope === tab.id;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setScope(tab.id)}
                activeOpacity={0.8}
                style={[
                  styles.scopePill,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  isActive && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                <Icon size={14} color={isActive ? '#ffffff' : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text
                  style={[
                    styles.scopePillText,
                    { color: isActive ? '#ffffff' : colors.textSecondary, fontWeight: isActive ? '800' : '600' },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 50 }} />
        ) : jobs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Open Broadcasts in {scope === 'all' ? 'India' : scopeTabs.find(t => t.id === scope)?.label}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {scope === 'city'
                ? `No jobs posted in ${proCity} right now. Tap "District" or "State" above to discover opportunities nearby!`
                : scope === 'district'
                ? `No jobs in ${proDistrict}. Try switching to "State" or "All India" for broader access.`
                : 'Check back soon. New customer shoot requests are broadcast in real-time.'}
            </Text>

            {scope !== 'district' && scope !== 'state' && (
              <TouchableOpacity
                style={[styles.expandBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}
                onPress={() => setScope('district')}
              >
                <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13 }}>Expand to ${proDistrict || 'District'} →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          jobs.map(job => (
            <Card key={job.id} style={{ marginBottom: 16, borderColor: colors.accent, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '900', flex: 1, marginRight: 8 }}>
                  {job.title}
                </Text>
                <View style={{ backgroundColor: colors.accentGlow, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '900' }}>HOT LEAD</Text>
                </View>
              </View>

              <Text style={{ color: colors.textSecondary, marginTop: 10, lineHeight: 20 }}>
                {job.requirements}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MapPin size={14} color="#3fb668" style={{ marginRight: 6 }} />
                  <Text style={[styles.metaText, { color: colors.textPrimary, fontWeight: '700' }]} numberOfLines={1}>
                    {job.location}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Wallet size={14} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '900' }}>
                    ₹{job.budget.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <Button
                title="Accept & Lock Lead"
                variant="primary"
                size="md"
                onPress={() => handleAccept(job.id)}
                style={{ marginTop: 16 }}
              />
            </Card>
          ))
        )}
      </ScrollView>
      </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  customerRestrictedCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  customerIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  customerRestrictedTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  customerRestrictedDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  customerHighlightBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  customerHighlightTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  customerHighlightSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  customerPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
  },
  customerPostBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 160,
  },
  locationBadgeText: { fontSize: 11, fontWeight: '700' },
  scopeContainer: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  scopeScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  scopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  scopePillText: { fontSize: 13 },
  content: { padding: 16, paddingBottom: 100 },
  emptyCard: {
    marginTop: 30,
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySub: { textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 20 },
  expandBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: { fontSize: 13 },
});
