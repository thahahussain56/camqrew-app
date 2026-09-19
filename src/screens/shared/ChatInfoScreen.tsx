import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, FlatList, Image as RNImage, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../../components/ui/Avatar';
import { ChevronLeft, Flag, Ban, Search, X } from 'lucide-react-native';
import { chatApi, ChatMessage } from '../../api/chatApi';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 40 - 16) / 3; // 3 columns with padding/gap

export const ChatInfoScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  
  const otherUserId = route?.params?.otherUserId;
  const otherUserName = route?.params?.otherUserName || 'User';
  const otherUserAvatar = route?.params?.otherUserAvatar || '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sharedImages, setSharedImages] = useState<string[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      const msgs = await chatApi.getMessages(otherUserId);
      setMessages(msgs);

      // Extract images
      const images: string[] = [];
      msgs.forEach(m => {
        const imageMatch = m.text.match(/\[IMAGE\](.*?)\[\/IMAGE\]/);
        if (imageMatch && imageMatch[1]) {
          images.push(imageMatch[1]);
        }
      });
      // Reverse to show newest first
      setSharedImages(images.reverse());
    };
    
    if (otherUserId) {
      fetchHistory();
    }
  }, [otherUserId]);

  const handleBlock = () => {
    Alert.alert('Block User', `Are you sure you want to block ${otherUserName}? They will no longer be able to message you or see your profile.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => {
        Alert.alert('Blocked', `${otherUserName} has been blocked.`);
        navigation.goBack();
      } }
    ]);
  };

  const handleReport = () => {
    Alert.alert('Report User', `Report ${otherUserName} to the Camqrew moderation team for inappropriate behavior?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => {
        Alert.alert('Report Submitted', `Thank you for keeping Camqrew safe. We will review ${otherUserName}'s account.`);
      } }
    ]);
  };

  const handleSearch = () => {
    setIsSearching(true);
  };

  const filteredMessages = messages.filter(m => 
    !m.text.includes('[IMAGE]') && 
    !m.text.includes('[LOCATION]') && 
    m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight, backgroundColor: colors.surfaceCard }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={32} color={colors.textPrimary} />
        </TouchableOpacity>
        
        {isSearching ? (
          <View style={styles.searchHeaderWrapper}>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: colors.background }]}
              placeholder="Search chat..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Chat Info</Text>
        )}
      </View>

      {isSearching ? (
        <View style={styles.searchResultsContainer}>
          <FlatList
            data={filteredMessages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.searchResultItem, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.searchResultHeader}>
                  <Text style={[styles.searchResultName, { color: colors.textPrimary }]}>{item.senderName}</Text>
                  <Text style={[styles.searchResultTime, { color: colors.textSecondary }]}>{item.timestamp}</Text>
                </View>
                <Text style={[styles.searchResultText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.text}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>
                {searchQuery ? 'No messages found.' : 'Type to search...'}
              </Text>
            }
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileSection}>
            <Avatar source={otherUserAvatar} size={100} />
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{otherUserName}</Text>
            <TouchableOpacity 
              style={[styles.viewProfileBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => navigation.navigate('PublicProfile', { id: otherUserId })}
            >
              <Text style={[styles.viewProfileText, { color: colors.textPrimary }]}>View Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionGroup}>
            <TouchableOpacity style={styles.actionBtnRow} onPress={handleSearch}>
              <View style={styles.iconWrapper}>
                <Search size={22} color={colors.textPrimary} />
              </View>
              <Text style={[styles.actionTextRow, { color: colors.textPrimary }]}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnRow} onPress={handleReport}>
              <View style={styles.iconWrapper}>
                <Flag size={22} color={colors.warning} />
              </View>
              <Text style={[styles.actionTextRow, { color: colors.warning }]}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnRow} onPress={handleBlock}>
              <View style={styles.iconWrapper}>
                <Ban size={22} color={colors.danger} />
              </View>
              <Text style={[styles.actionTextRow, { color: colors.danger }]}>Block</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mediaSection}>
            <Text style={[styles.mediaSectionTitle, { color: colors.textPrimary }]}>Shared Media</Text>
            {sharedImages.length > 0 ? (
              <View style={styles.imageGrid}>
                {sharedImages.map((uri, index) => (
                  <RNImage
                    key={index}
                    source={{ uri }}
                    style={[styles.gridImage, { width: GRID_SIZE, height: GRID_SIZE, backgroundColor: colors.borderLight }]}
                  />
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No media shared yet.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  
  searchHeaderWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    fontSize: 16,
  },

  searchResultsContainer: {
    flex: 1,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  searchResultName: {
    fontWeight: '700',
    fontSize: 14,
  },
  searchResultTime: {
    fontSize: 12,
  },
  searchResultText: {
    fontSize: 15,
    lineHeight: 20,
  },

  content: { padding: 20 },
  
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
  },
  viewProfileBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewProfileText: {
    fontWeight: '600',
    fontSize: 15,
  },

  actionGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 32,
  },
  actionBtnRow: {
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionTextRow: {
    fontSize: 13,
    fontWeight: '600',
  },

  mediaSection: {
    marginTop: 10,
  },
  mediaSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridImage: {
    borderRadius: 8,
  },
});
