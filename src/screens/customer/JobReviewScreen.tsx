import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { jobApi } from '../../api/jobApi';
import { JobRequest } from '../../types/job';
import { ProfessionalProfile } from '../../types/professional';
import { Button } from '../../components/ui/Button';
import { Star, MapPin, Briefcase, ChevronLeft, CheckCircle } from 'lucide-react-native';

export const JobReviewScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { jobId, acceptedBy, jobTitle, budget: passedBudget, location: passedLocation, requirements: passedReqs } = route.params || {};
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [job, setJob] = useState<JobRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [];
        if (acceptedBy) {
          promises.push(professionalApi.getProfileById(acceptedBy).then(p => { if (isMounted) setProfile(p); }));
        }
        if (jobId) {
          promises.push(jobApi.getJobById(jobId).then(j => { if (isMounted) setJob(j); }));
        }
        await Promise.all(promises);
      } catch (e) {
        console.warn('Error loading review details', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [acceptedBy, jobId]);

  const finalBudget = job?.budget || Number(passedBudget) || profile?.ratePerDay || 15000;
  const finalTitle = job?.title || jobTitle || 'Custom Broadcast Job';
  const finalLocation = job?.location || passedLocation || (profile ? `${profile.city}, ${profile.state}` : '');
  const finalRequirements = job?.requirements || passedReqs || '';

  const handleAccept = () => {
    if (!profile) return;
    // Navigate to Booking screen with the pro and broadcast job details pre-filled
    navigation.navigate('Booking', {
      proId: profile.id,
      professionalId: profile.id,
      type: 'professionals',
      jobId: jobId || job?.id,
      jobTitle: finalTitle,
      jobBudget: finalBudget,
      jobLocation: finalLocation,
      jobRequirements: finalRequirements,
      jobState: job?.state || profile.state,
      jobDistrict: job?.district || profile.district,
      jobCity: job?.city || profile.city,
    });
  };

  const handleReject = () => {
    Alert.alert(
      'Reject & Re-open Job',
      'This will decline this creator and reopen your broadcast job for other local verified pros.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline & Reopen',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await jobApi.rejectPro(jobId || job?.id || '', acceptedBy);
              Alert.alert('Job Reopened', 'Your broadcast has been reopened for local creators.');
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to reject pro');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Could not load professional profile.</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Review Applicant</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Job info banner */}
        <View style={[styles.jobBanner, { backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderLight }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <Briefcase size={18} color={colors.accent} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>
              Broadcast Job Proposal
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary, marginBottom: 6 }}>
            {finalTitle}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>{finalLocation}</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.accent }}>
              ₹{finalBudget.toLocaleString('en-IN')}
            </Text>
          </View>
          {finalRequirements ? (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' }}>
              Scope: {finalRequirements}
            </Text>
          ) : null}
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceCard }]}>
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.name}</Text>
          <Text style={[styles.title, { color: colors.accent }]}>{profile.title}</Text>

          <View style={styles.metaRow}>
            <Star size={14} color="#F5A623" fill="#F5A623" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {profile.rating?.toFixed(1) || '5.0'} ({profile.reviewCount || 0} reviews)
            </Text>
            <View style={{ width: 16 }} />
            <MapPin size={14} color={colors.textFaint} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {profile.city}, {profile.state}
            </Text>
          </View>

          {profile.categories?.length > 0 && (
            <View style={styles.tagsRow}>
              {profile.categories.map(cat => (
                <View key={cat} style={[styles.tag, { backgroundColor: colors.chipBg }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>{cat}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.bioLabel, { color: colors.textSecondary }]}>About</Text>
          <Text style={[styles.bio, { color: colors.textPrimary }]}>{profile.bio || 'No bio provided.'}</Text>

          <View style={[styles.rateRow, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Agreed Job Rate</Text>
            <Text style={[styles.rateValue, { color: colors.accent }]}>
              ₹{finalBudget.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Reject & Reopen"
          variant="outline"
          onPress={handleReject}
          loading={actionLoading}
          style={{ flex: 1, marginRight: 8, borderColor: '#ef4444' }}
          textStyle={{ color: '#ef4444' }}
        />
        <Button
          title={`Accept & Book (₹${finalBudget.toLocaleString('en-IN')}) →`}
          variant="primary"
          onPress={handleAccept}
          style={{ flex: 1.5 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  jobBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  jobBannerText: { flex: 1, fontSize: 13 },
  profileCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  metaText: { fontSize: 13 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '600' },
  bioLabel: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  bio: { alignSelf: 'flex-start', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  rateRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12 },
  rateLabel: { fontSize: 13 },
  rateValue: { fontSize: 20, fontWeight: '800' },
  actionBar: { flexDirection: 'row', padding: 16, paddingBottom: 32, borderTopWidth: 1 },
});