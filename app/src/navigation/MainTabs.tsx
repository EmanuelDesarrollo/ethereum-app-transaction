import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccountTheme } from "../core/accountTheme";
import { ComercioScreen } from "../features/comercio/ComercioScreen";
import { GuiaButton } from "../features/guia/GuiaButton";
import { HistorialScreen } from "../features/historial/HistorialScreen";
import { TourProvider } from "../features/onboarding/TourProvider";
import { PersonaHomeScreen } from "../features/persona/PersonaHomeScreen";

export type MainTabParamList = {
  Cobrar: undefined;
  Pagar: undefined;
  Historial: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const theme = useAccountTheme();
  const bottomPadding = Math.max(insets.bottom, 14);

  return (
    <TourProvider>
      <Tab.Navigator
        initialRouteName="Pagar"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: "#777",
          tabBarStyle: {
            height: 58 + bottomPadding,
            paddingTop: 8,
            paddingBottom: bottomPadding,
            borderTopWidth: 0,
            backgroundColor: "#fff",
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "900" },
          tabBarIcon: ({ color, size }) => {
            const icon =
              route.name === "Cobrar" ? "qr-code-outline" : route.name === "Pagar" ? "wallet-outline" : "receipt-outline";
            return <Ionicons name={icon} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Cobrar" component={ComercioScreen} />
        <Tab.Screen name="Pagar" component={PersonaHomeScreen} />
        <Tab.Screen name="Historial" component={HistorialScreen} />
      </Tab.Navigator>
      <GuiaButton />
    </TourProvider>
  );
}
