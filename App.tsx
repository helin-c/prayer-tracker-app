// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

// ---- SCREENS ----
import HomeScreen from "./src/screens/home/HomeScreen";
import {DhikrScreen} from "./src/screens/tasbih/DhikrScreen";
import {TasbihScreen} from "./src/screens/tasbih/TasbihScreen";
import {GuideScreen} from "./src/screens/guides/GuideScreen";
import {StatsScreen} from "./src/screens/StatsScreen";
import {SettingsScreen} from "./src/screens/settings/SettingsScreen";
import AuthScreen from "./src/screens/auth/AuthScreen";

// ---- CONTEXTS ----
import { SettingsProvider } from "./src/context/SettingsContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";

// --------- TYPES ---------
export type RootTabParamList = {
  Home: undefined;
  Dhikr: undefined;
  Tasbih: undefined;
  Guide: undefined;
  Stats: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// --------- MAIN TABS ---------
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#020617",
          borderTopColor: "#111827",
        },
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") iconName = "home";
          if (route.name === "Dhikr") iconName = "heart";
          if (route.name === "Tasbih") iconName = "ellipse";
          if (route.name === "Guide") iconName = "book";
          if (route.name === "Stats") iconName = "stats-chart";
          if (route.name === "Settings") iconName = "settings";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dhikr" component={DhikrScreen} />
      <Tab.Screen name="Tasbih" component={TasbihScreen} />
      <Tab.Screen name="Guide" component={GuideScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// --------- ROOT NAV (AUTH ↔ MAIN) ---------
function RootNavigator() {
  const { user, loading } = useAuth();

  // Optional: show nothing while restoring session
  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

// --------- APP ROOT ---------
export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SettingsProvider>
    </AuthProvider>
  );
}
