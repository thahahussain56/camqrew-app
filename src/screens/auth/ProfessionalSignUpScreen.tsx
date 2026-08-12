import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { StepperProgress } from '../../components/ui/StepperProgress';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { Chip } from '../../components/ui/Chip';
import { PROFESSIONAL_CATEGORIES } from '../../constants/categories';
import { Card } from '../../components/ui/Card';

const STEP_TITLES = ['Account Details', 'Professional Info', 'Location & Rates', 'Portfolio', 'Review & Submit'];

export const ProfessionalSignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { login } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [title, setTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Photographers']);
  const [experienceYears, setExperienceYears] = useState('5');
  const [bio, setBio] = useState('');

  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Mumbai Suburban');
  const [city, setCity] = useState('Mumbai');
  const [ratePerDay, setRatePerDay] = useState('25000');

  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        phone,
        password,
        title,
        categories: selectedCategories,
        experienceYears: Number(experienceYears),
        bio,
        state,
        district,
        city,
        ratePerDay: Number(ratePerDay),
      };
      const res = await authApi.registerProfessional(payload);
      await login(res.user, res.token);
      navigation.replace('MainApp');
    } catch (e) {
      console.warn('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Join as a Professional</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Grow your creative studio & get booked by top clients
        </Text>
      </View>

      <StepperProgress totalSteps={5} currentStep={currentStep} stepTitles={STEP_TITLES} />

      <Card style={styles.card}>
        {currentStep === 1 && (
          <View>
            <Input label="Full Name" placeholder="Aarav Sharma" value={name} onChangeText={setName} />
            <Input label="Email" placeholder="aarav@studio.in" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Input label="Phone Number" placeholder="+91 9876543210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} isPassword />
          </View>
        )}

        {currentStep === 2 && (
          <View>
            <Input label="Professional Title" placeholder="Senior Fashion Photographer" value={title} onChangeText={setTitle} />

            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Categories</Text>
            <View style={styles.chipsWrap}>
              {PROFESSIONAL_CATEGORIES.map(cat => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  active={selectedCategories.includes(cat.name)}
                  onPress={() => toggleCategory(cat.name)}
                />
              ))}
            </View>

            <Input label="Years of Experience" placeholder="5" value={experienceYears} onChangeText={setExperienceYears} keyboardType="numeric" />
            <Input label="Bio / About You" placeholder="Describe your studio work..." value={bio} onChangeText={setBio} multiline numberOfLines={3} style={{ height: 80 }} />
          </View>
        )}

        {currentStep === 3 && (
          <View>
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
            <Input label="Base Day Rate (₹)" placeholder="25000" value={ratePerDay} onChangeText={setRatePerDay} keyboardType="numeric" />
          </View>
        )}

        {currentStep === 4 && (
          <View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Portfolio Media Upload</Text>
            <Text style={[styles.hintText, { color: colors.textFaint }]}>
              4 sample showcase photos will be attached to your professional profile.
            </Text>
          </View>
        )}

        {currentStep === 5 && (
          <View>
            <Text style={[styles.reviewHeader, { color: colors.accent }]}>Account Summary</Text>
            <Text style={[styles.reviewRow, { color: colors.textPrimary }]}>Name: {name || 'Aarav Sharma'}</Text>
            <Text style={[styles.reviewRow, { color: colors.textPrimary }]}>Title: {title || 'Senior Fashion Photographer'}</Text>
            <Text style={[styles.reviewRow, { color: colors.textPrimary }]}>Location: {city}, {state}</Text>
            <Text style={[styles.reviewRow, { color: colors.textPrimary }]}>Starting Rate: ₹{Number(ratePerDay).toLocaleString('en-IN')}/day</Text>
          </View>
        )}
      </Card>

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
          title={currentStep === 5 ? 'Submit Application' : 'Continue'}
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleNext}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 13,
    marginVertical: 12,
  },
  reviewHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  reviewRow: {
    fontSize: 14,
    marginVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
});
