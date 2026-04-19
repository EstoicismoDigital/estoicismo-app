import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Target, DollarSign, Brain, Rocket } from "lucide-react-native";
import { colors, fontFamilies, fontSizes } from "@estoicismo/ui";

const TAB_ICON_SIZE = 24;
const STROKE = 1.5;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilies.mono,
          fontSize: fontSizes.xs - 1,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="habitos"
        options={{
          title: "Hábitos",
          tabBarIcon: ({ color }) => (
            <Target size={TAB_ICON_SIZE} color={color} strokeWidth={STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="finanzas"
        options={{
          title: "Finanzas",
          tabBarIcon: ({ color }) => (
            <DollarSign size={TAB_ICON_SIZE} color={color} strokeWidth={STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="mente"
        options={{
          title: "Mente",
          tabBarIcon: ({ color }) => (
            <Brain size={TAB_ICON_SIZE} color={color} strokeWidth={STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="emprende"
        options={{
          title: "Emprende",
          tabBarIcon: ({ color }) => (
            <Rocket size={TAB_ICON_SIZE} color={color} strokeWidth={STROKE} />
          ),
        }}
      />
    </Tabs>
  );
}
