import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "RoleSelect">;

export function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Tienda Pay</Text>
        <Text style={styles.title}>Elige cómo vas a usar la app</Text>
        <Text style={styles.subtitle}>Puedes cobrar como comercio o pagar desde tu wallet personal.</Text>
      </View>

      <Pressable style={styles.button} onPress={() => navigation.navigate("Comercio")}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>C</Text>
        </View>
        <View style={styles.buttonCopy}>
          <Text style={styles.buttonText}>Soy el comercio</Text>
          <Text style={styles.buttonHint}>Generar cobros, QR y seguimiento onchain.</Text>
        </View>
      </Pressable>

      <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => navigation.navigate("PersonaHome")}>
        <View style={[styles.iconBox, styles.iconBoxSecondary]}>
          <Text style={styles.iconText}>P</Text>
        </View>
        <View style={styles.buttonCopy}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Soy la persona</Text>
          <Text style={[styles.buttonHint, styles.buttonHintSecondary]}>Ver balance y pagar escaneando un QR.</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 22, gap: 14, backgroundColor: "#07111f" },
  header: { marginBottom: 20 },
  kicker: { color: "#65e4c4", fontSize: 14, fontWeight: "900", marginBottom: 8 },
  title: { color: "#f8fafc", fontSize: 32, lineHeight: 38, fontWeight: "900" },
  subtitle: { color: "#9aa7ba", fontSize: 15, lineHeight: 21, marginTop: 10 },
  button: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  buttonSecondary: { backgroundColor: "#10233a" },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: "#ffcf5a",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSecondary: { backgroundColor: "#65e4c4" },
  iconText: { color: "#07111f", fontSize: 18, fontWeight: "900" },
  buttonCopy: { flex: 1 },
  buttonText: { color: "#07111f", fontSize: 17, fontWeight: "900" },
  buttonTextSecondary: { color: "#f8fafc" },
  buttonHint: { color: "#526071", fontSize: 13, marginTop: 4, lineHeight: 18 },
  buttonHintSecondary: { color: "#b8c4d6" },
});
