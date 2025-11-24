import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { HomeScreen } from "./src/screens/HomeScreen";
import { DhikrScreen } from "./src/screens/DhikrScreen";
import { TasbihScreen } from "./src/screens/TasbihScreen";
import { GuideScreen } from "./src/screens/GuideScreen";
import { StatsScreen } from "./src/screens/StatsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SettingsProvider } from "./src/context/SettingsContext";

export type RootTabParamList = {
  Home: undefined;
  Dhikr: undefined;
  Tasbih: undefined;
  Guide: undefined;
  Stats: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <SettingsProvider>
      <NavigationContainer>
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
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === "Home") {
                iconName = "home-outline";
              } else if (route.name === "Dhikr") {
                iconName = "book-outline";
              } else if (route.name === "Tasbih") {
                iconName = "ellipse-outline";
              } else if (route.name === "Guide") {
                iconName = "school-outline";
              } else if (route.name === "Stats") {
                iconName = "stats-chart-outline";
              } else {
                iconName = "settings-outline";
              }

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
      </NavigationContainer>
    </SettingsProvider>
  );
}
