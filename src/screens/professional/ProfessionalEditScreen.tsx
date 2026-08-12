import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { ProfessionalProfile, ServiceItem } from '../../types/professional';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { ChipInput } from '../../components/forms/ChipInput';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { Toast } from '../../components/ui/Toast';
import { PROFESSIONAL_CATEGORIES } from '../../constants/categories';
import { ChevronDown, ChevronUp, Plus, Trash2, Save, Camera, Image as ImageIcon } from 'lucide-react-native';

export const ProfessionalEditScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Accordion Section Toggle State
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    media: true,
    basic: true,
    services: true,
    locations: true,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Form State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [gstin, setGstin] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [categories, setCategories] = useState<string[]>(['Photographers']);
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Mumbai');
  const [city, setCity] = useState('Mumbai');
  const [ratePerDay, setRatePerDay] = useState('15000');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [iCalUrl, setICalUrl] = useState('');
  const [internationalTravel, setInternationalTravel] = useState(true);
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [youtube, setYoutube] = useState('');
  const [facebook, setFacebook] = useState('');

  // Image Upload State
  const [avatar, setAvatar] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [portfolio, setPortfolio] = useState<string[]>([]);

  // New Service Input Form State
  const [newSrvTitle, setNewSrvTitle] = useState('');
  const [newSrvRate, setNewSrvRate] = useState('');
  const [newSrvUnit, setNewSrvUnit] = useState('per day');
  const [newSrvDesc, setNewSrvDesc] = useState('');

  useEffect(() => {
    professionalApi.getProfessionals({ category: 'Photographers' }).then(list => {
      const p = list.length > 0 ? list[0] : null;
      if (p) {
        setProfile(p);
        setName(p.name);
        setTitle(p.title);
        setBio(p.bio);
        setExperienceYears(p.experienceYears ? p.experienceYears.toString() : '5');
        setCategories(p.categories || ['Photographers']);
        setState(p.state || 'Maharashtra');
        setDistrict(p.district || 'Mumbai');
        setCity(p.city || 'Mumbai');
        setRatePerDay(p.ratePerDay ? p.ratePerDay.toString() : '15000');
        setEquipment(p.equipment || []);
        setCertifications(p.certifications || []);
        setServices(p.services || []);
        setICalUrl(p.iCalUrl || '');
        setAvatar(p.avatar || '');
        setBannerImage(p.bannerImage || '');
        setPortfolio(p.portfolio || []);
      }
    });
  }, []);

  const pickImage = async (target: 'avatar' | 'banner' | 'portfolio') => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access photo gallery is required!');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: target !== 'portfolio',
        aspect: target === 'banner' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0].uri;
        if (target === 'avatar') setAvatar(uri);
        else if (target === 'banner') setBannerImage(uri);
        else if (target === 'portfolio') setPortfolio([...portfolio, uri]);
        setToastMessage('Image selected successfully!');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to launch image picker');
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const handleAddService = () => {
    if (!newSrvTitle || !newSrvRate) return;
    const item: ServiceItem = {
      id: 'srv_' + Date.now(),
      title: newSrvTitle,
      category: categories[0] || 'Photographers',
      rate: Number(newSrvRate),
      unit: newSrvUnit,
      description: newSrvDesc,
    };
    setServices([...services, item]);
    setNewSrvTitle('');
    setNewSrvRate('');
    setNewSrvDesc('');
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await professionalApi.updateProfile({
        name,
        title,
        bio,
        gstin,
        avatar,
        bannerImage,
        portfolio,
        experienceYears: Number(experienceYears),
        categories,
        state,
        district,
        city,
        ratePerDay: Number(ratePerDay),
        equipment,
        certifications,
        services,
        iCalUrl,
        internationalTravel,
        socials: { instagram, website, youtube, facebook },
      });
      setToastMessage('Profile updated successfully!');
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (e) {
      setToastMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Toast visible={!!toastMessage} message={toastMessage} type="success" onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Professional Profile</Text>
      </View>

      {/* 1. Media & Photos Upload Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('media')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>1. Profile & Portfolio Media</Text>
          {openSections.media ? <ChevronUp size={20} color="#fc8019" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.media && (
          <View style={styles.accordionBody}>
            {/* Avatar Upload */}
            <Text style={[styles.subHeading, { color: colors.textPrimary }]}>Profile Avatar Photo</Text>
            <View style={styles.imagePickerRow}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarPreview} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.chipBg }]}>
                  <Camera size={24} color={colors.textFaint} />
                </View>
              )}
              <TouchableOpacity
                style={[styles.uploadBtn, { backgroundColor: '#fc8019' }]}
                onPress={() => pickImage('avatar')}
              >
                <Camera size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.uploadBtnText}>Upload Avatar</Text>
              </TouchableOpacity>
            </View>

            {/* Banner Image Upload */}
            <Text style={[styles.subHeading, { color: colors.textPrimary, marginTop: 16 }]}>Banner Cover Image</Text>
            <View style={styles.bannerPickerBox}>
              {bannerImage ? (
                <Image source={{ uri: bannerImage }} style={styles.bannerPreview} />
              ) : (
                <View style={[styles.bannerPlaceholder, { backgroundColor: colors.chipBg }]}>
                  <ImageIcon size={28} color={colors.textFaint} />
                </View>
              )}
              <TouchableOpacity
                style={[styles.uploadBtn, { backgroundColor: colors.surfaceCard, marginTop: 8 }]}
                onPress={() => pickImage('banner')}
              >
                <ImageIcon size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.uploadBtnText, { color: colors.textPrimary }]}>Change Banner Cover</Text>
              </TouchableOpacity>
            </View>

            {/* Portfolio Gallery Upload */}
            <Text style={[styles.subHeading, { color: colors.textPrimary, marginTop: 16 }]}>Portfolio Showcase Gallery</Text>
            <View style={styles.portfolioGrid}>
              {portfolio.map((img, i) => (
                <View key={i} style={styles.portfolioThumbWrapper}>
                  <Image source={{ uri: img }} style={styles.portfolioThumb} />
                  <TouchableOpacity style={styles.removeThumbBtn} onPress={() => removePortfolioImage(i)}>
                    <Trash2 size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addPortfolioBtn, { backgroundColor: colors.chipBg, borderColor: colors.border }]}
                onPress={() => pickImage('portfolio')}
              >
                <Plus size={20} color="#fc8019" />
                <Text style={[styles.addPortText, { color: colors.textSecondary }]}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>

      {/* 2. Basic Info Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('basic')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>2. Basic Information</Text>
          {openSections.basic ? <ChevronUp size={20} color="#fc8019" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.basic && (
          <View style={styles.accordionBody}>
            <Input label="Full Name" value={name} onChangeText={setName} />
            <Input label="Professional Title" value={title} onChangeText={setTitle} />
            <Input label="GSTIN Registration Number (Optional)" placeholder="e.g. 27AAAAA0000A1Z5" value={gstin} onChangeText={setGstin} />
            <Input label="Bio / Executive Summary (500 char max)" value={bio} onChangeText={setBio} multiline numberOfLines={4} style={{ height: 90 }} />
            <Input label="Years of Experience" value={experienceYears} onChangeText={setExperienceYears} keyboardType="numeric" />

            <Text style={[styles.subHeading, { color: colors.textPrimary, marginTop: 14 }]}>Social Profiles & Portfolio Links</Text>
            <Input label="Website / Portfolio URL" placeholder="https://yourportfolio.com" value={website} onChangeText={setWebsite} />
            <Input label="Instagram Handle" placeholder="instagram.com/yourhandle" value={instagram} onChangeText={setInstagram} />
            <Input label="YouTube Channel URL" placeholder="youtube.com/@yourchannel" value={youtube} onChangeText={setYoutube} />
            <Input label="Facebook Page URL" placeholder="facebook.com/yourpage" value={facebook} onChangeText={setFacebook} />
          </View>
        )}
      </Card>

      {/* 3. Service Categories Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('categories')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>3. Service Categories</Text>
          {openSections.categories ? <ChevronUp size={20} color="#fc8019" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.categories && (
          <View style={styles.accordionBody}>
            <View style={styles.chipsWrap}>
              {PROFESSIONAL_CATEGORIES.map(cat => {
                const isSelected = categories.includes(cat.name);
                return (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    active={isSelected}
                    onPress={() => {
                      if (isSelected) setCategories(categories.filter(c => c !== cat.name));
                      else setCategories([...categories, cat.name]);
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}
      </Card>

      {/* 4. Services Offered CRUD Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('services')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>4. Services & Pricing Packages</Text>
          {openSections.services ? <ChevronUp size={20} color="#fc8019" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.services && (
          <View style={styles.accordionBody}>
            {services.map(srv => (
              <View key={srv.id} style={[styles.srvBox, { backgroundColor: colors.chipBg, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.srvTitle, { color: colors.textPrimary }]}>{srv.title}</Text>
                  <Text style={[styles.srvRate, { color: '#fc8019' }]}>₹{srv.rate.toLocaleString('en-IN')} /{srv.unit}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveService(srv.id)}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.addBox, { borderColor: colors.border }]}>
              <Text style={[styles.addTitle, { color: '#fc8019' }]}>+ Add New Package</Text>
              <Input label="Service Title" placeholder="e.g. Full Day Shoot" value={newSrvTitle} onChangeText={setNewSrvTitle} />
              <Input label="Rate (₹)" placeholder="15000" value={newSrvRate} onChangeText={setNewSrvRate} keyboardType="numeric" />
              <Input label="Short Description" placeholder="Package inclusions..." value={newSrvDesc} onChangeText={setNewSrvDesc} />
              <Button title="Add Package" variant="outline" size="sm" onPress={handleAddService} />
            </View>
          </View>
        )}
      </Card>

      {/* 5. Indian Location System Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('locations')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>5. Primary Location & Rate</Text>
          {openSections.locations ? <ChevronUp size={20} color="#fc8019" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.locations && (
          <View style={styles.accordionBody}>
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
            <Input label="Starting Day Rate (₹)" value={ratePerDay} onChangeText={setRatePerDay} keyboardType="numeric" />
          </View>
        )}
      </Card>

      {/* 6. Equipment Roster Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('equipment')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>6. Equipment Roster</Text>
          {openSections.equipment ? <ChevronUp size={20} color="#fc8019" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.equipment && (
          <View style={styles.accordionBody}>
            <ChipInput
              label="Add Gear / Lenses"
              items={equipment}
              onAdd={item => setEquipment([...equipment, item])}
              onRemove={index => setEquipment(equipment.filter((_, i) => i !== index))}
            />
          </View>
        )}
      </Card>

      {/* 7. Skills & Certifications Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('skills')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>7. Skills & Industry Badges</Text>
          {openSections.skills ? <ChevronUp size={20} color="#fc8019" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.skills && (
          <View style={styles.accordionBody}>
            <ChipInput
              label="Add Certifications (e.g., DGCA Drone Pilot, RED Operator)"
              items={certifications}
              onAdd={item => setCertifications([...certifications, item])}
              onRemove={index => setCertifications(certifications.filter((_, i) => i !== index))}
            />

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}
              onPress={() => setInternationalTravel(!internationalTravel)}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: internationalTravel ? '#fc8019' : colors.textFaint,
                  backgroundColor: internationalTravel ? '#fc8019' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                {internationalTravel && <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                Willing to travel internationally for shoots ✈️
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      <Button
        title="Save Profile Changes"
        variant="primary"
        size="lg"
        loading={loading}
        icon={<Save size={18} color="#ffffff" />}
        onPress={handleSave}
        style={{ marginVertical: 30, backgroundColor: '#fc8019' }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 64,
    paddingBottom: 115,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  accordionCard: {
    marginBottom: 16,
    borderWidth: 0,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  accordionBody: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPickerBox: {
    width: '100%',
  },
  bannerPreview: {
    width: '100%',
    height: 110,
    borderRadius: 12,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portfolioThumbWrapper: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  portfolioThumb: {
    width: '100%',
    height: '100%',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e11d48',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPortfolioBtn: {
    width: 76,
    height: 76,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPortText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  srvBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  srvTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  srvRate: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  addBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  addTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
});
