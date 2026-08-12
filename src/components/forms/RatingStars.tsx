import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 16,
  interactive = false,
  onRatingChange,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starNumber = index + 1;
        const filled = starNumber <= Math.round(rating);

        return (
          <TouchableOpacity
            key={index}
            disabled={!interactive}
            onPress={() => interactive && onRatingChange && onRatingChange(starNumber)}
            style={{ marginRight: 2 }}
          >
            <Star
              size={size}
              color={filled ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
              fill={filled ? '#f59e0b' : 'transparent'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
