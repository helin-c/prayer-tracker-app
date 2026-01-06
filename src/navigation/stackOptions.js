import { CardStyleInterpolators } from '@react-navigation/stack';

export const GUARANTEED_STACK_OPTIONS = {
  headerShown: false,
  cardStyle: { backgroundColor: '#F0FFF4' }, 
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  cardOverlayEnabled: false,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  detachPreviousScreen: false,
  
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 250, 
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
      },
    },
  },
};