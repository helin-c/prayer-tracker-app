// @ts-nocheck
// ============================================================================
// FILE: src/screens/quran/QuranBookmarksScreen.jsx (OPTIMIZED WITH SELECTORS)
// ============================================================================
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

// ✅ IMPORT Store and Selectors
import { 
  useQuranStore, 
  selectBookmarks, 
  selectQuranIsLoading, 
  selectQuranIsInitialized 
} from '../../store/quranStore';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// COMPONENT IMPORTS
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

const BookmarksSkeleton = () => {
  const skeletonStyle = { backgroundColor: 'rgba(255, 255, 255, 0.5)' };

  return (
    <View style={{ padding: 20 }}>
      {/* List Items Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            padding: 16,
            marginBottom: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: 16,
          }}
        >
          {/* Header (Title + Delete Icon) */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View>
              <SkeletonLine
                width={120}
                height={18}
                style={{ ...skeletonStyle, marginBottom: 6 }}
              />
              <SkeletonLine width={60} height={14} style={skeletonStyle} />
            </View>
            <SkeletonCircle size={36} style={skeletonStyle} />
          </View>

          {/* Ayah Text Placeholder */}
          <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
            <SkeletonLine
              width="100%"
              height={16}
              style={{ ...skeletonStyle, marginBottom: 6 }}
            />
            <SkeletonLine
              width="80%"
              height={16}
              style={{ ...skeletonStyle, marginBottom: 6 }}
            />
            <SkeletonLine width="60%" height={16} style={skeletonStyle} />
          </View>

          {/* Footer (Date + Button) */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <SkeletonLine width={80} height={12} style={skeletonStyle} />
            <SkeletonLine width={100} height={14} style={skeletonStyle} />
          </View>
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================
export const QuranBookmarksScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // ✅ OPTIMIZED: Use selectors for state
  const bookmarks = useQuranStore(selectBookmarks);
  const isLoading = useQuranStore(selectQuranIsLoading);
  const isInitialized = useQuranStore(selectQuranIsInitialized);

  // Actions (stable functions)
  const removeBookmark = useQuranStore(state => state.removeBookmark);
  const getSurah = useQuranStore(state => state.getSurah);
  const getAyah = useQuranStore(state => state.getAyah);
  const initialize = useQuranStore(state => state.initialize);

  // Initialize store when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!isInitialized) {
        initialize();
      }
    }, [isInitialized])
  );

  const handleDeleteBookmark = (bookmarkId) => {
    Alert.alert(t('quran.deleteBookmark'), t('quran.deleteBookmarkConfirm'), [
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
    ]);
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
        <Ionicons name="bookmark-outline" size={64} color="#1A1A1A" />
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

  // Sort bookmarks by timestamp (newest first)
  const sortedBookmarks = bookmarks
    ? [...bookmarks].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )
    : [];

  return (
    // WRAPPED IN SCREEN LAYOUT
    <ScreenLayout noPaddingBottom={true}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('quran.bookmarks')} {bookmarks ? `(${bookmarks.length})` : ''}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        // SKELETON LOADING STATE
        <BookmarksSkeleton />
      ) : (
        /* Bookmarks List */
        <FlatList
          data={sortedBookmarks}
          renderItem={renderBookmark}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Removed container since ScreenLayout handles bg
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    color: '#1A1A1A',
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
    color: '#1A1A1A',
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
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});