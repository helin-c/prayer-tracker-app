// ============================================================================
// FILE: src/screens/quran/QuranReaderScreen.jsx (FIXED)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuranStore } from '../../store/quranStore';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export const QuranReaderScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { surahNumber: initialSurah = 1, ayahNumber: initialAyah } = route.params || {};
  
  const {
    getSurah,
    bookmarks,
    highlights,
    settings,
    addBookmark,
    removeBookmark,
    addHighlight,
    removeHighlight,
    updateLastRead,
    isBookmarked,
    getHighlight,
    getBookmarkBySurahAyah,
    initialize,
    isInitialized,
  } = useQuranStore();

  const [currentSurah, setCurrentSurah] = useState(getSurah(initialSurah));
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  
  const scrollViewRef = useRef(null);

  // Initialize store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, []);

  // Update current surah when initialized or surah changes
  useEffect(() => {
    if (isInitialized) {
      const surah = getSurah(initialSurah);
      setCurrentSurah(surah);
    }
  }, [isInitialized, initialSurah]);

  // Update last read position
  useEffect(() => {
    if (currentSurah && currentSurah.ayahs.length > 0 && isInitialized) {
      const ayahToTrack = initialAyah || 1;
      updateLastRead(currentSurah.number, ayahToTrack);
    }
  }, [currentSurah, isInitialized]);

  // Refresh bookmarks when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialized) {
        // Force re-render to show updated bookmarks
        setCurrentSurah(getSurah(currentSurah?.number || initialSurah));
      }
    }, [isInitialized, currentSurah?.number])
  );

  // Convert number to Arabic numeral
  const toArabicNumber = (num) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(d => arabicNumbers[parseInt(d)]).join('');
  };

  const handleAyahLongPress = (ayah) => {
    // Get existing bookmark note if any
    const existingBookmark = getBookmarkBySurahAyah(currentSurah.number, ayah.number_in_surah);
    setBookmarkNote(existingBookmark?.note || '');
    setSelectedAyah(ayah);
    setShowMenu(true);
  };

  const handleAddBookmark = async () => {
    if (selectedAyah) {
      const result = await addBookmark(
        currentSurah.number,
        selectedAyah.number_in_surah,
        bookmarkNote
      );
      
      if (result.success) {
        Alert.alert(t('common.success'), t('quran.bookmarkAdded'));
        setShowMenu(false);
        setBookmarkNote('');
      } else {
        Alert.alert(t('common.error'), t('quran.bookmarkAddError'));
      }
    }
  };

  const handleRemoveBookmark = async () => {
    if (selectedAyah) {
      const bookmark = bookmarks.find(
        (b) =>
          b.surahNumber === currentSurah.number &&
          b.ayahNumber === selectedAyah.number_in_surah
      );
      if (bookmark) {
        const result = await removeBookmark(bookmark.id);
        if (result.success) {
          Alert.alert(t('common.success'), t('quran.bookmarkRemoved'));
          setShowMenu(false);
        } else {
          Alert.alert(t('common.error'), t('quran.bookmarkRemoveError'));
        }
      }
    }
  };

  const handleHighlight = async (color) => {
    if (selectedAyah) {
      const result = await addHighlight(currentSurah.number, selectedAyah.number_in_surah, color);
      if (result.success) {
        setShowMenu(false);
      } else {
        Alert.alert(t('common.error'), t('quran.highlightAddError'));
      }
    }
  };

  const handleRemoveHighlight = async () => {
    if (selectedAyah) {
      const result = await removeHighlight(currentSurah.number, selectedAyah.number_in_surah);
      if (result.success) {
        setShowMenu(false);
      } else {
        Alert.alert(t('common.error'), t('quran.highlightRemoveError'));
      }
    }
  };

  const getThemeColors = () => {
    const themes = {
      light: {
        background: '#FAFAFA',
        page: '#FFFFFF',
        text: '#1A1A1A',
        ayahText: '#2C2C2C',
        border: '#E0E0E0',
        accent: '#00A86B',
        shadow: 'rgba(0,0,0,0.1)',
      },
      dark: {
        background: '#1A1A1A',
        page: '#2C2C2C',
        text: '#FFFFFF',
        ayahText: '#E0E0E0',
        border: '#404040',
        accent: '#00D084',
        shadow: 'rgba(255,255,255,0.1)',
      },
      sepia: {
        background: '#F4F1E8',
        page: '#FBF8F1',
        text: '#5C4B37',
        ayahText: '#4A3B2C',
        border: '#D4C4B0',
        accent: '#8B7355',
        shadow: 'rgba(92,75,55,0.1)',
      },
    };
    return themes[settings.theme] || themes.light;
  };

  const colors = getThemeColors();

  const renderAyah = (ayah, index) => {
    const highlight = getHighlight(currentSurah.number, ayah.number_in_surah);
    const bookmarked = isBookmarked(currentSurah.number, ayah.number_in_surah);

    return (
      <Text key={ayah.global_number}>
        <Text
          style={[
            styles.ayahTextInline,
            highlight && { backgroundColor: highlight.color + '40' },
          ]}
          onLongPress={() => handleAyahLongPress(ayah)}
        >
          {ayah.text_ar}
          <Text style={[styles.ayahNumberInline, { color: colors.accent }]}>
            {' '}۝{toArabicNumber(ayah.number_in_surah)}{' '}
          </Text>
          {bookmarked && (
            <Text style={[styles.bookmarkIndicator, { color: colors.accent }]}>
              ۩
            </Text>
          )}
        </Text>
      </Text>
    );
  };

  if (!currentSurah) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC3545" />
          <Text style={styles.errorText}>{t('quran.surahNotFound')}</Text>
          <TouchableOpacity 
            style={styles.backToListButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToListText}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.page, 
        borderBottomColor: colors.border,
        shadowColor: colors.shadow,
      }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.surahName, { color: colors.text }]}>
            {currentSurah.name_ar}
          </Text>
          <Text style={[styles.surahInfo, { color: colors.text }]}>
            {currentSurah.name_en} • {currentSurah.ayahs.length} {t('quran.ayahs')}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('QuranBookmarks')}
          >
            <View>
              <Ionicons name="bookmark-outline" size={24} color={colors.text} />
              {bookmarks.length > 0 && (
                <View style={styles.bookmarkBadge}>
                  <Text style={styles.bookmarkBadgeText}>{bookmarks.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Surah Header with Bismillah */}
      {currentSurah.number !== 1 && currentSurah.number !== 9 && (
        <View style={[styles.surahHeader, { 
          backgroundColor: colors.page,
          shadowColor: colors.shadow,
        }]}>
          <View style={styles.bismillahContainer}>
            <Text style={[styles.bismillah, { color: colors.accent }]}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </Text>
          </View>
        </View>
      )}

      {/* Mushaf Page */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageContainer, { 
          backgroundColor: colors.page,
          shadowColor: colors.shadow,
        }]}>
          <Text 
            style={[styles.continuousText, { 
              fontSize: settings.fontSize,
              lineHeight: settings.fontSize * settings.lineHeight,
              color: colors.ayahText,
            }]}
          >
            {currentSurah.ayahs.map((ayah, index) => renderAyah(ayah, index))}
          </Text>
          
          {/* Surah End Decoration */}
          <View style={styles.surahEnd}>
            <Text style={[styles.surahEndText, { color: colors.accent }]}>
              ۝ صَدَقَ ٱللَّهُ ٱلْعَظِيمُ ۝
            </Text>
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Ayah Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: colors.page }]}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>
              {t('quran.ayahOptions')}
            </Text>
            
            {selectedAyah && (
              <Text style={[styles.menuAyahNumber, { color: colors.text }]}>
                {currentSurah.name_en} {toArabicNumber(selectedAyah.number_in_surah)}
              </Text>
            )}

            {/* Bookmark */}
            {!isBookmarked(currentSurah.number, selectedAyah?.number_in_surah) ? (
              <View>
                <TextInput
                  style={[styles.noteInput, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  }]}
                  placeholder={t('quran.addNote')}
                  placeholderTextColor={colors.text + '80'}
                  value={bookmarkNote}
                  onChangeText={setBookmarkNote}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.menuButton, { borderBottomColor: colors.border }]}
                  onPress={handleAddBookmark}
                >
                  <Ionicons name="bookmark-outline" size={24} color={colors.accent} />
                  <Text style={[styles.menuButtonText, { color: colors.text }]}>
                    {t('quran.addBookmark')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.menuButton, { borderBottomColor: colors.border }]}
                onPress={handleRemoveBookmark}
              >
                <Ionicons name="bookmark" size={24} color="#DC3545" />
                <Text style={[styles.menuButtonText, { color: '#DC3545' }]}>
                  {t('quran.removeBookmark')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Highlights */}
            <View style={styles.highlightSection}>
              <Text style={[styles.highlightTitle, { color: colors.text }]}>
                {t('quran.highlight')}
              </Text>
              <View style={styles.colorOptions}>
                {['#FFD54F', '#81C784', '#64B5F6', '#FFB74D', '#E57373'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }]}
                    onPress={() => handleHighlight(color)}
                  />
                ))}
              </View>
            </View>

            {getHighlight(currentSurah.number, selectedAyah?.number_in_surah) && (
              <TouchableOpacity
                style={[styles.menuButton, { borderBottomColor: colors.border }]}
                onPress={handleRemoveHighlight}
              >
                <Ionicons name="color-wand-outline" size={24} color="#DC3545" />
                <Text style={[styles.menuButtonText, { color: '#DC3545' }]}>
                  {t('quran.removeHighlight')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.menuButton, styles.menuButtonLast]}
              onPress={() => setShowMenu(false)}
            >
              <Ionicons name="close-circle-outline" size={24} color={colors.text} />
              <Text style={[styles.menuButtonText, { color: colors.text }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.settingsContainer, { backgroundColor: colors.page }]}>
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>
                {t('quran.readingSettings')}
              </Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <QuranSettings colors={colors} onClose={() => setShowSettings(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Settings Component
const QuranSettings = ({ colors, onClose }) => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useQuranStore();

  return (
    <ScrollView style={styles.settingsContent}>
      {/* Font Size */}
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          {t('quran.fontSize')}
        </Text>
        <View style={styles.fontSizeControls}>
          <TouchableOpacity
            style={[styles.fontButton, { borderColor: colors.border }]}
            onPress={() => updateSettings({ fontSize: Math.max(18, settings.fontSize - 2) })}
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.fontSizeValue, { color: colors.text }]}>
            {settings.fontSize}
          </Text>
          <TouchableOpacity
            style={[styles.fontButton, { borderColor: colors.border }]}
            onPress={() => updateSettings({ fontSize: Math.min(40, settings.fontSize + 2) })}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Line Height */}
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          {t('quran.lineHeight')}
        </Text>
        <View style={styles.fontSizeControls}>
          <TouchableOpacity
            style={[styles.fontButton, { borderColor: colors.border }]}
            onPress={() => updateSettings({ lineHeight: Math.max(1.5, settings.lineHeight - 0.1) })}
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.fontSizeValue, { color: colors.text }]}>
            {settings.lineHeight.toFixed(1)}
          </Text>
          <TouchableOpacity
            style={[styles.fontButton, { borderColor: colors.border }]}
            onPress={() => updateSettings({ lineHeight: Math.min(2.5, settings.lineHeight + 0.1) })}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme */}
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          {t('quran.theme')}
        </Text>
        <View style={styles.themeOptions}>
          {['light', 'dark', 'sepia'].map((theme) => (
            <TouchableOpacity
              key={theme}
              style={[
                styles.themeButton,
                { borderColor: colors.border },
                settings.theme === theme && { 
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                },
              ]}
              onPress={() => updateSettings({ theme })}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  { color: colors.text },
                  settings.theme === theme && { color: '#FFF' },
                ]}
              >
                {t(`quran.theme_${theme}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backToListButton: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backToListText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  bookmarkBadge: {
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
  bookmarkBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  surahName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  surahInfo: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  surahHeader: {
    paddingVertical: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bismillahContainer: {
    paddingHorizontal: 20,
  },
  bismillah: {
    fontSize: 26,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  pageContainer: {
    borderRadius: 8,
    padding: 24,
    paddingTop: 20,
    marginHorizontal: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  continuousText: {
    textAlign: 'justify',
    writingDirection: 'rtl',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  ayahTextInline: {
    // Inline ayah styling
  },
  ayahNumberInline: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookmarkIndicator: {
    fontSize: 18,
    marginLeft: 2,
  },
  surahEnd: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  surahEndText: {
    fontSize: 22,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.7,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuAyahNumber: {
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.7,
  },
  noteInput: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuButtonLast: {
    borderBottomWidth: 0,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  highlightSection: {
    paddingVertical: 16,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  settingsContainer: {
    marginTop: height * 0.2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  settingItem: {
    marginBottom: 32,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  fontButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});