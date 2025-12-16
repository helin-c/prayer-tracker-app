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
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { storage } from '../../services/storage';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome',
    titleArabic: '',
    titleEn: 'As-salamu alaykum',
    subtitle: 'Your Spiritual Journey',
    description: 'Track five daily prayers and build consistent worship habits',
    icon: 'moon',
    iconSecondary: 'star',
    gradient: ['#1A4D3E', '#2D7A5F'],
    accentColor: '#3FD290',
  },
  {
    id: '2',
    title: 'Prayer Times',
    subtitle: 'Never Miss a Prayer',
    description: 'Precise Salah notifications based on your location',
    icon: 'time-outline',
    iconSecondary: 'notifications-outline',
    gradient: ['#1A4D3E', '#2D7A5F'],
    accentColor: '#3FD290',
  },
  {
    id: '3',
    title: 'Qibla Finder',
    subtitle: 'Always Know the Direction',
    description: 'Built-in compass using GPS technology',
    icon: 'compass-outline',
    iconSecondary: 'navigate-outline',
    gradient: ['#1A4D3E', '#2D7A5F'],
    accentColor: '#3FD290',
  },
  {
    id: '4',
    title: 'Track Progress',
    subtitle: 'Stay Consistent',
    description: 'Beautiful statistics and prayer streaks',
    icon: 'trending-up-outline',
    iconSecondary: 'flame-outline',
    gradient: ['#1A4D3E', '#2D7A5F'],
    accentColor: '#3FD290',
  },
  {
    id: '5',
    title: 'Learn & Grow',
    subtitle: 'Quran & Duas',
    description: 'Daily supplications and Quranic verses',
    icon: 'book-outline',
    iconSecondary: 'heart-outline',
    gradient: ['#1A4D3E', '#2D7A5F'],
    accentColor: '#3FD290',
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
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [30, 0, 30],
      extrapolate: 'clamp',
    });

    const iconRotate = scrollX.interpolate({
      inputRange,
      outputRange: ['-15deg', '0deg', '15deg'],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity, 
              transform: [{ scale }, { translateY }] 
            }
          ]}
        >
          {/* Modern Icon Container with Dynamic Colors */}
          <Animated.View 
            style={[
              styles.iconWrapper,
              { transform: [{ rotate: iconRotate }] }
            ]}
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              {/* Primary Icon */}
              <View style={styles.primaryIcon}>
                <Ionicons name={item.icon} size={48} color="#FFFFFF" />
              </View>
              
              {/* Floating Secondary Icon */}
              <View style={styles.secondaryIcon}>
                <View style={styles.secondaryIconBg}>
                  <Ionicons 
                    name={item.iconSecondary} 
                    size={20} 
                    color={item.accentColor} 
                  />
                </View>
              </View>

              {/* Glowing Particles */}
              <View style={[styles.particle, styles.particle1, { backgroundColor: item.accentColor }]} />
              <View style={[styles.particle, styles.particle2, { backgroundColor: item.accentColor }]} />
              <View style={[styles.particle, styles.particle3, { backgroundColor: item.accentColor }]} />
            </LinearGradient>
          </Animated.View>

          {/* Content */}
          <View style={styles.textContent}>
            {/* Arabic Title (for first slide) */}
            {item.titleArabic && (
              <Text style={styles.titleArabic}>
                {item.titleArabic}
              </Text>
            )}

            {/* Main Title */}
            <Text style={styles.title}>
              {item.titleEn || item.title}
            </Text>

            {/* Subtitle with Accent */}
            <View style={styles.subtitleContainer}>
              <View style={[styles.accentLine, { backgroundColor: item.accentColor }]} />
              <Text style={styles.subtitle}>
                {item.subtitle}
              </Text>
              <View style={[styles.accentLine, { backgroundColor: item.accentColor }]} />
            </View>

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((item, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const isActive = index === currentIndex;

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                isActive && styles.paginationDotActive,
                {
                  opacity: dotOpacity,
                  transform: [{ scale: dotScale }],
                  backgroundColor: isActive ? item.accentColor : 'rgba(255,255,255,0.3)',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const currentSlide = slides[currentIndex];

  return (
    <ImageBackground
      source={require('../../assets/images/illustrations/background.jpeg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* No Overlay - Full Background Image Visible */}

      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Skip Button */}
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <View style={styles.skipButtonInner}>
              <Text style={styles.skipText}>Skip</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <View style={styles.slidesContainer}>
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
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomContainer}>
          {/* Pagination */}
          <Pagination />

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Progress Indicator */}
            <View style={styles.progressIndicator}>
              <Text style={styles.progressText}>
                {currentIndex + 1}/{slides.length}
              </Text>
            </View>

            {/* Next/Get Started Button - Dynamic Colors */}
            <TouchableOpacity
              style={styles.nextButtonWrapper}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={currentSlide.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>
                  {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
                </Text>
                <View style={[styles.nextButtonIcon, { backgroundColor: currentSlide.accentColor + '33' }]}>
                  <Ionicons 
                    name={currentIndex === slides.length - 1 ? "checkmark" : "arrow-forward"} 
                    size={18} 
                    color="#FFFFFF" 
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // ========== SKIP BUTTON ==========
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 16,
    right: 20,
    zIndex: 10,
  },
  skipButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  skipText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ========== SLIDES ==========
  slidesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 60,
  },

  // ========== ICON CONTAINER ==========
  iconWrapper: {
    marginBottom: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  primaryIcon: {
    zIndex: 2,
  },
  secondaryIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 3,
  },
  secondaryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // ========== PARTICLES ==========
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  particle1: {
    top: 10,
    left: -4,
  },
  particle2: {
    bottom: 15,
    right: 8,
    width: 4,
    height: 4,
  },
  particle3: {
    top: 50,
    right: -6,
    width: 5,
    height: 5,
  },

  // ========== TEXT CONTENT ==========
  textContent: {
    alignItems: 'center',
    width: '100%',
  },
  titleArabic: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  accentLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
    opacity: 0.8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.90)',
    textAlign: 'center',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.2,
    maxWidth: 280,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ========== BOTTOM CONTROLS ==========
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
    gap: 24,
  },

  // ========== PAGINATION ==========
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 32,
    height: 8,
    borderRadius: 4,
  },

  // ========== ACTIONS ==========
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  nextButtonWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nextButtonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});