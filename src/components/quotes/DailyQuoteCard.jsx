// ============================================================================
// FILE: src/components/quotes/DailyQuoteCard.jsx (WITH PROPER IMAGE SHARING)
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
  Image,
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
      {/* Shareable Image Content - Only this part gets captured */}
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
        <View style={styles.shareableContent}>
          <ImageBackground
            source={require('../../assets/images/illustrations/background4.jpeg')}
            style={styles.backgroundImage}
            imageStyle={styles.backgroundImageStyle}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(91, 168, 149, 0.92)', 'rgba(74, 155, 135, 0.88)']}
              style={styles.shareableGradient}
            >
              {/* Decorative Pattern Overlay */}
              <View style={styles.patternOverlay}>
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <View style={styles.decorativeCircle3} />
              </View>

              {/* Quote Text */}
              <View style={styles.quoteContentArea}>
                <Text style={styles.quoteText}>"{dailyQuote.text}"</Text>

                {/* Author & Source */}
                <View style={styles.authorContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.authorText}>{dailyQuote.author}</Text>
                  <Text style={styles.sourceText}>{dailyQuote.source}</Text>
                </View>
              </View>

              {/* App Branding - Bottom Left */}
              <View style={styles.brandingContainer}>
                <View style={styles.brandingContent}>
                  <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                      <Image
                        source={require('../../assets/images/illustrations/icon.png')}
                        style={styles.logoImage}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  <View style={styles.appNameContainer}>
                    <Text style={styles.appName}>Salah Tracker</Text>
                    <Text style={styles.appTagline}>Track Your Journey</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
      </ViewShot>

      {/* Interactive Buttons - Outside ViewShot so they won't appear in shared image */}
      <View style={styles.interactiveSection}>
        <View style={styles.shareActions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
            disabled={isSharing}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']}
              style={styles.shareButtonGradient}
            >
              <View style={styles.shareButtonInner}>
                <Ionicons
                  name={isSharing ? 'hourglass' : 'share-social'}
                  size={20}
                  color="#5BA895"
                />
                <Text style={styles.shareButtonText}>
                  {t('quotes.shareText')}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareImageButton}
            onPress={handleShareImage}
            activeOpacity={0.8}
            disabled={isSharing}
          >
            <LinearGradient
              colors={['#5BA895', '#4A9B87']}
              style={styles.shareImageGradient}
            >
              <Ionicons name="image" size={20} color="#FFFFFF" />
              <Text style={styles.shareImageButtonText}>
                {t('quotes.shareImage')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  
  // ============================================================================
  // SHAREABLE CONTENT (Gets captured in image)
  // ============================================================================
  shareableContent: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  backgroundImage: {
    width: '100%',
  },
  backgroundImageStyle: {
    borderRadius: 28,
  },
  shareableGradient: {
    padding: 24,
    paddingBottom: 28,
    position: 'relative',
    minHeight: 320,
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -50,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -20,
    left: -20,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: '40%',
    right: 20,
  },
  quoteContentArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  quoteText: {
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.3,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    paddingHorizontal: 8,
  },
  authorContainer: {
    alignItems: 'center',
  },
  dividerLine: {
    width: 60,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    marginBottom: 12,
    opacity: 0.9,
  },
  authorText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sourceText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // ============================================================================
  // APP BRANDING (Appears in shared image - Bottom Left)
  // ============================================================================
  brandingContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  brandingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  logoContainer: {
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appNameContainer: {
    alignItems: 'flex-start',
  },
  appName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  appTagline: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // ============================================================================
  // INTERACTIVE SECTION (NOT in shared image)
  // ============================================================================
  interactiveSection: {
    marginTop: 16,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonGradient: {
    borderRadius: 16,
  },
  shareButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5BA895',
    letterSpacing: 0.3,
  },
  shareImageButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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