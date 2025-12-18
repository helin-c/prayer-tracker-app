// ============================================================================
// FILE: src/components/loading/SkeletonLoader.jsx (REUSABLE)
// ============================================================================
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Reusable Skeleton Loader Component
 * Usage:
 * <SkeletonLoader width={100} height={20} borderRadius={10} style={...} />
 */
export const SkeletonLoader = ({ 
  width = 100, 
  height = 20, 
  borderRadius = 4,
  style = {},
  animationSpeed = 1000,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: animationSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: animationSpeed,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton Circle (for avatars)
 */
export const SkeletonCircle = ({ size = 50, style = {} }) => (
  <SkeletonLoader 
    width={size} 
    height={size} 
    borderRadius={size / 2} 
    style={style}
  />
);

/**
 * Skeleton Line (for text)
 */
export const SkeletonLine = ({ 
  width = '100%', 
  height = 16, 
  style = {} 
}) => (
  <SkeletonLoader 
    width={width} 
    height={height} 
    borderRadius={height / 2}
    style={style}
  />
);

/**
 * Skeleton Card (for cards with padding)
 */
export const SkeletonCard = ({ children, style = {} }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

// ============================================================================
// USAGE EXAMPLE: FriendProfileScreen Skeleton
// ============================================================================
export const FriendProfileSkeleton = () => (
  <View style={{ padding: 20 }}>
    <SkeletonCard style={{ alignItems: 'center', marginBottom: 20 }}>
      <SkeletonCircle size={100} style={{ marginBottom: 16 }} />
      <SkeletonLine width={180} height={24} style={{ marginBottom: 8 }} />
      <SkeletonLine width={140} height={14} style={{ marginBottom: 20 }} />
      
      <View style={{ flexDirection: 'row', width: '100%', marginTop: 24 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <SkeletonCircle size={32} style={{ marginBottom: 8 }} />
          <SkeletonLine width={40} height={24} style={{ marginBottom: 4 }} />
          <SkeletonLine width={60} height={12} />
        </View>
        <View style={{ width: 1, height: 60, backgroundColor: '#E0E0E0' }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <SkeletonCircle size={32} style={{ marginBottom: 8 }} />
          <SkeletonLine width={40} height={24} style={{ marginBottom: 4 }} />
          <SkeletonLine width={60} height={12} />
        </View>
      </View>
    </SkeletonCard>

    <SkeletonLine width={160} height={18} style={{ marginBottom: 16 }} />
    
    <SkeletonCard>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <SkeletonLine width={30} height={12} style={{ marginBottom: 8 }} />
            <SkeletonCircle size={40} style={{ marginBottom: 4 }} />
            <SkeletonLine width={20} height={10} />
          </View>
        ))}
      </View>
    </SkeletonCard>

    <SkeletonLoader 
      width="100%" 
      height={50} 
      borderRadius={12} 
      style={{ marginTop: 20 }} 
    />
  </View>
);