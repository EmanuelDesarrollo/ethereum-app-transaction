import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { fetchBackendHistory } from "./api";
import { listarMovimientos, type LedgerMovement } from "./ledger";
import { reiniciarTours } from "../onboarding/storage";

export function HistorialScreen() {
  const [items, setItems] = useState<LedgerMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [local, backend] = await Promise.all([listarMovimientos(), fetchBackendHistory()]);
      const byId = new Map<string, LedgerMovement>();
      [...local, ...backend].forEach((item) => byId.set(item.id, item));
      setItems([...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const restartTours = async () => {
    await reiniciarTours();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Pressable style={styles.tourButton} onPress={restartTours}>
          <Ionicons name="help-circle-outline" size={20} color="#08090a" />
          <Text style={styles.tourText}>Ver tutorial otra vez</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={46} color="#9aa0a6" />
          <Text style={styles.emptyTitle}>Aun no hay movimientos</Text>
          <Text style={styles.emptyText}>Tus cobros y pagos apareceran aqui despues de confirmar transacciones.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={[styles.icon, item.tipo === "venta" ? styles.saleIcon : styles.payIcon]}>
                <Ionicons name={item.tipo === "venta" ? "arrow-down" : "arrow-up"} size={22} color="#fff" />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.tipo === "venta" ? "Cobro recibido" : "Pago enviado"}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {item.nota || item.orderId || "Movimiento X-Mate"}
                </Text>
              </View>
              <View style={styles.amountBox}>
                <Text style={styles.amount}>
                  {item.tipo === "venta" ? "+" : "-"}${item.monto.toFixed(2)}
                </Text>
                <Text style={styles.currency}>{item.moneda}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", padding: 22 },
  header: { marginTop: 8, marginBottom: 20, gap: 12 },
  title: { color: "#08090a", fontSize: 34, fontWeight: "900" },
  tourButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#f2f4f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tourText: { color: "#08090a", fontWeight: "900" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  emptyTitle: { color: "#08090a", fontSize: 22, fontWeight: "900", marginTop: 12 },
  emptyText: { color: "#666", textAlign: "center", lineHeight: 20, marginTop: 8 },
  list: { gap: 14, paddingBottom: 120 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f8f8", borderRadius: 8, padding: 14 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  saleIcon: { backgroundColor: "#3f9142" },
  payIcon: { backgroundColor: "#08090a" },
  rowCopy: { flex: 1, marginLeft: 12 },
  rowTitle: { color: "#08090a", fontSize: 16, fontWeight: "900" },
  rowSubtitle: { color: "#777", fontSize: 13, marginTop: 3 },
  amountBox: { alignItems: "flex-end" },
  amount: { color: "#08090a", fontSize: 17, fontWeight: "900" },
  currency: { color: "#777", fontSize: 12, marginTop: 3 },
});
