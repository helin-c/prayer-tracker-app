// ============================================================================
// FILE: src/screens/quran/QuranReaderScreen.jsx
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuranStore } from '../../store/quranStore';

const { width, height } = Dimensions.get('window');

export const QuranReaderScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { surahNumber: initialSurah = 1 } = route.params || {};
  
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
  } = useQuranStore();

  const [currentSurah, setCurrentSurah] = useState(getSurah(initialSurah));
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (currentSurah && currentSurah.ayahs.length > 0) {
      updateLastRead(currentSurah.number, 1);
    }
  }, [currentSurah]);

  const handleAyahLongPress = (ayah) => {
    setSelectedAyah(ayah);
    setShowMenu(true);
  };

  const handleAddBookmark = async () => {
    if (selectedAyah) {
      await addBookmark(
        currentSurah.number,
        selectedAyah.number_in_surah,
        bookmarkNote
      );
      setShowMenu(false);
      setBookmarkNote('');
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
        await removeBookmark(bookmark.id);
      }
      setShowMenu(false);
    }
  };

  const handleHighlight = async (color) => {
    if (selectedAyah) {
      await addHighlight(currentSurah.number, selectedAyah.number_in_surah, color);
      setShowMenu(false);
    }
  };

  const handleRemoveHighlight = async () => {
    if (selectedAyah) {
      await removeHighlight(currentSurah.number, selectedAyah.number_in_surah);
      setShowMenu(false);
    }
  };

  const getThemeColors = () => {
    const themes = {
      light: {
        background: '#FAFAFA',
        card: '#FFFFFF',
        text: '#1A1A1A',
        ayahText: '#2C2C2C',
        border: '#E0E0E0',
        accent: '#00A86B',
      },
      dark: {
        background: '#1A1A1A',
        card: '#2C2C2C',
        text: '#FFFFFF',
        ayahText: '#E0E0E0',
        border: '#404040',
        accent: '#00D084',
      },
      sepia: {
        background: '#F4F1E8',
        card: '#FBF8F1',
        text: '#5C4B37',
        ayahText: '#4A3B2C',
        border: '#D4C4B0',
        accent: '#8B7355',
      },
    };
    return themes[settings.theme] || themes.light;
  };

  const colors = getThemeColors();

  const renderAyah = (ayah) => {
    const highlight = getHighlight(currentSurah.number, ayah.number_in_surah);
    const bookmarked = isBookmarked(currentSurah.number, ayah.number_in_surah);

    return (
      <TouchableOpacity
        key={ayah.global_number}
        style={[
          styles.ayahContainer,
          { 
            backgroundColor: highlight ? highlight.color : 'transparent',
            borderColor: colors.border,
          },
        ]}
        onLongPress={() => handleAyahLongPress(ayah)}
        activeOpacity={0.7}
      >
        <View style={styles.ayahContent}>
          <Text
            style={[
              styles.ayahText,
              {
                fontSize: settings.fontSize,
                lineHeight: settings.fontSize * settings.lineHeight,
                color: colors.ayahText,
                textAlign: 'right',
              },
            ]}
          >
            {ayah.text_ar}
          </Text>
          
          <View style={styles.ayahFooter}>
            <View style={[styles.ayahNumber, { borderColor: colors.accent }]}>
              <Text style={[styles.ayahNumberText, { color: colors.accent }]}>
                {ayah.number_in_surah}
              </Text>
            </View>
            
            {bookmarked && (
              <Ionicons name="bookmark" size={20} color={colors.accent} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
          <Text style={[styles.surahInfo, { color: colors.text, opacity: 0.6 }]}>
            {currentSurah.name_en} • {currentSurah.ayahs.length} {t('quran.ayahs')}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('QuranBookmarks')}
          >
            <Ionicons name="bookmark-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Surah Header */}
      <View style={[styles.surahHeader, { backgroundColor: colors.card }]}>
        <View style={styles.bismillahContainer}>
          <Text style={[styles.bismillah, { color: colors.text }]}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </Text>
        </View>
      </View>

      {/* Ayahs */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentSurah.ayahs.map((ayah) => renderAyah(ayah))}
        
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
          <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>
              {t('quran.ayahOptions')}
            </Text>
            
            {selectedAyah && (
              <Text style={[styles.menuAyahNumber, { color: colors.text, opacity: 0.6 }]}>
                {currentSurah.name_en} {selectedAyah.number_in_surah}
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
          <View style={[styles.settingsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>
                {t('quran.readingSettings')}
              </Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Settings content will be added in next part */}
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
            onPress={() => updateSettings({ fontSize: Math.max(16, settings.fontSize - 2) })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  surahHeader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  bismillahContainer: {
    paddingHorizontal: 20,
  },
  bismillah: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  ayahContainer: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  ayahContent: {
    gap: 12,
  },
  ayahText: {
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  ayahFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ayahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
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
    borderWidth: 2,
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