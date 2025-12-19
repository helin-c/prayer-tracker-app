// @ts-nocheck
// ============================================================================
// FILE: src/screens/guides/GuideDetailScreen.jsx (PRODUCTION READY)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
// REMOVED: SafeAreaView (ScreenLayout handles this)
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// COMPONENT IMPORTS
import { SkeletonLoader, SkeletonLine, SkeletonCircle } from '../../components/loading/SkeletonLoader';

// ... [guideContent object remains exactly the same] ...
const guideContent = {
  prayer: {
    title: 'How to Pray (Salah)',
    description: 'Complete step-by-step guide to performing Islamic prayer',
    sections: [
      // ... content
      {
        id: 1,
        title: 'Prerequisites',
        icon: 'checkbox-outline',
        steps: [
           { title: 'Be in state of Wudu', description: 'Ensure you have performed ablution (Wudu) before prayer.' },
           // ...
        ]
      }
    ],
  },
  // ... wudu content
};

const GuideDetailSkeleton = ({ color }) => {
  const skeletonStyle = { backgroundColor: 'rgba(255, 255, 255, 0.5)' };
  
  return (
    <View style={{ flex: 1 }}>
      {/* Header Skeleton */}
      <View style={{ padding: 20, paddingBottom: 32, backgroundColor: color || '#CCC', opacity: 0.8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
           <SkeletonCircle size={40} style={skeletonStyle} />
           <SkeletonCircle size={56} style={skeletonStyle} />
        </View>
        <SkeletonLine width={200} height={32} style={{ ...skeletonStyle, marginBottom: 8 }} />
        <SkeletonLine width={280} height={16} style={skeletonStyle} />
      </View>

      {/* Content Skeleton */}
      <View style={{ padding: 20 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ marginBottom: 16, backgroundColor: '#FFF', borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <SkeletonCircle size={40} style={{ backgroundColor: '#F0F0F0', marginRight: 12 }} />
              <SkeletonLine width={150} height={20} style={{ backgroundColor: '#F0F0F0' }} />
            </View>
            <SkeletonLine width="100%" height={14} style={{ backgroundColor: '#F0F0F0', marginBottom: 8 }} />
            <SkeletonLine width="80%" height={14} style={{ backgroundColor: '#F0F0F0' }} />
          </View>
        ))}
      </View>
    </View>
  );
};


// ============================================================================
// MAIN SCREEN
// ============================================================================
export const GuideDetailScreen = ({ route, navigation }) => {
  const { guide } = route.params;
  const [expandedSection, setExpandedSection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets(); // Get safe area for manual padding
  
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
    // WRAPPED IN SCREEN LAYOUT
    // IMPORTANT: noPaddingTop={true} allows the gradient header to extend to the very top edge
    <ScreenLayout noPaddingTop={true} noPaddingBottom={true}>
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={guide.gradient}
        style={[
          styles.header, 
          { paddingTop: insets.top + 20 } // Manually apply top padding for status bar
        ]}
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
        contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 } // Manual bottom padding
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
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Removed container background color since layout handles it
  header: {
    padding: 20,
    paddingBottom: 32,
    // paddingTop is handled inline
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
    // paddingBottom handled inline
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