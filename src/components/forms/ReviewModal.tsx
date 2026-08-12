import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { Star, X } from 'lucide-react-native';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  targetName: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  onSubmit,
  targetName,
}) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!comment.trim()) {
      Alert.alert('Required', 'Please enter your review feedback.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit(rating, comment);
      onClose();
      setComment('');
    }, 600);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Review {targetName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Star Rating Bar */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Overall Experience Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(starNum => (
              <TouchableOpacity key={starNum} onPress={() => setRating(starNum)} style={{ padding: 4 }}>
                <Star
                  size={32}
                  color="#f59e0b"
                  fill={starNum <= rating ? '#f59e0b' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Review Input */}
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Your Feedback & Review</Text>
          <TextInput
            placeholder="Share details about the quality, communication, and deliverables..."
            placeholderTextColor={colors.textFaint}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
          />

          <Button
            title="Submit Rating & Review ⭐"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit}
            style={{ backgroundColor: '#fc8019', marginTop: 16 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  input: {
    height: 90,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
});
