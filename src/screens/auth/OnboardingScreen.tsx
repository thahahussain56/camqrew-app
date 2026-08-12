import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Camera, Film, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: "Book India's Best Creative Professionals",
    subtitle: 'Photographers, videographers, designers & more — on demand.',
    icon: Camera,
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=600',
  },
  {
    id: '2',
    title: 'Cinema-Grade Gear. By the Day or Forever.',
    subtitle: '500+ professional gear items available for rent or purchase.',
    icon: Film,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600',
  },
  {
    id: '3',
    title: 'Join as a Professional. Grow Your Studio.',
    subtitle: 'Showcase your work, set your rates, and get booked nationwide.',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600',
  },
];

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('SignIn');
    }
  };

  const slide = SLIDES[currentSlide];
  const IconComponent = slide.icon;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('SignIn')}>
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: slide.image }} style={styles.image} />
          <View style={[styles.iconBadge, { backgroundColor: colors.accent }]}>
            <IconComponent size={28} color="#000000" />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{slide.subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.paginationRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentSlide ? colors.accent : colors.chipBg,
                  width: idx === currentSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          variant="primary"
          size="lg"
          onPress={handleNext}
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  skipButton: {
    alignSelf: 'flex-end',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  imageContainer: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 30,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    padding: 12,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    marginTop: 'auto',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
