import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { professionalApi } from '../../api/professionalApi';
import { ProfessionalProfile } from '../../types/professional';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { RatingStars } from '../../components/forms/RatingStars';
import { Star, MapPin, Briefcase, Award, Calendar as CalendarIcon, X, ArrowLeft, ShieldCheck, Zap, Edit3, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const PublicProfileScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const proId = route?.params?.id;

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);

  useEffect(() => {
    if (proId) {
      professionalApi.getProfileById(proId).then(setProfile);
    } else {
      professionalApi.getProfessionals().then(list => {
        if (list && list.length > 0) setProfile(list[0]);
      });
    }
  }, [proId]);

  if (!profile) return null;

  const safeServices = profile.services && profile.services.length > 0 ? profile.services : [
    {
      id: 'srv_default',
      title: 'Full Day Shoot Package',
      category: profile.categories[0] || 'Photography',
      rate: profile.ratePerDay || 15000,
      unit: 'per day',
      description: 'Includes full day studio photography/videography coverage with high resolution deliverables.',
    }
  ];

  const safePortfolio = profile.portfolio && profile.portfolio.length > 0 ? profile.portfolio : [
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800',
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner & Avatar */}
        <View style={styles.headerBanner}>
          <Image source={{ uri: profile.bannerImage }} style={styles.banner} />
          <View style={styles.bannerOverlay} />

          {/* Top Floating Header Controls */}
          <View style={styles.topControlRow}>
            <TouchableOpacity style={styles.roundBackBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editProfileTopBtn}
              onPress={() => navigation.navigate('ProfessionalEdit')}
              activeOpacity={0.85}
            >
              <Edit3 size={15} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.editTopBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrapper}>
            <Avatar source={profile.avatar} size={88} verified={profile.verified} />
          </View>
        </View>

        {/* Main Info */}
        <View style={styles.profileMeta}>
          <View style={styles.verifiedTagRow}>
            <ShieldCheck size={14} color="#fc8019" />
            <Text style={styles.verifiedTagText}>VERIFIED CREATIVE STUDIO</Text>
          </View>

          <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.name}</Text>
          <Text style={[styles.title, { color: colors.textSecondary }]}>{profile.title}</Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color="#fc8019" style={{ marginRight: 4 }} />
            <Text style={[styles.locationText, { color: colors.textFaint }]}>
              {profile.city}, {profile.state} • {profile.experienceYears} Years Exp
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingPill}>
              <Star size={12} color="#ffffff" fill="#ffffff" style={{ marginRight: 3 }} />
              <Text style={styles.ratingVal}>{(profile.rating ?? 4.9).toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({profile.reviewCount ?? 18})</Text>
            </View>
            <Text style={[styles.categoriesText, { color: colors.textSecondary }]}>
              {(profile.categories || []).join(' • ')}
            </Text>
          </View>

          {/* CTA Bar */}
          <View style={styles.ctaRow}>
            <Button
              title="Message 💬"
              variant="secondary"
              size="lg"
              onPress={() => navigation.navigate('Chat', { creatorId: profile.id, creatorName: profile.name, isPaidUnlocked: false })}
              style={{ flex: 1, marginRight: 8 }}
            />

            <Button
              title={`Book Now • ₹${(profile.ratePerDay || 15000).toLocaleString('en-IN')}`}
              variant="primary"
              size="lg"
              icon={<Zap size={16} color="#ffffff" style={{ marginRight: 4 }} />}
              onPress={() => navigation.navigate('Booking', { proId: profile.id })}
              style={{ flex: 1.6, backgroundColor: '#fc8019' }}
            />
          </View>
        </View>

        {/* About / Bio */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About the Creator</Text>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>{profile.bio}</Text>
        </Card>

        {/* Services Offered */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Services & Packages</Text>
          {safeServices.map(srv => (
            <View key={srv.id} style={[styles.serviceBox, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.serviceHeader}>
                <Text style={[styles.serviceTitle, { color: colors.textPrimary }]}>{srv.title}</Text>
                <Text style={[styles.serviceRate, { color: '#fc8019' }]}>
                  ₹{(srv.rate || 15000).toLocaleString('en-IN')} <Text style={{ fontSize: 11, color: colors.textFaint }}>/{srv.unit}</Text>
                </Text>
              </View>
              {srv.description ? (
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>{srv.description}</Text>
              ) : null}
            </View>
          ))}
        </Card>

        {/* Portfolio Media Gallery */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Portfolio Gallery</Text>
          <View style={styles.portfolioGrid}>
            {safePortfolio.map((img, idx) => (
              <TouchableOpacity key={idx} activeOpacity={0.88} onPress={() => setSelectedImgIndex(idx)} style={styles.portfolioItem}>
                <Image source={{ uri: img }} style={styles.portfolioImage} />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Equipment Roster */}
        {profile.equipment && profile.equipment.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Equipment Roster</Text>
            <View style={styles.chipsWrap}>
              {profile.equipment.map((eq, i) => (
                <Badge key={i} label={eq} variant="info" />
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Lightbox Modal */}
      <Modal visible={selectedImgIndex !== null} transparent animationType="fade" onRequestClose={() => setSelectedImgIndex(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImgIndex(null)}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          {selectedImgIndex !== null && (
            <View style={styles.lightboxContainer}>
              <Text style={styles.lightboxCounter}>
                {selectedImgIndex + 1} of {safePortfolio.length}
              </Text>
              
              <Image source={{ uri: safePortfolio[selectedImgIndex] }} style={styles.fullImage} resizeMode="contain" />

              {/* Navigation Chevrons */}
              <View style={styles.slideshowControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.navArrow}
                  onPress={() => setSelectedImgIndex(prev => (prev !== null ? (prev > 0 ? prev - 1 : safePortfolio.length - 1) : null))}
                >
                  <ChevronLeft size={36} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.navArrow}
                  onPress={() => setSelectedImgIndex(prev => (prev !== null ? (prev < safePortfolio.length - 1 ? prev + 1 : 0) : null))}
                >
                  <ChevronRight size={36} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.lightboxTitle}>{profile.name} — Portfolio Work</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 50,
  },
  headerBanner: {
    height: 200,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topControlRow: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  roundBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editTopBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -36,
    left: 20,
  },
  profileMeta: {
    padding: 20,
    paddingTop: 46,
  },
  verifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fc8019',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  reviewCount: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    marginLeft: 3,
  },
  categoriesText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ctaRow: {
    marginTop: 18,
    flexDirection: 'row',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 0,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  serviceBox: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  serviceRate: {
    fontSize: 15,
    fontWeight: '900',
  },
  serviceDesc: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portfolioItem: {
    width: (width - 72) / 2,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
    padding: 8,
  },
  lightboxContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lightboxCounter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '800',
    position: 'absolute',
    top: 58,
    alignSelf: 'center',
  },
  fullImage: {
    width: '90%',
    height: '65%',
  },
  slideshowControls: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    zIndex: 15,
  },
  navArrow: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  lightboxTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    position: 'absolute',
    bottom: 40,
    textAlign: 'center',
  },
});
