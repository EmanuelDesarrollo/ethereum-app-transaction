import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { usePersonaWallet } from "./usePersonaWallet";

type Props = NativeStackScreenProps<RootStackParamList, "PersonaHome">;

export function PersonaHomeScreen({ navigation }: Props) {
  const { account, balance, loading, busy, error, requestTestFunds } = usePersonaWallet();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Preparando tu wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tu wallet (no-custodial)</Text>
      <Text style={styles.address} numberOfLines={1}>
        {account?.address}
      </Text>

      <Text style={styles.balanceLabel}>Balance mUSDC</Text>
      <Text style={styles.balance}>{balance ?? "—"}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, styles.buttonSecondary]} onPress={requestTestFunds} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pedir fondos de prueba</Text>}
      </Pressable>

      <Pressable style={styles.button} onPress={() => navigation.navigate("Scan")}>
        <Text style={styles.buttonText}>Escanear QR para pagar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff" },
  label: { fontSize: 13, color: "#666", marginTop: 8 },
  address: { fontSize: 14, fontFamily: "monospace", marginBottom: 16 },
  balanceLabel: { fontSize: 13, color: "#666" },
  balance: { fontSize: 36, fontWeight: "700", marginBottom: 24 },
  error: { color: "#b91c1c", marginBottom: 8 },
  button: { backgroundColor: "#0f766e", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonSecondary: { backgroundColor: "#334155" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
