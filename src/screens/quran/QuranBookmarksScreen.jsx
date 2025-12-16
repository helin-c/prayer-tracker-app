// ============================================================================
// FILE: src/screens/quran/QuranBookmarksScreen.jsx
// ============================================================================
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuranStore } from '../../store/quranStore';
import { useFocusEffect } from '@react-navigation/native';

export const QuranBookmarksScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { 
    bookmarks, 
    removeBookmark, 
    getSurah, 
    getAyah, 
    initialize,
    isLoading,
    isInitialized 
  } = useQuranStore();

  // Initialize store when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!isInitialized) {
        initialize();
      }
    }, [isInitialized])
  );

  const handleDeleteBookmark = (bookmarkId) => {
    Alert.alert(
      t('quran.deleteBookmark'),
      t('quran.deleteBookmarkConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const result = await removeBookmark(bookmarkId);
            if (!result.success) {
              Alert.alert(t('common.error'), t('quran.deleteBookmarkError'));
            }
          },
        },
      ]
    );
  };

  const handleGoToAyah = (bookmark) => {
    navigation.navigate('QuranReader', {
      surahNumber: bookmark.surahNumber,
      ayahNumber: bookmark.ayahNumber,
    });
  };

  const renderBookmark = ({ item: bookmark }) => {
    const surah = getSurah(bookmark.surahNumber);
    const ayah = getAyah(bookmark.surahNumber, bookmark.ayahNumber);

    if (!surah || !ayah) {
      console.warn('Missing surah or ayah for bookmark:', bookmark);
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.bookmarkCard}
        onPress={() => handleGoToAyah(bookmark)}
        activeOpacity={0.7}
      >
        <View style={styles.bookmarkHeader}>
          <View style={styles.bookmarkInfo}>
            <Text style={styles.surahName}>{surah.name_en}</Text>
            <Text style={styles.ayahNumber}>
              {t('quran.ayah')} {bookmark.ayahNumber}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteBookmark(bookmark.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#DC3545" />
          </TouchableOpacity>
        </View>

        <Text style={styles.ayahText} numberOfLines={3}>
          {ayah.text_ar}
        </Text>

        {bookmark.note && bookmark.note.trim() && (
          <View style={styles.noteContainer}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.noteText} numberOfLines={2}>
              {bookmark.note}
            </Text>
          </View>
        )}

        <View style={styles.bookmarkFooter}>
          <Text style={styles.timestamp}>
            {new Date(bookmark.timestamp).toLocaleDateString()}
          </Text>
          <View style={styles.goToButton}>
            <Text style={styles.goToText}>{t('quran.goToSurah')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#00A86B" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bookmark-outline" size={64} color="#CCC" />
      </View>
      <Text style={styles.emptyTitle}>{t('quran.noBookmarks')}</Text>
      <Text style={styles.emptyText}>{t('quran.noBookmarksDescription')}</Text>
      <TouchableOpacity 
        style={styles.startReadingButton}
        onPress={() => navigation.navigate('QuranSurahList')}
      >
        <Text style={styles.startReadingText}>{t('quran.startReading')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('quran.bookmarks')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Sort bookmarks by timestamp (newest first)
  const sortedBookmarks = [...bookmarks].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('quran.bookmarks')} ({bookmarks.length})
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bookmarks List */}
      <FlatList
        data={sortedBookmarks}
        renderItem={renderBookmark}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  bookmarkCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookmarkInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ayahNumber: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahText: {
    fontSize: 18,
    lineHeight: 32,
    color: '#2C2C2C',
    textAlign: 'right',
    marginBottom: 12,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bookmarkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  goToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goToText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A86B',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  startReadingButton: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startReadingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});