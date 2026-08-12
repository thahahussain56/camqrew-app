import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ProfessionalProfile } from '../../types/professional';
import { Star, UserCheck } from 'lucide-react-native';

interface ProCardProps {
  professional: ProfessionalProfile;
  onPressProfile: () => void;
  onPressBook: () => void;
}

export const ProCard: React.FC<ProCardProps> = ({ professional, onPressProfile, onPressBook }) => {
  const { colors } = useTheme();

  const specsText = professional.categories
    ? professional.categories.join(' | ')
    : '4K Cinema | Drone Operator | 2 Assistants';

  return (
    <View style={[styles.cardOuter, { backgroundColor: colors.surfaceCard }]}>
      <TouchableOpacity activeOpacity={0.92} onPress={onPressProfile}>
        {/* Top Image Banner */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: professional.bannerImage }} style={styles.image} />
        </View>

        {/* Bottom Floating White/Surface Details Box (Exact Layout as Screenshot) */}
        <View style={[styles.contentBox, { backgroundColor: colors.surfaceElevated }]}>
          {/* Header Info Row with Profile Picture */}
          <View style={styles.headerInfoRow}>
            <Image source={{ uri: professional.avatar }} style={[styles.avatarImage, { borderColor: colors.border }]} />
            <View style={styles.nameContainer}>
              {/* Green Star + Rating */}
              <View style={styles.ratingRow}>
                <Star size={14} color="#3fb668" fill="#3fb668" style={{ marginRight: 4 }} />
                <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                  {(professional.rating || 5.0).toFixed(1)}
                </Text>
              </View>

              {/* Pro Studio Name */}
              <Text style={[styles.proName, { color: colors.textPrimary }]} numberOfLines={1}>
                {professional.name}
              </Text>
            </View>
          </View>

          {/* Title / Category */}
          <Text style={[styles.categoryText, { color: colors.textFaint }]}>
            {professional.title || 'Creative Professional Studio'}
          </Text>

          {/* Included Services / Subtext */}
          <Text style={[styles.specsText, { color: colors.textSecondary }]} numberOfLines={1}>
            {specsText}
          </Text>

          {/* Action Buttons Row: View Profile  +  Book Now */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.profileBtn, { backgroundColor: colors.background }]}
              onPress={onPressProfile}
              activeOpacity={0.8}
            >
              <Text style={[styles.profileBtnText, { color: colors.textSecondary }]}>View</Text>
              <UserCheck size={15} color={colors.textSecondary} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.bookNowBtn} onPress={onPressBook} activeOpacity={0.85}>
              <Text style={styles.bookNowBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 28,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 0,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#0c0e12',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentBox: {
    padding: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    marginRight: 12,
    backgroundColor: '#0c0e12',
  },
  nameContainer: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
  },
  proName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  specsText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileBtn: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  bookNowBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#3fb668',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
