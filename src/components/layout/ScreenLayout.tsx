// ============================================================================
// FILE: src/components/layout/ScreenLayout.tsx
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
    backgroundImage || require('../../assets/images/illustrations/background.png');

  return (
    <View style={styles.container}>
      <ImageBackground
        source={imageSource}
        style={styles.backgroundImage}
        resizeMode="cover"
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
    backgroundColor: '#5BA895', 
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
});