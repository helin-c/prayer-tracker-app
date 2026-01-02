// @ts-nocheck
// ============================================================================
// FILE: src/screens/quran/QuranSurahListScreen.jsx (OPTIMIZED WITH SELECTORS)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

// ✅ IMPORT Store and Selectors
import { 
  useQuranStore, 
  selectQuranData, 
  selectLastRead, 
  selectBookmarks, 
  selectQuranIsInitialized, 
  selectQuranIsLoading 
} from '../../store/quranStore';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// COMPONENT IMPORTS
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

const QuranListSkeleton = () => {
  const skeletonStyle = { backgroundColor: 'rgba(255, 255, 255, 0.5)' };

  return (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Search Bar Skeleton */}
      <SkeletonLoader
        width="100%"
        height={50}
        borderRadius={12}
        style={{ ...skeletonStyle, marginVertical: 16 }}
      />

      {/* Continue Reading Card Skeleton */}
      <SkeletonLoader
        width="100%"
        height={88}
        borderRadius={16}
        style={{ ...skeletonStyle, marginBottom: 16 }}
      />

      {/* List Items Skeleton */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            marginBottom: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: 12,
          }}
        >
          {/* Surah Number Circle */}
          <SkeletonCircle
            size={44}
            style={{
              marginRight: 16,
              backgroundColor: 'rgba(255,255,255,0.6)',
            }}
          />

          {/* Text Info */}
          <View style={{ flex: 1 }}>
            <SkeletonLine
              width={120}
              height={16}
              style={{
                marginBottom: 8,
                backgroundColor: 'rgba(255,255,255,0.6)',
              }}
            />
            <SkeletonLine
              width={80}
              height={12}
              style={{
                marginBottom: 6,
                backgroundColor: 'rgba(255,255,255,0.6)',
              }}
            />
            <SkeletonLine
              width={60}
              height={10}
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
            />
          </View>

          {/* Arabic Name Placeholder */}
          <SkeletonLine
            width={80}
            height={24}
            style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
          />
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================
export const QuranSurahListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // ✅ OPTIMIZED: Use selectors for state
  const quranData = useQuranStore(selectQuranData);
  const lastRead = useQuranStore(selectLastRead);
  const bookmarks = useQuranStore(selectBookmarks);
  const isInitialized = useQuranStore(selectQuranIsInitialized);
  const isLoading = useQuranStore(selectQuranIsLoading);
  
  // Actions
  const initialize = useQuranStore(state => state.initialize);

  const [searchQuery, setSearchQuery] = useState('');

  // Initialize store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, []);

  // Refresh data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!isInitialized) {
        initialize();
      }
    }, [isInitialized])
  );

  const filteredSurahs = quranData?.surahs
    ? quranData.surahs.filter(
        (surah) =>
          surah.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          surah.name_ar.includes(searchQuery) ||
          surah.number.toString().includes(searchQuery)
      )
    : [];

  const renderSurah = ({ item: surah }) => {
    const isLastRead = lastRead?.surahNumber === surah.number;

    return (
      <TouchableOpacity
        style={[styles.surahCard, isLastRead && styles.lastReadCard]}
        onPress={() =>
          navigation.navigate('QuranReader', { surahNumber: surah.number })
        }
        activeOpacity={0.7}
      >
        <View style={styles.surahNumber}>
          <Text style={styles.surahNumberText}>{surah.number}</Text>
        </View>

        <View style={styles.surahInfo}>
          <View style={styles.surahTitleRow}>
            <Text style={styles.surahNameEn}>{surah.name_en}</Text>
            {isLastRead && (
              <View style={styles.lastReadBadge}>
                <Ionicons name="bookmark" size={12} color="#FFF" />
                <Text style={styles.lastReadText}>{t('quran.lastRead')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.surahTranslation}>
            {surah.name_en_translation}
          </Text>
          <View style={styles.surahMeta}>
            <Text style={styles.surahMetaText}>
              {surah.revelation_type} • {surah.ayahs.length} {t('quran.ayahs')}
            </Text>
          </View>
        </View>

        <Text style={styles.surahNameAr}>{surah.name_ar}</Text>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>{t('quran.quran')}</Text>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => navigation.navigate('QuranBookmarks')}
        >
          <View>
            <Ionicons name="bookmark-outline" size={24} color="#1A1A1A" />
            {bookmarks.length > 0 && (
              <View style={styles.bookmarkCountBadge}>
                <Text style={styles.bookmarkCountText}>{bookmarks.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        // SKELETON LOADING STATE
        <QuranListSkeleton />
      ) : (
        <>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#1A1A1A"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t('quran.searchSurah')}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Continue Reading */}
          {lastRead && !searchQuery && (
            <TouchableOpacity
              style={styles.continueCard}
              onPress={() =>
                navigation.navigate('QuranReader', {
                  surahNumber: lastRead.surahNumber,
                  ayahNumber: lastRead.ayahNumber,
                })
              }
            >
              <View style={styles.continueIcon}>
                <Ionicons name="play-circle" size={32} color="#00A86B" />
              </View>
              <View style={styles.continueInfo}>
                <Text style={styles.continueTitle}>
                  {t('quran.continueReading')}
                </Text>
                <Text style={styles.continueText}>
                  {
                    quranData?.surahs?.find(
                      (s) => s.number === lastRead.surahNumber
                    )?.name_en
                  }{' '}
                  - {t('quran.ayah')} {lastRead.ayahNumber}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          )}

          {/* Surah List */}
          <FlatList
            data={filteredSurahs}
            renderItem={renderSurah}
            keyExtractor={(item) => item.number.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </>
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
  bookmarkButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bookmarkCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4F4E6',
  },
  continueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  continueInfo: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00A86B',
    marginBottom: 4,
  },
  continueText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  lastReadCard: {
    backgroundColor: '#F0FFF4',
    borderColor: '#00A86B',
  },
  surahNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  surahNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  surahInfo: {
    flex: 1,
  },
  surahTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  surahNameEn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  lastReadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A86B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  lastReadText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  surahTranslation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  surahMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surahMetaText: {
    fontSize: 12,
    color: '#999',
  },
  surahNameAr: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00A86B',
    marginLeft: 12,
  },
});