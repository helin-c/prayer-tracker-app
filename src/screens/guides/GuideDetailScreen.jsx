// @ts-nocheck
// ============================================================================
// FILE: src/screens/guides/GuideDetailScreen.jsx
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ScreenLayout } from '../../components/layout/ScreenLayout';
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

// GUIDE CONTENT DATA
const getGuideContent = (t) => ({
  prayer: {
    title: t('guides.prayerTitle'),
    description: t('guides.prayerDescription'),
    sections: [
      {
        id: 1,
        title: t('guides.prerequisites'),
        icon: 'checkbox-outline',
        steps: [
          {
            title: t('guides.prayer.cleanBody'),
            description: t('guides.prayer.cleanBodyDesc'),
          },
          {
            title: t('guides.prayer.cleanPlace'),
            description: t('guides.prayer.cleanPlaceDesc'),
          },
          {
            title: t('guides.prayer.cleanClothes'),
            description: t('guides.prayer.cleanClothesDesc'),
          },
          {
            title: t('guides.prayer.facingQibla'),
            description: t('guides.prayer.facingQiblaDesc'),
          },
        ],
      },
      {
        id: 2,
        title: t('guides.intention'),
        icon: 'heart',
        steps: [
          {
            title: t('guides.prayer.makeIntention'),
            description: t('guides.prayer.makeIntentionDesc'),
          },
        ],
      },
      {
        id: 3,
        title: t('guides.opening'),
        icon: 'hand-right',
        steps: [
          {
            title: t('guides.prayer.takbir'),
            description: t('guides.prayer.takbirDesc'),
            arabic: 'ٱللَّٰهُ أَكْبَرُ',
          },
          {
            title: t('guides.prayer.fatiha'),
            description: t('guides.prayer.fatihaDesc'),
            arabic: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
          },
        ],
      },
      {
        id: 4,
        title: t('guides.ruku'),
        icon: 'arrow-down',
        steps: [
          {
            title: t('guides.prayer.rukuPosition'),
            description: t('guides.prayer.rukuPositionDesc'),
            arabic: 'سُبْحَانَ رَبِّيَ ٱلْعَظِيمِ',
          },
        ],
      },
      {
        id: 5,
        title: t('guides.sujood'),
        icon: 'arrow-down-circle',
        steps: [
          {
            title: t('guides.prayer.sujoodPosition'),
            description: t('guides.prayer.sujoodPositionDesc'),
            arabic: 'سُبْحَانَ رَبِّيَ ٱلْأَعْلَىٰ',
          },
        ],
      },
      {
        id: 6,
        title: t('guides.tashahud'),
        icon: 'person',
        steps: [
          {
            title: t('guides.prayer.sitting'),
            description: t('guides.prayer.sittingDesc'),
            arabic: 'ٱلتَّحِيَّاتُ لِلَّٰهِ وَٱلصَّلَوَاتُ وَٱلطَّيِّبَاتُ',
          },
        ],
      },
      {
        id: 7,
        title: t('guides.completion'),
        icon: 'checkmark-circle',
        steps: [
          {
            title: t('guides.prayer.tasleem'),
            description: t('guides.prayer.tasleemDesc'),
            arabic: 'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ',
          },
        ],
      },
    ],
  },
  wudu: {
    title: t('guides.wuduTitle'),
    description: t('guides.wuduDescription'),
    sections: [
      {
        id: 1,
        title: t('guides.preparation'),
        icon: 'water',
        steps: [
          {
            title: t('guides.wudu.intention'),
            description: t('guides.wudu.intentionDesc'),
          },
          {
            title: t('guides.wudu.bismillah'),
            description: t('guides.wudu.bismillahDesc'),
            arabic: 'بِسْمِ ٱللَّٰهِ',
          },
        ],
      },
      {
        id: 2,
        title: t('guides.obligatorySteps'),
        icon: 'checkbox',
        steps: [
          {
            title: t('guides.wudu.washHands'),
            description: t('guides.wudu.washHandsDesc'),
          },
          {
            title: t('guides.wudu.rinseMouth'),
            description: t('guides.wudu.rinseMouthDesc'),
          },
          {
            title: t('guides.wudu.rinseNose'),
            description: t('guides.wudu.rinseNoseDesc'),
          },
          {
            title: t('guides.wudu.washFace'),
            description: t('guides.wudu.washFaceDesc'),
          },
          {
            title: t('guides.wudu.washArms'),
            description: t('guides.wudu.washArmsDesc'),
          },
          {
            title: t('guides.wudu.wipeHead'),
            description: t('guides.wudu.wipeHeadDesc'),
          },
          {
            title: t('guides.wudu.wipeEars'),
            description: t('guides.wudu.wipeEarsDesc'),
          },
          {
            title: t('guides.wudu.washFeet'),
            description: t('guides.wudu.washFeetDesc'),
          },
        ],
      },
      {
        id: 3,
        title: t('guides.invalidators'),
        icon: 'close-circle',
        steps: [
          {
            title: t('guides.wudu.naturalDischarge'),
            description: t('guides.wudu.naturalDischargeDesc'),
          },
          {
            title: t('guides.wudu.sleep'),
            description: t('guides.wudu.sleepDesc'),
          },
          {
            title: t('guides.wudu.unconsciousness'),
            description: t('guides.wudu.unconsciousnessDesc'),
          },
        ],
      },
    ],
  },
  pillars: {
    title: t('guides.pillarsTitle'),
    description: t('guides.pillarsDescription'),
    sections: [
      {
        id: 1,
        title: t('guides.shahada'),
        icon: 'finger-print',
        steps: [
          {
            title: t('guides.pillars.shahadaMeaning'),
            description: t('guides.pillars.shahadaMeaningDesc'),
            arabic:
              'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ ٱللَّٰهِ',
          },
        ],
      },
      {
        id: 2,
        title: t('guides.salah'),
        icon: 'hand-right',
        steps: [
          {
            title: t('guides.pillars.fivePrayers'),
            description: t('guides.pillars.fivePrayersDesc'),
          },
        ],
      },
      {
        id: 3,
        title: t('guides.zakat'),
        icon: 'gift',
        steps: [
          {
            title: t('guides.pillars.charitableGiving'),
            description: t('guides.pillars.charitableGivingDesc'),
          },
        ],
      },
      {
        id: 4,
        title: t('guides.sawm'),
        icon: 'moon',
        steps: [
          {
            title: t('guides.pillars.ramadanFast'),
            description: t('guides.pillars.ramadanFastDesc'),
          },
        ],
      },
      {
        id: 5,
        title: t('guides.hajjPillar'),
        icon: 'business',
        steps: [
          {
            title: t('guides.pillars.pilgrimage'),
            description: t('guides.pillars.pilgrimageDesc'),
          },
        ],
      },
    ],
  },
  duas: {
    title: t('guides.duasTitle'),
    description: t('guides.duasDescription'),
    sections: [
      {
        id: 1,
        title: t('guides.morning'),
        icon: 'sunny',
        steps: [
          {
            title: t('guides.duas.morningDua'),
            description: t('guides.duas.morningDuaDesc'),
            arabic: 'أَصْبَحْنَا وَأَصْبَحَ ٱلْمُلْكُ لِلَّٰهِ',
          },
        ],
      },
      {
        id: 2,
        title: t('guides.evening'),
        icon: 'moon',
        steps: [
          {
            title: t('guides.duas.eveningDua'),
            description: t('guides.duas.eveningDuaDesc'),
            arabic: 'أَمْسَيْنَا وَأَمْسَى ٱلْمُلْكُ لِلَّٰهِ',
          },
        ],
      },
      {
        id: 3,
        title: t('guides.mealtime'),
        icon: 'restaurant',
        steps: [
          {
            title: t('guides.duas.beforeEating'),
            description: t('guides.duas.beforeEatingDesc'),
            arabic: 'بِسْمِ ٱللَّٰهِ',
          },
          {
            title: t('guides.duas.afterEating'),
            description: t('guides.duas.afterEatingDesc'),
            arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
          },
        ],
      },
      {
        id: 4,
        title: t('guides.travel'),
        icon: 'car',
        steps: [
          {
            title: t('guides.duas.travelDua'),
            description: t('guides.duas.travelDuaDesc'),
            arabic: 'سُبْحَانَ ٱلَّذِي سَخَّرَ لَنَا هَٰذَا',
          },
        ],
      },
    ],
  },
  ramadan: {
    title: t('guides.ramadanTitle'),
    description: t('guides.ramadanDescription'),
    sections: [
      {
        id: 1,
        title: t('guides.fastingRules'),
        icon: 'moon',
        steps: [
          {
            title: t('guides.ramadan.whoMustFast'),
            description: t('guides.ramadan.whoMustFastDesc'),
          },
          {
            title: t('guides.ramadan.whatBreaksFast'),
            description: t('guides.ramadan.whatBreaksFastDesc'),
          },
        ],
      },
      {
        id: 2,
        title: t('guides.suhoor'),
        icon: 'restaurant',
        steps: [
          {
            title: t('guides.ramadan.suhoorTime'),
            description: t('guides.ramadan.suhoorTimeDesc'),
          },
          {
            title: t('guides.ramadan.iftarTime'),
            description: t('guides.ramadan.iftarTimeDesc'),
          },
        ],
      },
      {
        id: 3,
        title: t('guides.nightPrayer'),
        icon: 'moon-outline',
        steps: [
          {
            title: t('guides.ramadan.taraweeh'),
            description: t('guides.ramadan.taraweehDesc'),
          },
        ],
      },
      {
        id: 4,
        title: t('guides.laylatulQadr'),
        icon: 'star',
        steps: [
          {
            title: t('guides.ramadan.nightOfPower'),
            description: t('guides.ramadan.nightOfPowerDesc'),
          },
        ],
      },
    ],
  },
  hajj: {
    title: t('guides.hajjTitle'),
    description: t('guides.hajjDescription'),
    sections: [
      {
        id: 1,
        title: t('guides.hajjIntro'),
        icon: 'information-circle',
        steps: [
          {
            title: t('guides.hajj.obligation'),
            description: t('guides.hajj.obligationDesc'),
          },
        ],
      },
      {
        id: 2,
        title: t('guides.ihram'),
        icon: 'shirt',
        steps: [
          {
            title: t('guides.hajj.ihramClothing'),
            description: t('guides.hajj.ihramClothingDesc'),
          },
          {
            title: t('guides.hajj.ihramRestrictions'),
            description: t('guides.hajj.ihramRestrictionsDesc'),
          },
        ],
      },
      {
        id: 3,
        title: t('guides.tawaf'),
        icon: 'refresh',
        steps: [
          {
            title: t('guides.hajj.circlingKaaba'),
            description: t('guides.hajj.circlingKaabaDesc'),
          },
        ],
      },
      {
        id: 4,
        title: t('guides.saee'),
        icon: 'walk',
        steps: [
          {
            title: t('guides.hajj.safaMarwa'),
            description: t('guides.hajj.safaMarwaDesc'),
          },
        ],
      },
      {
        id: 5,
        title: t('guides.arafah'),
        icon: 'sunny',
        steps: [
          {
            title: t('guides.hajj.dayOfArafah'),
            description: t('guides.hajj.dayOfArafahDesc'),
          },
        ],
      },
    ],
  },
  basics: {
    title: t('guides.basicsTitle'),
    description: t('guides.basicsDescription'),
    sections: [
      {
        id: 1,
        title: t('guides.beliefInAllah'),
        icon: 'infinite',
        steps: [
          {
            title: t('guides.basics.tawheed'),
            description: t('guides.basics.tawheedDesc'),
          },
        ],
      },
      {
        id: 2,
        title: t('guides.prophets'),
        icon: 'people',
        steps: [
          {
            title: t('guides.basics.messengers'),
            description: t('guides.basics.messengersDesc'),
          },
        ],
      },
      {
        id: 3,
        title: t('guides.holyBooks'),
        icon: 'book',
        steps: [
          {
            title: t('guides.basics.divineBooks'),
            description: t('guides.basics.divineBooksDesc'),
          },
        ],
      },
      {
        id: 4,
        title: t('guides.angels'),
        icon: 'flash',
        steps: [
          {
            title: t('guides.basics.angelsRole'),
            description: t('guides.basics.angelsRoleDesc'),
          },
        ],
      },
      {
        id: 5,
        title: t('guides.dayOfJudgment'),
        icon: 'time',
        steps: [
          {
            title: t('guides.basics.akhirah'),
            description: t('guides.basics.akhirahDesc'),
          },
        ],
      },
      {
        id: 6,
        title: t('guides.destiny'),
        icon: 'compass',
        steps: [
          {
            title: t('guides.basics.qadr'),
            description: t('guides.basics.qadrDesc'),
          },
        ],
      },
    ],
  },
});

// SKELETON COMPONENT
const GuideDetailSkeleton = ({ color }) => {
  const skeletonStyle = { backgroundColor: '#DCEFE3' };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: 20,
          paddingBottom: 32,
          backgroundColor: color || '#CCC',
          opacity: 0.8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <SkeletonCircle size={40} style={skeletonStyle} />
          <SkeletonCircle size={56} style={skeletonStyle} />
        </View>
        <SkeletonLine
          width={200}
          height={32}
          style={{ ...skeletonStyle, marginBottom: 8 }}
        />
        <SkeletonLine width={280} height={16} style={skeletonStyle} />
      </View>

      <View style={{ padding: 20 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              marginBottom: 16,
              backgroundColor: '#FFF',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <SkeletonCircle
                size={40}
                style={{ backgroundColor: '#F0F0F0', marginRight: 12 }}
              />
              <SkeletonLine
                width={150}
                height={20}
                style={{ backgroundColor: '#F0F0F0' }}
              />
            </View>
            <SkeletonLine
              width="100%"
              height={14}
              style={{ backgroundColor: '#F0F0F0', marginBottom: 8 }}
            />
            <SkeletonLine
              width="80%"
              height={14}
              style={{ backgroundColor: '#F0F0F0' }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

// MAIN SCREEN
export const GuideDetailScreen = ({ route, navigation }) => {
  const { guide } = route.params;
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const guideContent = getGuideContent(t);
  const content = guideContent[guide.id] || {
    title: guide.title,
    description: guide.subtitle,
    sections: [],
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  if (isLoading) {
    return (
      <ScreenLayout>
        <GuideDetailSkeleton color={guide.color} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout noPaddingTop={true} noPaddingBottom={true}>
      <LinearGradient
        colors={guide.gradient}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name={guide.icon} size={32} color="#FFF" />
          </View>
        </View>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <Text style={styles.headerDescription}>{content.description}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {content.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View
                  style={[styles.sectionIcon, { backgroundColor: guide.color }]}
                >
                  <Ionicons name={section.icon} size={20} color="#FFF" />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Ionicons
                name={
                  expandedSection === section.id ? 'chevron-up' : 'chevron-down'
                }
                size={24}
                color="#666"
              />
            </TouchableOpacity>

            {expandedSection === section.id && (
              <View style={styles.sectionContent}>
                {section.steps.map((step, index) => (
                  <View key={index} style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                      <View
                        style={[
                          styles.stepNumber,
                          { backgroundColor: guide.color },
                        ]}
                      >
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                    </View>
                    <Text style={styles.stepDescription}>
                      {step.description}
                    </Text>
                    {step.arabic && (
                      <View style={styles.arabicCard}>
                        <Text style={styles.arabicText}>{step.arabic}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {content.sections.length === 0 && (
          <View style={styles.comingSoon}>
            <Ionicons name="construct" size={64} color="#CCC" />
            <Text style={styles.comingSoonTitle}>{t('guides.comingSoon')}</Text>
            <Text style={styles.comingSoonText}>
              {t('guides.comingSoonText')}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <Ionicons name="information-circle" size={24} color="#00A86B" />
            <Text style={styles.footerText}>{t('guides.needHelp')}</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: '#E0F5EC',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  stepCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  arabicCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  arabicText: {
    fontSize: 20,
    color: '#1A1A1A',
    textAlign: 'right',
    fontWeight: '500',
  },
  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    marginTop: 24,
  },
  footerCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
});
