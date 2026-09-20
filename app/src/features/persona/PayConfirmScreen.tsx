import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { getOrCreateAccount, payCheckout, formatStablecoinAmount } from "../../core/wallet/walletService";
import { registrarMovimiento } from "../historial/ledger";
import { getSession } from "../../core/session";
import { HSK_EXPLORER_URL } from "../../core/config";

type Props = NativeStackScreenProps<RootStackParamList, "PayConfirm">;

type PayState = { status: "idle" } | { status: "paying" } | { status: "done"; txHash: string } | { status: "error"; message: string };

export function PayConfirmScreen({ route, navigation }: Props) {
  const { payload } = route.params;
  const [state, setState] = useState<PayState>({ status: "idle" });

  const montoLegible = formatStablecoinAmount(BigInt(payload.amount));

  const confirmarPago = async () => {
    setState({ status: "paying" });
    try {
      const session = await getSession();
      if (!session) throw new Error("No hay sesión activa; vuelve a iniciar sesión.");
      const account = await getOrCreateAccount(session.userId);
      const txHash = await payCheckout(account, payload);
      await registrarMovimiento({
        tipo: "pago",
        monto: Number(payload.amount) / 10 ** payload.decimals,
        moneda: "mUSDC",
        nota: payload.nota,
        txHash,
        orderId: payload.orderId,
      });
      setState({ status: "done", txHash });
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vas a pagar</Text>
      <Text style={styles.monto}>${montoLegible}</Text>
      {payload.nota ? <Text style={styles.nota}>{payload.nota}</Text> : null}

      <Text style={styles.label}>A</Text>
      <Text style={styles.address} numberOfLines={1}>
        {payload.to}
      </Text>

      {state.status === "error" ? <Text style={styles.error}>{state.message}</Text> : null}

      {state.status === "done" ? (
        <View style={styles.doneBox}>
          <Text style={styles.doneText}>✓ Pago enviado</Text>
          <Pressable onPress={() => Linking.openURL(`${HSK_EXPLORER_URL}/tx/${state.txHash}`)}>
            <Text style={[styles.txHash, styles.txHashLink]} numberOfLines={1}>
              {state.txHash}
            </Text>
          </Pressable>
          <Text style={styles.txHashHint}>Toca el hash para verlo en el explorador</Text>
          <Pressable style={styles.button} onPress={() => navigation.popToTop()}>
            <Text style={styles.buttonText}>Listo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={confirmarPago} disabled={state.status === "paying"}>
          {state.status === "paying" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirmar y pagar</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  label: { fontSize: 13, color: "#666", marginTop: 16 },
  monto: { fontSize: 40, fontWeight: "700" },
  nota: { fontSize: 15, color: "#444", marginTop: 4 },
  address: { fontSize: 14, fontFamily: "monospace" },
  error: { color: "#b91c1c", marginTop: 16 },
  button: { backgroundColor: "#0f766e", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 32 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  doneBox: { marginTop: 32, alignItems: "center", gap: 8 },
  doneText: { fontSize: 22, fontWeight: "700", color: "#0f766e" },
  txHash: { fontSize: 12, fontFamily: "monospace", color: "#666" },
  txHashLink: { textDecorationLine: "underline" },
  txHashHint: { fontSize: 11, color: "#999" },
});
