// ============================================================================
// FILE: src/screens/quran/QuranSurahListScreen.jsx
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuranStore } from '../../store/quranStore';
import { useFocusEffect } from '@react-navigation/native';

export const QuranSurahListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { quranData, lastRead, bookmarks, initialize, isInitialized, isLoading } = useQuranStore();
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

  const filteredSurahs = quranData.surahs.filter((surah) =>
    surah.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.name_ar.includes(searchQuery) ||
    surah.number.toString().includes(searchQuery)
  );

  const renderSurah = ({ item: surah }) => {
    const isLastRead = lastRead?.surahNumber === surah.number;

    return (
      <TouchableOpacity
        style={[styles.surahCard, isLastRead && styles.lastReadCard]}
        onPress={() => navigation.navigate('QuranReader', { surahNumber: surah.number })}
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
          <Text style={styles.surahTranslation}>{surah.name_en_translation}</Text>
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
          <Text style={styles.headerTitle}>{t('quran.quran')}</Text>
          <View style={styles.bookmarkButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>{t('quran.quran')}</Text>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => navigation.navigate('QuranBookmarks')}
        >
          <View>
            <Ionicons name="bookmark-outline" size={24} color="#00A86B" />
            {bookmarks.length > 0 && (
              <View style={styles.bookmarkCountBadge}>
                <Text style={styles.bookmarkCountText}>{bookmarks.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
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
          onPress={() => navigation.navigate('QuranReader', { 
            surahNumber: lastRead.surahNumber,
            ayahNumber: lastRead.ayahNumber 
          })}
        >
          <View style={styles.continueIcon}>
            <Ionicons name="play-circle" size={32} color="#00A86B" />
          </View>
          <View style={styles.continueInfo}>
            <Text style={styles.continueTitle}>{t('quran.continueReading')}</Text>
            <Text style={styles.continueText}>
              {quranData.surahs.find(s => s.number === lastRead.surahNumber)?.name_en} - {t('quran.ayah')} {lastRead.ayahNumber}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#00A86B" />
        </TouchableOpacity>
      )}

      {/* Surah List */}
      <FlatList
        data={filteredSurahs}
        renderItem={renderSurah}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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