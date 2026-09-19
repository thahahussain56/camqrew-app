import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Booking } from '../../types/booking';
import { vaultApi } from '../../api/vaultApi';
import { VaultFolder, VaultFile } from '../../types/vault';
import { 
  X, 
  Check, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  UploadCloud, 
  Download,
  AlertCircle
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 2;

interface PhotoProofingModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  currentUserId?: string;
  onMilestoneReleased?: () => void;
}

export const PhotoProofingModal: React.FC<PhotoProofingModalProps> = ({
  visible,
  booking,
  onClose,
  currentUserId,
  onMilestoneReleased,
}) => {
  const { colors } = useTheme();
  const [folder, setFolder] = useState<VaultFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'selected'>('all');
  
  // Active photo inspector
  const [selectedPhoto, setSelectedPhoto] = useState<VaultFile | null>(null);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Approval state
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (visible && booking?.id) {
      loadGallery();
    }
  }, [visible, booking?.id]);

  const loadGallery = async () => {
    if (!booking?.id) return;
    setLoading(true);
    try {
      const data = await vaultApi.getGalleryForBooking(booking.id);
      setFolder(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load photo vault.');
    } finally {
      setLoading(false);
    }
  };

  const files = folder?.files || [];
  const selectedFiles = useMemo(() => files.filter(f => f.isSelected), [files]);
  const displayedFiles = filter === 'selected' ? selectedFiles : files;

  const handleToggleStar = async (file: VaultFile) => {
    if (folder?.status === 'approved') return;
    const nextVal = !file.isSelected;

    setFolder(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        files: prev.files.map(f => f.id === file.id ? { ...f, isSelected: nextVal } : f),
      };
    });

    if (selectedPhoto?.id === file.id) {
      setSelectedPhoto(prev => prev ? { ...prev, isSelected: nextVal } : null);
    }

    try {
      await vaultApi.togglePhotoSelection(file.id, nextVal);
    } catch {
      // Revert on error
      setFolder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.map(f => f.id === file.id ? { ...f, isSelected: !nextVal } : f),
        };
      });
    }
  };

  const handleSaveComment = async () => {
    if (!selectedPhoto) return;
    setSavingComment(true);
    try {
      await vaultApi.updatePhotoComment(selectedPhoto.id, commentText);
      setFolder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.map(f => f.id === selectedPhoto.id ? { ...f, clientComment: commentText } : f),
        };
      });
      setSelectedPhoto(prev => prev ? { ...prev, clientComment: commentText } : null);
      Alert.alert('Saved', 'Photo notes updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save notes.');
    } finally {
      setSavingComment(false);
    }
  };

  const handleApprove = () => {
    if (!folder || !booking) return;

    Alert.alert(
      'Approve Album Selection',
      `You have selected ${selectedFiles.length} photos. Approving will lock your selection and automatically release the final 30% deliverables escrow payment to ${booking.professionalName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Release Escrow',
          style: 'default',
          onPress: async () => {
            setApproving(true);
            try {
              await vaultApi.approveAlbumSelection(folder.id, booking.id);
              Alert.alert('Success 🎉', 'Album selection approved! 30% final milestone has been released.');
              await loadGallery();
              if (onMilestoneReleased) onMilestoneReleased();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to approve selection.');
            } finally {
              setApproving(false);
            }
          },
        },
      ]
    );
  };

  const handleAddSamplePhotos = async () => {
    if (!folder) return;
    setLoading(true);
    try {
      const samples = [
        { name: 'Ceremony_Candid_01.jpg', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600' },
        { name: 'Bridal_Portrait_02.jpg', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600' },
        { name: 'Mandap_Rituals_03.jpg', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600' },
        { name: 'Couple_GoldenHour_04.jpg', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=600' },
      ];

      for (const s of samples) {
        await vaultApi.uploadProofPhoto(folder.id, currentUserId || 'creator', {
          fileName: s.name,
          fileUrl: s.url,
        });
      }

      await loadGallery();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load samples.');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Camqrew Vault</Text>
                {folder?.status === 'approved' ? (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(63, 182, 104, 0.15)', borderColor: colors.accent }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.accent }]}>APPROVED ✓</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#f59e0b' }]}>IN SELECTION</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {booking.serviceTitle} • {booking.professionalName}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Subheader & Counter */}
          <View style={[styles.counterBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.borderLight }]}>
            <View style={styles.counterBadge}>
              <Star size={14} color="#eab308" fill="#eab308" />
              <Text style={[styles.counterText, { color: colors.textPrimary }]}>
                Selected: <Text style={{ color: colors.accent, fontWeight: '800' }}>{selectedFiles.length}</Text> / {folder?.maxSelections || 100}
              </Text>
            </View>

            {/* Filter Pills */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity 
                onPress={() => setFilter('all')}
                style={[styles.filterPill, filter === 'all' && { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.filterPillText, { color: filter === 'all' ? '#000' : colors.textSecondary }]}>
                  All ({files.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setFilter('selected')}
                style={[styles.filterPill, filter === 'selected' && { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.filterPillText, { color: filter === 'selected' ? '#000' : colors.textSecondary }]}>
                  ⭐ ({selectedFiles.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Body Gallery Grid */}
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading proofs...</Text>
              </View>
            ) : files.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
                <UploadCloud size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Proof Photos Uploaded</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Photos uploaded by your creator will appear here with watermarks for album selection.
                </Text>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                  onPress={handleAddSamplePhotos}
                >
                  <Text style={styles.actionBtnText}>+ Load Demo Photos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {displayedFiles.map((file) => (
                  <TouchableOpacity 
                    key={file.id} 
                    style={[
                      styles.photoCard, 
                      { borderColor: file.isSelected ? colors.accent : colors.borderLight },
                      file.isSelected && styles.photoCardSelected
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedPhoto(file);
                      setCommentText(file.clientComment || '');
                    }}
                  >
                    <Image source={{ uri: file.fileUrl }} style={styles.photoImg} />
                    
                    {/* Watermark */}
                    <View style={styles.watermarkWrap}>
                      <Text style={styles.watermarkText}>CAMQREW PROOF</Text>
                    </View>

                    {/* Star Button */}
                    <TouchableOpacity 
                      style={[styles.starBtn, { backgroundColor: file.isSelected ? '#eab308' : 'rgba(0,0,0,0.65)' }]}
                      onPress={() => handleToggleStar(file)}
                    >
                      <Star 
                        size={14} 
                        color={file.isSelected ? '#000000' : '#ffffff'} 
                        fill={file.isSelected ? '#000000' : 'none'} 
                      />
                    </TouchableOpacity>

                    {/* Feedback pill */}
                    {file.clientComment ? (
                      <View style={styles.feedbackPill}>
                        <MessageSquare size={10} color="#38bdf8" />
                        <Text style={styles.feedbackPillText}>Note</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Sheet */}
          {folder?.status !== 'approved' && (
            <View style={[styles.bottomBar, { backgroundColor: colors.surfaceCard, borderTopColor: colors.borderLight }]}>
              <TouchableOpacity 
                style={[styles.approveBtn, { backgroundColor: colors.accent }]}
                onPress={handleApprove}
                disabled={approving || selectedFiles.length === 0}
              >
                {approving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Check size={18} color="#000" style={{ marginRight: 8 }} />
                    <Text style={styles.approveBtnText}>
                      Approve Album Selection ({selectedFiles.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
                Releases final 30% milestone payment to creator
              </Text>
            </View>
          )}

          {/* Photo Inspector Modal */}
          {selectedPhoto && (
            <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
              <View style={styles.lightboxOverlay}>
                <View style={[styles.lightboxCard, { backgroundColor: colors.surfaceCard }]}>
                  <View style={styles.lightboxHeader}>
                    <Text style={[styles.lightboxTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {selectedPhoto.fileName}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                      <X size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.lightboxImgWrap}>
                    <Image source={{ uri: selectedPhoto.fileUrl }} style={styles.lightboxImg} resizeMode="contain" />
                    <View style={styles.watermarkWrap}>
                      <Text style={[styles.watermarkText, { fontSize: 16 }]}>CAMQREW PROOF</Text>
                    </View>
                  </View>

                  <View style={styles.lightboxFooter}>
                    <TouchableOpacity 
                      style={[styles.starToggleBtn, { backgroundColor: selectedPhoto.isSelected ? '#eab308' : colors.surfaceElevated }]}
                      onPress={() => handleToggleStar(selectedPhoto)}
                    >
                      <Star size={16} color={selectedPhoto.isSelected ? '#000' : colors.textPrimary} fill={selectedPhoto.isSelected ? '#000' : 'none'} />
                      <Text style={[styles.starToggleText, { color: selectedPhoto.isSelected ? '#000' : colors.textPrimary }]}>
                        {selectedPhoto.isSelected ? 'Selected for Album' : 'Select for Album'}
                      </Text>
                    </TouchableOpacity>

                    <TextInput 
                      style={[styles.commentInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.borderLight }]}
                      placeholder="Retouch notes or album page placement..."
                      placeholderTextColor={colors.textSecondary}
                      value={commentText}
                      onChangeText={setCommentText}
                    />

                    <TouchableOpacity 
                      style={[styles.saveNoteBtn, { backgroundColor: colors.accent }]}
                      onPress={handleSaveComment}
                      disabled={savingComment}
                    >
                      {savingComment ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.saveNoteBtnText}>Save Note</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  counterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 18,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  photoCardSelected: {
    borderWidth: 2,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  watermarkWrap: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    transform: [{ rotate: '-30deg' }],
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  starBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedbackPillText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  approveBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  lightboxCard: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  lightboxTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  lightboxImgWrap: {
    height: 280,
    backgroundColor: '#000',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImg: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    padding: 16,
    gap: 12,
  },
  starToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  starToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  saveNoteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveNoteBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
});
