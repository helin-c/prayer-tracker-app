import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome',
    titleEn: 'As-salamu alaykum',
    subtitle: 'Welcome to Your Spiritual Journey',
    description: 'Track your five daily prayers and build consistent worship habits with our intelligent reminder system',
    icon: 'moon',
    color: '#00A86B',
  },
  {
    id: '2',
    title: 'Never Miss a Prayer',
    subtitle: 'Accurate Prayer Times',
    description: 'Get precise Salah notifications based on your location with multiple calculation methods',
    icon: 'time',
    color: '#00A86B',
  },
  {
    id: '3',
    title: 'Find the Qibla',
    subtitle: 'Always Know the Direction',
    description: 'Built-in Qibla compass using GPS technology to help you pray in the right direction anywhere',
    icon: 'compass',
    color: '#00A86B',
  },
  {
    id: '4',
    title: 'Track Your Progress',
    subtitle: 'Stay Consistent & Motivated',
    description: 'Beautiful statistics, prayer streaks, and achievements to inspire your daily worship',
    icon: 'stats-chart',
    color: '#00A86B',
  },
  {
    id: '5',
    title: 'Learn & Grow',
    subtitle: 'Quran, Duas & Knowledge',
    description: 'Access daily supplications, Quranic verses, and prayer guides in multiple languages',
    icon: 'book',
    color: '#00A86B',
  },
];

export const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    try {
      await storage.setItem('@onboarding_completed', JSON.stringify(true));
      navigation.replace('Login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('Login');
    }
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
          {/* Illustration & Icon */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.illustration}>{item.illustration}</Text>
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={70} color="#FFFFFF" />
            </View>
          </View>


          {/* Title */}
          <Text style={styles.title}>
            {item.titleEn || (!item.title.match(/[\u0600-\u06FF]/) && item.title)}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{item.subtitle}</Text>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Decorative Islamic Pattern */}
          <View style={styles.patternContainer}>
            <Text style={styles.pattern}>✦ ✦ ✦</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const Pagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 24, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: '#00A86B',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Pagination />

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {/* Progress indicator */}
        <Text style={styles.progressText}>
          {currentIndex + 1} of {slides.length}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    width: '100%',
  },
  illustrationContainer: {
    position: 'relative',
    marginBottom: 40,
    alignItems: 'center',
  },
  illustration: {
    fontSize: 100,
    position: 'absolute',
    top: -50,
    opacity: 0.1,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  titleArabic: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00A86B',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00A86B',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  patternContainer: {
    marginTop: 30,
  },
  pattern: {
    fontSize: 18,
    color: '#00A86B',
    opacity: 0.3,
    letterSpacing: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    height: 10,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  nextButton: {
    backgroundColor: '#00A86B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});