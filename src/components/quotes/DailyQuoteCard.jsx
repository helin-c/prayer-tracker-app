// ============================================================================
// FILE: src/components/quotes/DailyQuoteCard.jsx (ENHANCED WITH SOCIAL SHARING)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

// Sample quotes - replace with your API/database
const DAILY_QUOTES = [
  {
    id: 1,
    text: 'The best among you are those who have the best manners and character.',
    author: 'Prophet Muhammad (PBUH)',
    source: 'Sahih Bukhari',
  },
  {
    id: 2,
    text: 'Do not lose hope, nor be sad.',
    author: 'Quran',
    source: 'Surah Al-Imran 3:139',
  },
  {
    id: 3,
    text: 'Verily, with hardship comes ease.',
    author: 'Quran',
    source: 'Surah Ash-Sharh 94:6',
  },
  {
    id: 4,
    text: 'The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry.',
    author: 'Prophet Muhammad (PBUH)',
    source: 'Sahih Bukhari',
  },
  {
    id: 5,
    text: 'And He is with you wherever you are.',
    author: 'Quran',
    source: 'Surah Al-Hadid 57:4',
  },
];

export const DailyQuoteCard = () => {
  const { t } = useTranslation();
  const [dailyQuote, setDailyQuote] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const viewShotRef = React.useRef();

  useEffect(() => {
    loadDailyQuote();
  }, []);

  const loadDailyQuote = () => {
    // Get quote based on day of year for consistency
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );
    const quoteIndex = dayOfYear % DAILY_QUOTES.length;
    setDailyQuote(DAILY_QUOTES[quoteIndex]);
  };

  const handleShare = async () => {
    if (!dailyQuote) return;

    try {
      setIsSharing(true);
      const shareText = `"${dailyQuote.text}"\n\n— ${dailyQuote.author}\n${dailyQuote.source}`;

      if (Platform.OS === 'web') {
        await Share.share({
          message: shareText,
        });
      } else {
        const result = await Share.share({
          message: shareText,
          title: t('quotes.dailyInspiration'),
        });

        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            console.log('Shared with activity type:', result.activityType);
          } else {
            console.log('Shared successfully');
          }
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(t('common.error'), t('quotes.shareError'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareImage = async () => {
    if (!dailyQuote || !viewShotRef.current) return;

    try {
      setIsSharing(true);
      
      // Capture the view as image
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: t('quotes.shareQuote'),
        });
      } else {
        Alert.alert(t('common.error'), t('quotes.sharingNotAvailable'));
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert(t('common.error'), t('quotes.shareError'));
    } finally {
      setIsSharing(false);
    }
  };

  if (!dailyQuote) return null;

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
          style={styles.cardGradient}
        >
          {/* Decorative Islamic Pattern Overlay */}
          <View style={styles.patternOverlay}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
          </View>

          {/* Quote Icon */}
          <View style={styles.quoteIconContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
              style={styles.quoteIconGradient}
            >
              <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Quote Text */}
          <Text style={styles.quoteText}>"{dailyQuote.text}"</Text>

          {/* Author & Source */}
          <View style={styles.authorContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.authorText}>{dailyQuote.author}</Text>
            <Text style={styles.sourceText}>{dailyQuote.source}</Text>
          </View>

          {/* Share Actions */}
          <View style={styles.shareActions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.8}
              disabled={isSharing}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
                style={styles.shareButtonGradient}
              >
                <Ionicons
                  name={isSharing ? 'hourglass' : 'share-social'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.shareButtonText}>
                  {t('quotes.shareText')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareImageButton}
              onPress={handleShareImage}
              activeOpacity={0.8}
              disabled={isSharing}
            >
              <LinearGradient
                colors={['#6F9C8C', '#4F6F64']}
                style={styles.shareImageGradient}
              >
                <Ionicons name="image" size={20} color="#FFFFFF" />
                <Text style={styles.shareImageButtonText}>
                  {t('quotes.shareImage')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  cardGradient: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#4F6F64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -50,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    bottom: -20,
    left: -20,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    top: '50%',
    right: 20,
  },
  quoteIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  quoteIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  quoteText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 24,
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  authorContainer: {
    marginBottom: 20,
  },
  dividerLine: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1.5,
    marginBottom: 12,
  },
  authorText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  sourceText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  shareButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  shareImageButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F6F64',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  shareImageGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 16,
  },
  shareImageButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});