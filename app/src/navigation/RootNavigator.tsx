import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RoleSelectScreen } from "../features/roleSelect/RoleSelectScreen";
import { ComercioScreen } from "../features/comercio/ComercioScreen";
import { PersonaHomeScreen } from "../features/persona/PersonaHomeScreen";
import { ScanScreen } from "../features/persona/ScanScreen";
import { PayConfirmScreen } from "../features/persona/PayConfirmScreen";
import type { CheckoutPayload } from "../core/api/types";

export type RootStackParamList = {
  RoleSelect: undefined;
  Comercio: undefined;
  PersonaHome: undefined;
  Scan: undefined;
  PayConfirm: { payload: CheckoutPayload };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RoleSelect">
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "Elige tu rol" }} />
        <Stack.Screen name="Comercio" component={ComercioScreen} options={{ title: "Cobrar" }} />
        <Stack.Screen name="PersonaHome" component={PersonaHomeScreen} options={{ title: "Mi wallet" }} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: "Escanear QR" }} />
        <Stack.Screen name="PayConfirm" component={PayConfirmScreen} options={{ title: "Confirmar pago" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
