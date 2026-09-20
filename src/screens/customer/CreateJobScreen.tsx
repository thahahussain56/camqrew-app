import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { jobApi } from '../../api/jobApi';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { formatLocationString } from '../../constants/locations';
import { Briefcase, ArrowLeft, ArrowRight } from 'lucide-react-native';

export const CreateJobScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { selectedCity } = useLocationStore();
  
  const [title, setTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [state, setState] = useState(selectedCity?.state || 'Maharashtra');
  const [district, setDistrict] = useState('Mumbai Suburban');
  const [city, setCity] = useState(selectedCity?.city || 'Mumbai');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const formattedLoc = formatLocationString(city, district, state);
    if (!title || !requirements || !formattedLoc || !budget) {
      Alert.alert('Missing Fields', 'Please fill in all details including the location.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    setLoading(true);
    try {
      await jobApi.createJobRequest({
        client_id: user.id,
        title,
        requirements,
        location: formattedLoc,
        state,
        district,
        city,
        budget: Number(budget)
      });
      
      Alert.alert('Job Broadcasted!', `Your request has been broadcasted to verified professionals in ${city || district}.`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not post the job request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Post a Job Request</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.infoBox, { backgroundColor: colors.surfaceElevated }]}>
            <Briefcase size={24} color={colors.accent} style={{ marginBottom: 8 }} />
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Reverse Pitching</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              Post your exact requirements and budget. Verified Pro members in your city will see this and can pitch directly to you. First to accept will be locked in for your review.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.jobBoardLink, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent, borderWidth: 1 }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('JobBoardScreen')}
          >
            <Briefcase size={18} color={colors.accent} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.jobBoardLinkTitle, { color: colors.textPrimary }]}>Looking to accept jobs instead?</Text>
              <Text style={[styles.jobBoardLinkSub, { color: colors.textSecondary }]}>Browse open shoot leads on the Job Board</Text>
            </View>
            <ArrowRight size={16} color={colors.accent} />
          </TouchableOpacity>

          <Input
            label="Job Title"
            placeholder="e.g. Drone operator for music video"
            value={title}
            onChangeText={setTitle}
            containerStyle={{ marginTop: 16 }}
          />

          <View style={{ marginTop: 16 }}>
            <LocationCascader
              label="Shoot Locality (State → District → City/Town)"
              selectedState={state}
              selectedDistrict={district}
              selectedCity={city}
              onSelect={(s, d, c) => {
                setState(s);
                setDistrict(d);
                setCity(c);
              }}
              required
            />
          </View>

          <Input
            label="Budget (₹)"
            placeholder="e.g. 10000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            containerStyle={{ marginTop: 16 }}
          />

          <Input
            label="Detailed Requirements"
            placeholder="Describe the project, dates, required gear..."
            value={requirements}
            onChangeText={setRequirements}
            multiline
            numberOfLines={5}
            containerStyle={{ marginTop: 16 }}
          />

          <Button
            title="Broadcast Job Request"
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 32 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 40 },
  infoBox: { padding: 16, borderRadius: 12 },
  infoTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 20 },
  jobBoardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  jobBoardLinkTitle: { fontSize: 14, fontWeight: '800' },
  jobBoardLinkSub: { fontSize: 12, marginTop: 2 },
});
