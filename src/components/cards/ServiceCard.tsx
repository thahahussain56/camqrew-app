import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ServiceItem } from '../../types/professional';
import { getServiceImage } from '../../utils/serviceUtils';
import { Star, Eye, ShoppingBag } from 'lucide-react-native';

interface ServiceCardProps {
  service: ServiceItem;
  creatorName?: string;
  creatorRating?: number;
  creatorBanner?: string;
  onPressView: () => void;
  onPressBook: () => void;
  style?: any;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  creatorName,
  creatorRating = 5.0,
  creatorBanner,
  onPressView,
  onPressBook,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const isPackage = service.type === 'package';
  const imageUrl = getServiceImage(service, creatorBanner);

  // Format unit
  const cleanUnit = (service.unit || 'event')
    .toLowerCase()
    .replace(/^per\s+/i, '')
    .trim();

  return (
    <View style={[styles.cardOuter, { backgroundColor: colors.surfaceCard, borderColor: colors.border }, style]}>
      {/* ── Top Image Banner ── */}
      <TouchableOpacity activeOpacity={0.92} onPress={onPressView} style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />

        {/* Floating Badges */}
        <View style={styles.topBadgesRow}>
          {/* Service / Package Badge */}
          <View style={styles.serviceTypeBadge}>
            <Text style={styles.serviceTypeBadgeText}>
              {isPackage ? 'PACKAGE' : 'SERVICE'}
            </Text>
          </View>

          {/* Category Tag Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {service.category || 'Production'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Content Section ── */}
      <View style={styles.contentBox}>
        {/* Creator & Status Row */}
        <View style={styles.metaRow}>
          {/* Creator Pill */}
          <View style={[styles.creatorPill, { backgroundColor: isDark ? 'rgba(63, 182, 104, 0.16)' : 'rgba(16, 185, 129, 0.12)' }]}>
            <Text style={[styles.creatorPillText, { color: colors.accent }]} numberOfLines={1}>
              {(creatorName || 'VERIFIED CREATOR').toUpperCase()}
            </Text>
          </View>

          {/* Dot */}
          <Text style={[styles.dotSeparator, { color: colors.textFaint }]}>•</Text>

          {/* Rating & Escrow Indicator */}
          <View style={styles.ratingBox}>
            <Star size={11} color={colors.accent} fill={colors.accent} style={{ marginRight: 3 }} />
            <Text style={[styles.ratingVal, { color: colors.textPrimary }]}>
              {creatorRating.toFixed(1)}
            </Text>
            <Text style={[styles.escrowNote, { color: colors.textSecondary }]}> (Escrow)</Text>
          </View>

          {/* Dot */}
          <Text style={[styles.dotSeparator, { color: colors.textFaint }]}>•</Text>

          {/* Availability */}
          <Text style={[styles.availabilityText, { color: colors.accent }]}>
            Available
          </Text>
        </View>

        {/* Service Title */}
        <TouchableOpacity activeOpacity={0.88} onPress={onPressView}>
          <Text style={[styles.serviceTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {service.title}
          </Text>
        </TouchableOpacity>

        {/* Subtitle / Package Tag */}
        <Text style={[styles.serviceSubtitle, { color: colors.textSecondary }]}>
          {service.category || 'Creative'} Package • 100% Escrow
        </Text>

        {/* Description Snippet */}
        {service.description ? (
          <Text style={[styles.descriptionSnippet, { color: colors.textSecondary }]} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}

        {/* Starting From Price Line */}
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
            Starting from{' '}
          </Text>
          <Text style={[styles.priceValue, { color: colors.accent }]}>
            ₹{(service.rate || 15000).toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.priceUnit, { color: colors.textFaint }]}>
            {' '}/{cleanUnit}
          </Text>
        </View>

        {/* Action Buttons Row: View + Book */}
        <View style={styles.actionsRow}>
          {/* View Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.viewBtn,
              { 
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
              }
            ]}
            onPress={onPressView}
          >
            <Text style={[styles.viewBtnText, { color: colors.textPrimary }]}>View</Text>
            <Eye size={15} color={colors.textPrimary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Book Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bookBtn, { backgroundColor: colors.accent }]}
            onPress={onPressBook}
          >
            <ShoppingBag size={15} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 185,
    backgroundColor: '#0a0d12',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBadgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  serviceTypeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  serviceTypeBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    maxWidth: '55%',
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  contentBox: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  creatorPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    maxWidth: '48%',
  },
  creatorPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dotSeparator: {
    fontSize: 10,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingVal: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  escrowNote: {
    fontSize: 11,
    fontWeight: '500',
  },
  availabilityText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  serviceTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    marginTop: 8,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  serviceSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  descriptionSnippet: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 14,
  },
  priceLabel: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  bookBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3fb668',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
