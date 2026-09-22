import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { professionalApi } from '../../api/professionalApi';
import { cloudStorageApi } from '../../api/cloudStorageApi';
import { ProfessionalProfile, ServiceItem, VideoReelItem, MenuDishItem } from '../../types/professional';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { ChipInput } from '../../components/forms/ChipInput';
import { LocationCascader } from '../../components/forms/LocationCascader';
import { Toast } from '../../components/ui/Toast';
import { PROFESSIONAL_CATEGORIES, getArchetype } from '../../constants/categories';
import { ChevronDown, ChevronUp, Plus, Minus, Trash2, Save, Camera, Image as ImageIcon, Film, Play, UploadCloud, CheckCircle, Video, UtensilsCrossed } from 'lucide-react-native';

export const ProfessionalEditScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Accordion Section Toggle State
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    media: true,
    reels: true,
    basic: true,
    locations: true,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Video Reels State (Direct Video Upload)
  const [videoReels, setVideoReels] = useState<VideoReelItem[]>([]);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>('');
  const [selectedVideoSize, setSelectedVideoSize] = useState<string>('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelCategory, setNewReelCategory] = useState('Showreel');
  const [newReelIsShort, setNewReelIsShort] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [gstin, setGstin] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [categories, setCategories] = useState<string[]>(['Photographers']);
  const activeArchetype = getArchetype(categories);
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Mumbai');
  const [city, setCity] = useState('Mumbai');
  const [ratePerDay, setRatePerDay] = useState('15000');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
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
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newService, setNewService] = useState<{title: string, rate: string, unit: string, category: string, deliverables: string, type: 'standard' | 'package'}>({ title: '', rate: '', unit: 'Day', category: 'Photography', deliverables: '', type: 'standard' });

  // Menu / Dishes State (Caterers only)
  const [menuItems, setMenuItems] = useState<MenuDishItem[]>([]);
  const [newDish, setNewDish] = useState<{
    name: string;
    category: MenuDishItem['category'];
    pricePerPlate: string;
    dietaryTags: MenuDishItem['dietaryTags'];
    description: string;
    imageUrl: string;
    minQuantity?: string;
    unit?: string;
    prepTime?: string;
  }>({
    name: '',
    category: 'Starter',
    pricePerPlate: '',
    dietaryTags: ['Veg'],
    description: '',
    imageUrl: '',
    minQuantity: '',
    unit: '',
    prepTime: '',
  });

  useEffect(() => {
    if (user?.id) {
      professionalApi.getProfileById(user.id).then(p => {
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
          setICalUrl(p.iCalUrl || '');
          setAvatar(p.avatar || '');
          setBannerImage(p.bannerImage || '');
          setPortfolio(p.portfolio || []);
          setServices(p.services || []);
          setMenuItems(p.menuItems || []);
          setVideoReels(p.videoReels || []);
        }
      }).catch(console.warn);
    }
  }, [user?.id]);

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

  const pickVideoForReel = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access your video gallery is required!');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setSelectedVideoUri(asset.uri);
        const filename = asset.fileName || asset.uri.split('/').pop() || 'reel_video.mp4';
        setSelectedVideoName(filename);
        if (asset.fileSize) {
          const mb = (asset.fileSize / (1024 * 1024)).toFixed(1);
          setSelectedVideoSize(`${mb} MB`);
        } else {
          setSelectedVideoSize('');
        }
        if (asset.width && asset.height) {
          setNewReelIsShort(asset.height >= asset.width);
        }
        setToastMessage('Video file selected!');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to select video: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleUploadReel = async () => {
    if (!selectedVideoUri) {
      Alert.alert('No Video Selected', 'Please select a video file from your device first.');
      return;
    }

    setUploadingVideo(true);
    try {
      const uploadRes = await cloudStorageApi.uploadVideo(selectedVideoUri, 'reels');
      const newReel: VideoReelItem = {
        id: 'reel_' + Date.now(),
        title: newReelTitle.trim() || (newReelIsShort ? 'Vertical Reel' : 'Featured Showreel'),
        url: uploadRes.url,
        type: 'direct',
        embedUrl: uploadRes.url,
        thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800',
        category: newReelCategory,
        isShort: newReelIsShort,
      };

      setVideoReels(prev => [newReel, ...prev]);
      setSelectedVideoUri(null);
      setSelectedVideoName('');
      setSelectedVideoSize('');
      setNewReelTitle('');
      setNewReelIsShort(true);
      setToastMessage('🎬 Video reel uploaded successfully!');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload video. Please try again.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveReel = (id: string) => {
    setVideoReels(prev => prev.filter(r => r.id !== id));
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
        iCalUrl,
        internationalTravel,
        socials: { instagram, website, youtube, facebook },
        services,
        menuItems,
        videoReels,
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
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Toast visible={!!toastMessage} message={toastMessage} type="success" onDismiss={() => setToastMessage('')} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Professional Profile</Text>
      </View>

      {/* 1. Media & Photos Upload Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('media')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>1. Profile & Portfolio Media</Text>
          {openSections.media ? <ChevronUp size={20} color="#3fb668" /> : <ChevronDown size={20} color={colors.textSecondary} />}
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
                style={[styles.uploadBtn, { backgroundColor: '#3fb668' }]}
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
                <Plus size={20} color="#3fb668" />
                <Text style={[styles.addPortText, { color: colors.textSecondary }]}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>

      {/* 2. Showreels & Video Reels (Direct Video Upload) */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('reels')}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>2. Video Reels (Upload Videos)</Text>
            {videoReels.length > 0 && (
              <View style={{ marginLeft: 8, backgroundColor: '#3fb668', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{videoReels.length}</Text>
              </View>
            )}
          </View>
          {openSections.reels ? <ChevronUp size={20} color="#3fb668" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.reels && (
          <View style={styles.accordionBody}>
            <Text style={[styles.subHeading, { color: colors.textSecondary, marginBottom: 12 }]}>
              Upload 9:16 vertical reels and showreels directly from your device. Videos stream seamlessly in the Reels feed and profile.
            </Text>

            {/* Current Reels List */}
            {videoReels.map((reel) => (
              <View key={reel.id} style={[styles.reelEditCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
                {reel.thumbnailUrl ? (
                  <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelEditThumb} />
                ) : (
                  <View style={[styles.reelEditThumb, { backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }]}>
                    <Film size={20} color="#3fb668" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <View style={{ backgroundColor: 'rgba(63,182,104,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#3fb668', fontSize: 10, fontWeight: '800' }}>
                        {reel.isShort ? '9:16 REEL' : 'VIDEO'}
                      </Text>
                    </View>
                    {reel.category ? (
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>• {reel.category}</Text>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{reel.title}</Text>
                  <Text style={{ color: colors.textFaint, fontSize: 11 }} numberOfLines={1}>{reel.url}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveReel(reel.id)} style={{ padding: 8 }}>
                  <Trash2 size={16} color="#e11d48" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Reel Form */}
            <View style={[styles.addBox, { borderColor: colors.borderLight, marginTop: 10 }]}>
              <Text style={[styles.addTitle, { color: colors.textPrimary }]}>Upload Video Reel</Text>
              
              {/* Video File Picker Button / Card */}
              {selectedVideoUri ? (
                <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.accent, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.accentGlow, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <Video size={20} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{selectedVideoName}</Text>
                        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                          ✓ Video Selected {selectedVideoSize ? `• ${selectedVideoSize}` : ''}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={pickVideoForReel}
                      disabled={uploadingVideo}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderLight }}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: colors.accent,
                    backgroundColor: colors.accentGlow,
                    borderRadius: 16,
                    padding: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                  onPress={pickVideoForReel}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(63,182,104,0.15)', borderWidth: 1.5, borderColor: 'rgba(63,182,104,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <UploadCloud size={28} color={colors.accent} />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 14.5 }}>Choose Video File</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>Supports all video formats (MP4, MOV, WebM, AVI, MKV, etc.)</Text>
                </TouchableOpacity>
              )}

              <Input
                label="Reel Title"
                placeholder="e.g. Wedding Cinematic Teaser 2026, Drone Reel"
                value={newReelTitle}
                onChangeText={setNewReelTitle}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['Showreel', 'Wedding', 'Commercial', 'Fashion', 'Music Video', 'Short Film', 'Drone Reel'].map(cat => (
                  <Chip
                    key={cat}
                    label={cat}
                    active={newReelCategory === cat}
                    onPress={() => setNewReelCategory(cat)}
                  />
                ))}
              </ScrollView>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}
                onPress={() => setNewReelIsShort(!newReelIsShort)}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: newReelIsShort ? '#3fb668' : colors.textFaint,
                    backgroundColor: newReelIsShort ? '#3fb668' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  {newReelIsShort && <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>✓</Text>}
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                  Vertical 9:16 Reel Format (Recommended for Reels Feed)
                </Text>
              </TouchableOpacity>

              <Button
                title={uploadingVideo ? "Uploading Video..." : "Upload & Save Reel"}
                variant="primary"
                size="md"
                disabled={!selectedVideoUri || uploadingVideo}
                loading={uploadingVideo}
                icon={<UploadCloud size={16} color="#ffffff" />}
                onPress={handleUploadReel}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        )}
      </Card>

      {/* 3. Basic Info Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('basic')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>3. Basic Information</Text>
          {openSections.basic ? <ChevronUp size={20} color="#3fb668" /> : <ChevronDown size={20} color={colors.textSecondary} />}
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

      {/* 3. Profile Categories & Services Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('categories')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>3. Profile Categories & Services</Text>
          {openSections.categories ? <ChevronUp size={20} color="#3fb668" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.categories && (
          <View style={styles.accordionBody}>
            <Text style={[styles.subHeading, { color: colors.textPrimary }]}>Profile Categories (Select Multiple)</Text>
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

            <Text style={[styles.subHeading, { color: colors.textPrimary, marginTop: 24 }]}>Your Services</Text>
            {services.map((srv, idx) => (
              <View key={idx} style={[styles.srvBox, { borderColor: colors.borderLight }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.srvTitle, { color: colors.textPrimary }]}>{srv.title}</Text>
                    {srv.type === 'package' && (
                      <View style={{ backgroundColor: colors.accentGlow, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900' }}>PACKAGE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.srvRate, { color: colors.accent }]}>₹{srv.rate} {srv.type !== 'package' ? `/ ${srv.unit}` : '(Fixed)'} • {srv.category}</Text>
                  {srv.deliverables ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Deliverables: {srv.deliverables}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => setServices(services.filter((_, i) => i !== idx))} style={{ padding: 8 }}>
                  <Trash2 size={16} color="#e11d48" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.addBox, { borderColor: colors.borderLight }]}>
              <Text style={[styles.addTitle, { color: colors.textPrimary }]}>Add New Service</Text>
              
              <View style={{ flexDirection: 'row', marginBottom: 12, backgroundColor: colors.surfaceCard, borderRadius: 8, padding: 4 }}>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: newService.type === 'standard' ? colors.surfaceElevated : 'transparent' }}
                  onPress={() => setNewService({...newService, type: 'standard', unit: 'Day'})}
                >
                  <Text style={{ fontWeight: newService.type === 'standard' ? '800' : '500', color: newService.type === 'standard' ? colors.textPrimary : colors.textSecondary }}>Standard Rate</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: newService.type === 'package' ? colors.surfaceElevated : 'transparent' }}
                  onPress={() => setNewService({...newService, type: 'package', unit: 'Flat Rate'})}
                >
                  <Text style={{ fontWeight: newService.type === 'package' ? '800' : '500', color: newService.type === 'package' ? colors.accent : colors.textSecondary }}>Fixed Package</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>Service Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {PROFESSIONAL_CATEGORIES.map(cat => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    active={newService.category === cat.name}
                    onPress={() => setNewService({...newService, category: cat.name})}
                  />
                ))}
              </ScrollView>

              <Input 
                label={`Service Title (${activeArchetype.serviceTitlePlaceholder})`} 
                value={newService.title} 
                onChangeText={t => setNewService({...newService, title: t})} 
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input 
                    label={newService.type === 'package' ? "Package Price (₹)" : `Rate (₹ / ${newService.unit || activeArchetype.rateUnitDefault})`} 
                    value={newService.rate} 
                    onChangeText={t => setNewService({...newService, rate: t})} 
                    keyboardType="numeric" 
                  />
                </View>
                {newService.type === 'standard' && (
                  <View style={{ flex: 1 }}>
                    <Input 
                      label={`Unit (e.g. ${activeArchetype.rateUnitDefault})`} 
                      value={newService.unit || activeArchetype.rateUnitDefault} 
                      onChangeText={t => setNewService({...newService, unit: t})} 
                    />
                  </View>
                )}
              </View>
              <Input 
                label={`Deliverables (${activeArchetype.serviceDeliverablesPlaceholder})`} 
                value={newService.deliverables} 
                onChangeText={t => setNewService({...newService, deliverables: t})} 
              />
              <Button
                title={newService.type === 'package' ? "Add Package" : "Add Service"}
                variant="secondary"
                size="md"
                onPress={() => {
                  if (newService.title && newService.rate) {
                    setServices([...services, { 
                      id: Date.now().toString(), 
                      type: newService.type,
                      title: newService.title, 
                      rate: Number(newService.rate), 
                      unit: newService.type === 'package' ? 'Flat Rate' : (newService.unit || activeArchetype.rateUnitDefault), 
                      category: newService.category, 
                      description: '',
                      deliverables: newService.deliverables
                    }]);
                    setNewService({ title: '', rate: '', unit: activeArchetype.rateUnitDefault, category: newService.category, deliverables: '', type: 'standard' });
                  }
                }}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        )}
      </Card>

      {/* 4. Location & Base Rate Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('locations')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>4. Primary Location & Base Rate</Text>
          {openSections.locations ? <ChevronUp size={20} color="#3fb668" /> : <ChevronDown size={20} color={colors.textSecondary} />}
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
            <Input 
              label={activeArchetype.rateLabel} 
              placeholder={activeArchetype.ratePlaceholder}
              value={ratePerDay} 
              onChangeText={setRatePerDay} 
              keyboardType="numeric" 
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '600' }}>
                Default pricing unit: <Text style={{ color: colors.accent, fontWeight: '800' }}>per {activeArchetype.rateUnitDefault.toLowerCase()}</Text>
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* 5. Dynamic Capabilities / Equipment Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('equipment')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>5. {activeArchetype.equipmentSectionTitle}</Text>
          {openSections.equipment ? <ChevronUp size={20} color="#3fb668" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.equipment && (
          <View style={styles.accordionBody}>
            <ChipInput
              label={activeArchetype.equipmentInputLabel}
              items={equipment}
              onAdd={item => setEquipment([...equipment, item])}
              onRemove={index => setEquipment(equipment.filter((_, i) => i !== index))}
            />

            {activeArchetype.equipmentPresets && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>
                  Quick Suggestions ({activeArchetype.roleNoun}):
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {activeArchetype.equipmentPresets
                    .filter(preset => !equipment.includes(preset))
                    .slice(0, 8)
                    .map(preset => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => setEquipment([...equipment, preset])}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 14,
                          backgroundColor: colors.surfaceElevated,
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>+ {preset}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </View>
        )}
      </Card>

      {/* 6. Skills & Certifications Accordion */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('skills')}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>6. {activeArchetype.skillsSectionTitle}</Text>
          {openSections.skills ? <ChevronUp size={20} color="#3fb668" /> : <ChevronDown size={20} color={colors.textSecondary} />}
        </TouchableOpacity>

        {openSections.skills && (
          <View style={styles.accordionBody}>
            <ChipInput
              label={activeArchetype.skillsInputLabel}
              items={certifications}
              onAdd={item => setCertifications([...certifications, item])}
              onRemove={index => setCertifications(certifications.filter((_, i) => i !== index))}
            />

            {activeArchetype.skillsPresets && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>
                  Suggested Badges & Compliance:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {activeArchetype.skillsPresets
                    .filter(preset => !certifications.includes(preset))
                    .slice(0, 5)
                    .map(preset => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => setCertifications([...certifications, preset])}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 14,
                          backgroundColor: colors.surfaceElevated,
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>+ {preset}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}
              onPress={() => setInternationalTravel(!internationalTravel)}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: internationalTravel ? '#3fb668' : colors.textFaint,
                  backgroundColor: internationalTravel ? '#3fb668' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                {internationalTravel && <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 }}>
                {activeArchetype.travelCheckboxLabel}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* 7. Menu & Dishes (Caterers & Home Bakers) */}
      {(activeArchetype.archetype === 'catering' || activeArchetype.archetype === 'home_baker') && (
        <Card style={styles.accordionCard}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('menu')}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <UtensilsCrossed size={16} color="#3fb668" style={{ marginRight: 8 }} />
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {activeArchetype.archetype === 'home_baker' ? '7. Cakes, Bakes & Food Menu' : '7. Menu & Dishes'}
              </Text>
              {menuItems.length > 0 && (
                <View style={{ marginLeft: 8, backgroundColor: '#3fb668', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{menuItems.length}</Text>
                </View>
              )}
            </View>
            {openSections.menu ? <ChevronUp size={20} color="#3fb668" /> : <ChevronDown size={20} color={colors.textSecondary} />}
          </TouchableOpacity>

          {openSections.menu && (
            <View style={styles.accordionBody}>
              <Text style={[styles.subHeading, { color: colors.textSecondary, marginBottom: 12, fontWeight: '400' }]}>
                {activeArchetype.archetype === 'home_baker'
                  ? 'List your signature cakes, artisanal breads, and baked goods with rates and minimum order quantities.'
                  : 'List your dishes so customers can browse, select items, and get an instant quotation before booking.'}
              </Text>

              {/* Existing Dishes */}
              {menuItems.map((dish) => (
                <View key={dish.id} style={[styles.srvBox, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}>
                  {dish.imageUrl ? (
                    <Image
                      source={{ uri: dish.imageUrl }}
                      style={{ width: 48, height: 48, borderRadius: 8, marginRight: 10 }}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.srvTitle, { color: colors.textPrimary }]}>{dish.name}</Text>
                      {dish.dietaryTags.map(tag => (
                        <View key={tag} style={{
                          paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                          backgroundColor: (tag === 'Veg' || tag === 'Jain' || tag === 'Vegan') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: (tag === 'Veg' || tag === 'Jain' || tag === 'Vegan') ? '#16a34a' : '#dc2626' }}>
                            {tag.toUpperCase()}
                          </Text>
                        </View>
                      ))}
                      <View style={{ backgroundColor: colors.accentGlow, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800' }}>{dish.category.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.srvRate, { color: colors.accent, marginTop: 4 }]}>
                      ₹{dish.pricePerPlate.toLocaleString('en-IN')} /{dish.unit || 'plate'}
                      {dish.minQuantity ? ` • Min: ${dish.minQuantity}` : ''}
                    </Text>
                    {dish.prepTime ? (
                      <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                        ⏱️ Prep: {dish.prepTime}
                      </Text>
                    ) : null}
                    {dish.description ? (
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{dish.description}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => setMenuItems(prev => prev.map(d => d.id === dish.id ? { ...d, isAvailable: !d.isAvailable } : d))}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, marginRight: 4 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: dish.isAvailable ? colors.accent : colors.textSecondary }}>
                      {dish.isAvailable ? '● Live' : '○ Hidden'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMenuItems(prev => prev.filter(d => d.id !== dish.id))} style={{ padding: 8 }}>
                    <Trash2 size={16} color="#e11d48" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Dish Form */}
              <View style={[styles.addBox, { borderColor: colors.borderLight, marginTop: 10 }]}>
                <Text style={[styles.addTitle, { color: colors.textPrimary }]}>Add New Dish</Text>

                <Input
                  label="Dish Name"
                  placeholder="e.g. Butter Chicken, Paan Ice Cream"
                  value={newDish.name}
                  onChangeText={t => setNewDish({ ...newDish, name: t })}
                />

                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {(['Starter', 'Main Course', 'Dessert', 'Beverage', 'Live Counter', 'Cakes', 'Pastries', 'Savory', 'Breads', 'Other'] as MenuDishItem['category'][]).map(cat => (
                    <Chip
                      key={cat}
                      label={cat}
                      active={newDish.category === cat}
                      onPress={() => setNewDish({ ...newDish, category: cat })}
                    />
                  ))}
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1.2 }}>
                    <Input
                      label="Price (₹)"
                      placeholder="e.g. 250"
                      value={newDish.pricePerPlate}
                      onChangeText={t => setNewDish({ ...newDish, pricePerPlate: t })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Unit"
                      placeholder="Kg, plate, box"
                      value={newDish.unit || ''}
                      onChangeText={t => setNewDish({ ...newDish, unit: t })}
                    />
                  </View>
                </View>

                <Input
                  label="Minimum Order Qty (Optional)"
                  placeholder="e.g. 0.5 Kg, 1 Box, 1 Cake"
                  value={newDish.minQuantity || ''}
                  onChangeText={t => setNewDish({ ...newDish, minQuantity: t })}
                />

                <Input
                  label="Preparation Time / Notice (Optional)"
                  placeholder="e.g. 24 Hours Notice, 48 Hours, Same Day (4 hrs)"
                  value={newDish.prepTime || ''}
                  onChangeText={t => setNewDish({ ...newDish, prepTime: t })}
                />

                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>Dietary Type</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {(['Veg', 'Non-Veg', 'Jain', 'Vegan'] as ('Veg' | 'Non-Veg' | 'Jain' | 'Vegan')[]).map(tag => {
                    const isActive = newDish.dietaryTags.includes(tag);
                    const isGreen = tag === 'Veg' || tag === 'Jain' || tag === 'Vegan';
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => {
                          setNewDish(prev => ({
                            ...prev,
                            dietaryTags: isActive
                              ? prev.dietaryTags.filter(t => t !== tag)
                              : [...prev.dietaryTags, tag],
                          }));
                        }}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                          backgroundColor: isActive ? (isGreen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : colors.surfaceElevated,
                          borderWidth: 1,
                          borderColor: isActive ? (isGreen ? '#16a34a' : '#dc2626') : colors.borderLight,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? (isGreen ? '#16a34a' : '#dc2626') : colors.textSecondary }}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Input
                  label="Short Description (optional)"
                  placeholder="e.g. Slow-cooked in a rich tomato-butter gravy"
                  value={newDish.description}
                  onChangeText={t => setNewDish({ ...newDish, description: t })}
                />

                <Input
                  label="Dish Photo URL (optional)"
                  placeholder="https://images.unsplash.com/... or web image link"
                  value={newDish.imageUrl}
                  onChangeText={t => setNewDish({ ...newDish, imageUrl: t })}
                  autoCapitalize="none"
                />

                <Button
                  title="Add Dish to Menu"
                  variant="secondary"
                  size="md"
                  icon={<Plus size={15} color={colors.accent} />}
                  onPress={() => {
                    if (!newDish.name.trim() || !newDish.pricePerPlate) return;
                    const dish: MenuDishItem = {
                      id: 'dish_' + Date.now(),
                      name: newDish.name.trim(),
                      category: newDish.category,
                      pricePerPlate: Number(newDish.pricePerPlate),
                      dietaryTags: newDish.dietaryTags.length > 0 ? newDish.dietaryTags : ['Veg'],
                      description: newDish.description.trim() || undefined,
                      imageUrl: newDish.imageUrl.trim() || undefined,
                      minQuantity: newDish.minQuantity?.trim() || undefined,
                      unit: newDish.unit?.trim() || undefined,
                      prepTime: newDish.prepTime?.trim() || undefined,
                      isAvailable: true,
                    };
                    setMenuItems(prev => [...prev, dish]);
                    setNewDish({ name: '', category: 'Starter', pricePerPlate: '', dietaryTags: ['Veg'], description: '', imageUrl: '', minQuantity: '', unit: '', prepTime: '' });
                    setToastMessage('Dish added to menu!');
                  }}
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
          )}
        </Card>
      )}

      <Button
        title="Save Profile Changes"
        variant="primary"
        size="lg"
        loading={loading}
        icon={<Save size={18} color="#ffffff" />}
        onPress={handleSave}
        style={{ marginVertical: 30, backgroundColor: '#3fb668' }}
      />
      </ScrollView>
    </KeyboardAvoidingView>
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
  reelEditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  reelEditThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
});
