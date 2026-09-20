import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthScreen } from "../features/auth/AuthScreen";
import { MainTabs } from "./MainTabs";
import { ScanScreen } from "../features/persona/ScanScreen";
import { PayConfirmScreen } from "../features/persona/PayConfirmScreen";
import type { CheckoutPayload } from "../core/api/types";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Scan: undefined;
  PayConfirm: { payload: CheckoutPayload };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: "Escanear QR" }} />
        <Stack.Screen name="PayConfirm" component={PayConfirmScreen} options={{ title: "Confirmar pago" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
