// ============================================================================
// FILE: src/components/layout/ScreenLayout.tsx (FIXED)
// ============================================================================
import React from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPaddingTop?: boolean;
  noPaddingBottom?: boolean;
  backgroundImage?: ImageSourcePropType;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  style,
  noPaddingTop = false,
  noPaddingBottom = false,
  backgroundImage,
}) => {
  const insets = useSafeAreaInsets();
  
  const imageSource =
    backgroundImage || require('../../assets/images/illustrations/bg.png');
  
  return (
    <View style={styles.container}>
      <ImageBackground
        source={imageSource}
        style={styles.backgroundImage}
        resizeMode="cover"
        // ✅ ADD THIS: Fade in the image smoothly
        fadeDuration={0}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: noPaddingTop ? 0 : insets.top,
              paddingBottom: noPaddingBottom ? 0 : insets.bottom,
            },
            style,
          ]}
        >
          {children}
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FFF4', // ✅ CHANGED: Match your app background!
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F0FFF4', // ✅ ADDED: Match while image loads
  },
  content: {
    flex: 1,
  },
});