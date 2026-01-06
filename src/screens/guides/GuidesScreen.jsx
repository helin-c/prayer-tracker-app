// @ts-nocheck
// ============================================================================
// FILE: src/screens/guides/GuidesScreen.jsx
// ============================================================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useQuranStore } from '../../store/quranStore';

import { ScreenLayout } from '../../components/layout/ScreenLayout';
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const CARD_HEIGHT = 180; // Sabit yükseklik

// CUSTOM SKELETON FOR GUIDES SCREEN
const GuidesSkeleton = () => {
  const skeletonStyle = { backgroundColor: '#DCEFE3' };

  return (
    <View style={{ padding: 20 }}>
      <View style={{ marginBottom: 24 }}>
        <SkeletonLine
          width={180}
          height={32}
          style={{ ...skeletonStyle, marginBottom: 8 }}
        />
        <SkeletonLine width={240} height={16} style={skeletonStyle} />
      </View>

      <SkeletonLoader
        width="100%"
        height={160}
        borderRadius={20}
        style={{ ...skeletonStyle, marginBottom: 32 }}
      />

      <SkeletonLine
        width={120}
        height={20}
        style={{ ...skeletonStyle, marginBottom: 16 }}
      />

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLoader
            key={i}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            borderRadius={16}
            style={{ ...skeletonStyle, marginBottom: 16 }}
          />
        ))}
      </View>

      <SkeletonLoader
        width="100%"
        height={180}
        borderRadius={16}
        style={{ ...skeletonStyle, marginTop: 16 }}
      />
    </View>
  );
};

// MAIN SCREEN
export const GuidesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { initialize } = useQuranStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        await initialize();
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error initializing:', error);
        setIsLoading(false);
      }
    };
    initializeScreen();
  }, []);

  const guides = [
    {
      id: 'quran',
      title: t('quran.quran'),
      subtitle: t('guides.quranSubtitle'),
      icon: 'book',
      color: '#00A86B',
      gradient: ['#00A86B', '#00D084'],
      action: () => navigation.navigate('QuranSurahList'),
    },
    {
      id: 'prayer',
      title: t('guides.prayer1'),
      subtitle: t('guides.prayerSubtitle'),
      icon: 'hand-right',
      color: '#3498DB',
      gradient: ['#3498DB', '#5DADE2'],
      screen: 'PrayerGuide',
    },
    {
      id: 'wudu',
      title: t('guides.wudu1'),
      subtitle: t('guides.wuduSubtitle'),
      icon: 'water',
      color: '#9B59B6',
      gradient: ['#9B59B6', '#BB8FCE'],
      screen: 'WuduGuide',
    },
    {
      id: 'pillars',
      title: t('guides.pillars1'),
      subtitle: t('guides.pillarsSubtitle'),
      icon: 'cube',
      color: '#E67E22',
      gradient: ['#E67E22', '#F39C12'],
      screen: 'PillarsGuide',
    },
    {
      id: 'duas',
      title: t('guides.duas1'),
      subtitle: t('guides.duasSubtitle'),
      icon: 'chatbubbles',
      color: '#16A085',
      gradient: ['#16A085', '#1ABC9C'],
      screen: 'DuasGuide',
    },
    {
      id: 'ramadan',
      title: t('guides.ramadan1'),
      subtitle: t('guides.ramadanSubtitle'),
      icon: 'moon',
      color: '#8E44AD',
      gradient: ['#8E44AD', '#A569BD'],
      screen: 'RamadanGuide',
    },
    {
      id: 'hajj',
      title: t('guides.hajj1'),
      subtitle: t('guides.hajjSubtitle'),
      icon: 'business',
      color: '#C0392B',
      gradient: ['#C0392B', '#E74C3C'],
      screen: 'HajjGuide',
    },
    {
      id: 'basics',
      title: t('guides.basics1'),
      subtitle: t('guides.basicsSubtitle'),
      icon: 'bulb',
      color: '#F39C12',
      gradient: ['#F39C12', '#F1C40F'],
      screen: 'BasicsGuide',
    },
  ];

  const handleGuidePress = (guide) => {
    if (guide.action) {
      guide.action();
    } else if (guide.screen) {
      navigation.navigate(guide.screen, { guide });
    }
  };

  const renderGuideCard = (guide) => (
    <TouchableOpacity
      key={guide.id}
      style={styles.cardWrapper}
      onPress={() => handleGuidePress(guide)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={guide.gradient}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={guide.icon} size={32} color="#FFF" />
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {guide.title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {guide.subtitle}
        </Text>
        <View style={styles.cardArrow}>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout noPaddingBottom={true}>
      {isLoading ? (
        <GuidesSkeleton />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('guides.title')}</Text>
            <Text style={styles.subtitle}>{t('guides.subtitle')}</Text>
          </View>

          {/* Featured Card - Quran */}
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => handleGuidePress(guides[0])}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#00A86B', '#00D084']}
              style={styles.featuredGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredIcon}>
                  <Ionicons name="book" size={48} color="#FFF" />
                </View>
                <View style={styles.featuredText}>
                  <Text style={styles.featuredBadge}>
                    {t('guides.popular')}
                  </Text>
                  <Text style={styles.featuredTitle}>{t('quran.quran')}</Text>
                  <Text style={styles.featuredSubtitle} numberOfLines={2}>
                    {t('guides.quranDescription')}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="arrow-forward-circle"
                size={32}
                color="#FFF"
                style={styles.featuredArrow}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('guides.browseAll')}</Text>
            <View style={styles.cardsGrid}>
              {guides.slice(1).map((guide) => renderGuideCard(guide))}
            </View>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <View style={styles.helpCard}>
              <Ionicons name="help-circle" size={32} color="#5BA895" />
              <Text style={styles.helpTitle}>{t('guides.newToIslam')}</Text>
              <Text style={styles.helpText}>{t('guides.newToIslamText')}</Text>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() =>
                  navigation.navigate('BasicsGuide', {
                    guide: guides.find((g) => g.id === 'basics'),
                  })
                }
              >
                <Text style={styles.helpButtonText}>
                  {t('guides.getStarted')}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  featuredCard: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredGradient: {
    padding: 24,
    minHeight: 160,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featuredText: {
    flex: 1,
  },
  featuredBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  featuredArrow: {
    alignSelf: 'flex-end',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
    minHeight: 40,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    minHeight: 32,
  },
  cardArrow: {
    alignSelf: 'flex-end',
    marginTop: '-16',
  },
  helpSection: {
    marginTop: 16,
  },
  helpCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5BA895',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
