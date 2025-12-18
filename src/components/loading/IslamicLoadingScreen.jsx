// ============================================================================
// FILE: src/components/loading/IslamicLoadingScreen.jsx
// ============================================================================
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BACKGROUND_IMAGE = require('../../assets/images/illustrations/background.png');

export const IslamicLoadingScreen = ({ message, submessage }) => {
  // Create multiple animated values for falling crescents
  const crescent1 = useRef(new Animated.Value(0)).current;
  const crescent2 = useRef(new Animated.Value(0)).current;
  const crescent3 = useRef(new Animated.Value(0)).current;
  
  const opacity1 = useRef(new Animated.Value(0)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const opacity3 = useRef(new Animated.Value(0)).current;
  
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const rotate3 = useRef(new Animated.Value(0)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const backgroundSource = useMemo(() => BACKGROUND_IMAGE, []);

  useEffect(() => {
    // Pulse animation for the center icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Crescent 1 animation - falling and swinging
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(crescent1, {
            toValue: 1,
            duration: 2500,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            useNativeDriver: true,
          }),
          Animated.timing(opacity1, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(crescent1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotate1, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(rotate1, {
              toValue: 0,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ])
    ).start();

    // Crescent 2 animation - delayed
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity2, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(crescent2, {
              toValue: 1,
              duration: 2500,
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              useNativeDriver: true,
            }),
            Animated.timing(opacity2, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(crescent2, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.sequence([
              Animated.timing(rotate2, {
                toValue: 1,
                duration: 900,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(rotate2, {
                toValue: 0,
                duration: 900,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          ),
        ])
      ).start();
    }, 800);

    // Crescent 3 animation - more delayed
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity3, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(crescent3, {
              toValue: 1,
              duration: 2500,
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              useNativeDriver: true,
            }),
            Animated.timing(opacity3, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(crescent3, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.sequence([
              Animated.timing(rotate3, {
                toValue: 1,
                duration: 700,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(rotate3, {
                toValue: 0,
                duration: 700,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          ),
        ])
      ).start();
    }, 1600);
  }, []);

  const translateY1 = crescent1.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });

  const translateY2 = crescent2.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });

  const translateY3 = crescent3.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });

  const rotateZ1 = rotate1.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const rotateZ2 = rotate2.interpolate({
    inputRange: [0, 1],
    outputRange: ['-20deg', '20deg'],
  });

  const rotateZ3 = rotate3.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.container}
      resizeMode="cover"
      // EKSTRA OPTİMİZASYONLAR:
      defaultSource={backgroundSource} // iOS için
      loadingIndicatorSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
    >
      {/* Falling Crescents */}
      <Animated.View
        style={[
          styles.crescentContainer,
          {
            left: '20%',
            opacity: opacity1,
            transform: [
              { translateY: translateY1 },
              { rotate: rotateZ1 },
            ],
          },
        ]}
      >
        <View style={styles.rope} />
        <View style={styles.crescentWrapper}>
          <Ionicons name="moon" size={32} color="#719782" />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.crescentContainer,
          {
            left: '50%',
            opacity: opacity2,
            transform: [
              { translateY: translateY2 },
              { rotate: rotateZ2 },
            ],
          },
        ]}
      >
        <View style={styles.rope} />
        <View style={styles.crescentWrapper}>
          <Ionicons name="moon" size={28} color="#719782" />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.crescentContainer,
          {
            left: '75%',
            opacity: opacity3,
            transform: [
              { translateY: translateY3 },
              { rotate: rotateZ3 },
            ],
          },
        ]}
      >
        <View style={styles.rope} />
        <View style={styles.crescentWrapper}>
          <Ionicons name="moon" size={36} color="#719782" />
        </View>
      </Animated.View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="time-outline" size={56} color="#719782" />
        </Animated.View>

        <Text style={styles.loadingText}>{message || 'Loading...'}</Text>
        {submessage && <Text style={styles.subText}>{submessage}</Text>}

        {/* Animated dots */}
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.15],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.15],
                  outputRange: [0.5, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.15],
                  outputRange: [0.7, 1],
                }),
              },
            ]}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C5DDD0', 
  },
  crescentContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  rope: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(113, 151, 130, 0.3)',
    marginBottom: 4,
  },
  crescentWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  centerContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 40,
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(113, 151, 130, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#719782',
  },
});