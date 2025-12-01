import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Sample guide content structure
const guideContent = {
  prayer: {
    title: 'How to Pray (Salah)',
    description: 'Complete step-by-step guide to performing Islamic prayer',
    sections: [
      {
        id: 1,
        title: 'Prerequisites',
        icon: 'checkbox-outline',
        steps: [
          {
            title: 'Be in state of Wudu',
            description: 'Ensure you have performed ablution (Wudu) before prayer.',
          },
          {
            title: 'Face the Qibla',
            description: 'Stand facing the direction of Kaaba in Makkah.',
          },
          {
            title: 'Have proper intention (Niyyah)',
            description: 'Make the intention in your heart for which prayer you are performing.',
          },
        ],
      },
      {
        id: 2,
        title: 'Prayer Steps',
        icon: 'list-outline',
        steps: [
          {
            title: '1. Takbir (Opening)',
            description: 'Raise your hands to ear level and say "Allahu Akbar" (Allah is the Greatest).',
            arabic: 'اللَّهُ أَكْبَرُ',
          },
          {
            title: '2. Al-Fatihah',
            description: 'Recite Surah Al-Fatihah (the Opening chapter of the Quran).',
            arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
          },
          {
            title: '3. Ruku (Bowing)',
            description: 'Bow down with hands on knees and say "Subhana Rabbiyal Azeem" (Glory to my Lord, the Most Great).',
            arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
          },
          {
            title: '4. Sujud (Prostration)',
            description: 'Prostrate with forehead, nose, both hands, knees and toes touching the ground.',
            arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
          },
        ],
      },
    ],
  },
  wudu: {
    title: 'Wudu (Ablution)',
    description: 'Ritual purification before prayer',
    sections: [
      {
        id: 1,
        title: 'Steps of Wudu',
        icon: 'water',
        steps: [
          {
            title: '1. Make Intention (Niyyah)',
            description: 'Intend in your heart to perform Wudu for purification.',
          },
          {
            title: '2. Say Bismillah',
            description: 'Begin by saying "Bismillah" (In the name of Allah).',
            arabic: 'بِسْمِ اللَّهِ',
          },
          {
            title: '3. Wash Hands',
            description: 'Wash both hands up to the wrists three times.',
          },
          {
            title: '4. Rinse Mouth',
            description: 'Rinse your mouth three times, swirling water.',
          },
          {
            title: '5. Clean Nose',
            description: 'Sniff water into your nose and blow it out, three times.',
          },
          {
            title: '6. Wash Face',
            description: 'Wash your entire face three times, from forehead to chin.',
          },
          {
            title: '7. Wash Arms',
            description: 'Wash right arm from wrist to elbow three times, then left arm.',
          },
          {
            title: '8. Wipe Head',
            description: 'Wipe your head once with wet hands.',
          },
          {
            title: '9. Clean Ears',
            description: 'Clean inside and behind ears with wet fingers.',
          },
          {
            title: '10. Wash Feet',
            description: 'Wash right foot up to ankle three times, then left foot.',
          },
        ],
      },
    ],
  },
  // Add more guide content here
};

export const GuideDetailScreen = ({ route, navigation }) => {
  const { guide } = route.params;
  const [expandedSection, setExpandedSection] = useState(null);
  
  const content = guideContent[guide.id] || {
    title: guide.title,
    description: guide.subtitle,
    sections: [],
  };

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={guide.gradient}
        style={styles.header}
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

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
                <View style={[styles.sectionIcon, { backgroundColor: guide.color }]}>
                  <Ionicons name={section.icon} size={20} color="#FFF" />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Ionicons
                name={
                  expandedSection === section.id
                    ? 'chevron-up'
                    : 'chevron-down'
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
                    <Text style={styles.stepDescription}>{step.description}</Text>
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

        {/* Placeholder for guides without content */}
        {content.sections.length === 0 && (
          <View style={styles.comingSoon}>
            <Ionicons name="construct" size={64} color="#CCC" />
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              This guide is being prepared. Check back later for detailed content.
            </Text>
          </View>
        )}

        {/* Footer Help */}
        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <Ionicons name="information-circle" size={24} color="#00A86B" />
            <Text style={styles.footerText}>
              Need more help? Visit our community forum or contact an imam for
              guidance.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFF',
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
    backgroundColor: '#E8F5E9',
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