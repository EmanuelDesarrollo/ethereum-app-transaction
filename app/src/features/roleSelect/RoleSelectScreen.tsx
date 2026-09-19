import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "RoleSelect">;

export function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>tienda-stablecoin-pay</Text>
      <Text style={styles.subtitle}>¿Con qué rol vas a entrar?</Text>

      <Pressable style={styles.button} onPress={() => navigation.navigate("Comercio")}>
        <Text style={styles.buttonText}>Soy el comercio</Text>
        <Text style={styles.buttonHint}>Cobrar con el agente</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => navigation.navigate("PersonaHome")}>
        <Text style={styles.buttonText}>Soy la persona</Text>
        <Text style={styles.buttonHint}>Pagar escaneando un QR</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: "center", color: "#555", marginBottom: 24 },
  button: { backgroundColor: "#1a1a2e", padding: 20, borderRadius: 12, alignItems: "center" },
  buttonSecondary: { backgroundColor: "#0f766e" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  buttonHint: { color: "#d1d1e0", fontSize: 13, marginTop: 4 },
});
