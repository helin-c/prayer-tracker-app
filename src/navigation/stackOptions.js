import { CardStyleInterpolators } from '@react-navigation/stack';

export const GUARANTEED_STACK_OPTIONS = {
  headerShown: false,
  // 1. Solid background for the card itself prevents see-through issues
  cardStyle: { backgroundColor: '#5BA895' },
  
  // 2. Standard iOS horizontal slide looks best
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  
  // 3. Disable overlay to prevent dimming issues during transition
  cardOverlayEnabled: false,
  
  // 4. Performance settings
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  
  // 5. CRITICAL: Keeps previous screen visible underneath during transition
  // This prevents the "void" flash.
  detachPreviousScreen: false, 
};