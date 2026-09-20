import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useComercioAgent } from "./useComercioAgent";
import { TourTarget } from "../onboarding/TourTarget";
import { useAutoTour } from "../onboarding/useAutoTour";
import { HSK_EXPLORER_URL } from "../../core/config";
import { formatStablecoinAmount } from "../../core/wallet/walletService";

export function ComercioScreen() {
  useAutoTour("cobrar");
  const { messages, send, crearCobro, limpiarCobro, sending, error, cobro, cobroStatus, cobroTxHash } =
    useComercioAgent();
  const [texto, setTexto] = useState("");
  const [monto, setMonto] = useState("15");
  const [nota, setNota] = useState("Camisa azul");

  const enviar = () => {
    if (!texto.trim() || sending) return;
    send(texto.trim());
    setTexto("");
  };

  const generarQr = () => {
    const valor = Number(monto.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0 || sending) return;
    crearCobro({ monto: valor, moneda: "USDC", nota: nota.trim() || "Cobro demo" });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.chat}
        contentContainerStyle={[styles.chatContent, messages.length === 0 && styles.chatContentCentered]}
      >
        {!cobro ? (
          <>
            <TourTarget name="cobrar-generador">
              <View style={styles.generatorCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.generatorTitle}>Generar QR de cobro</Text>
                </View>
                <Text style={styles.generatorSubtitle}>Crea un cobro EIP-681 para que cualquier wallet lo escanee.</Text>
                <View style={styles.generatorRow}>
                  <TextInput
                    style={[styles.generatorInput, styles.amountInput]}
                    value={monto}
                    onChangeText={setMonto}
                    placeholder="Monto"
                    keyboardType="decimal-pad"
                    editable={!sending}
                  />
                  <View style={styles.currencyPill}>
                    <Text style={styles.currencyText}>USDC</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.generatorInput}
                  value={nota}
                  onChangeText={setNota}
                  placeholder="Nota del cobro"
                  editable={!sending}
                />
                <Pressable style={styles.generateButton} onPress={generarQr} disabled={sending}>
                  {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateButtonText}>Generar QR</Text>}
                </Pressable>
              </View>
            </TourTarget>

            {messages.length === 0 ? (
              <Text style={styles.hint}>
                También puedes escribirle al agente: "cóbrale 15 dólares a Ana por la camisa azul"
              </Text>
            ) : null}
            {messages.map((m, i) => (
              <View key={i} style={[styles.bubble, m.from === "comercio" ? styles.bubbleComercio : styles.bubbleAgente]}>
                <Text style={m.from === "comercio" ? styles.bubbleTextComercio : styles.bubbleTextAgente}>{m.text}</Text>
              </View>
            ))}
          </>
        ) : cobroStatus === "confirmed" ? (
          <CobroExitoso
            monto={cobro.payload.amount}
            nota={cobro.payload.nota}
            txHash={cobroTxHash}
            onVolver={limpiarCobro}
          />
        ) : (
          <TourTarget name="cobrar-qr">
            <View style={styles.qrBox}>
              <Pressable style={styles.backButton} onPress={limpiarCobro}>
                <Ionicons name="chevron-back" size={22} color="#08090a" />
                <Text style={styles.backText}>Regresar</Text>
              </Pressable>
              <Text style={styles.qrTitle}>QR listo para cobrar</Text>
              <Image source={{ uri: cobro.qrDataUrl }} style={styles.qr} />
              <Text style={styles.qrHint}>La persona lo escanea desde su wallet o desde la app.</Text>
              <Text style={styles.qrMeta} numberOfLines={1}>
                {cobro.payload.amount} unidades hacia {cobro.payload.to}
              </Text>
              {cobroStatus === "pending" ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator />
                  <Text style={styles.statusText}>Esperando pago...</Text>
                </View>
              ) : null}
            </View>
          </TourTarget>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {!cobro ? (
        <TourTarget name="cobrar-input" style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe el cobro..."
            onSubmitEditing={enviar}
            editable={!sending}
          />
          <Pressable style={styles.sendButton} onPress={enviar} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Enviar</Text>}
          </Pressable>
        </TourTarget>
      ) : null}
    </KeyboardAvoidingView>
  );
}

interface CobroExitosoProps {
  monto: string;
  nota: string;
  txHash: `0x${string}` | undefined;
  onVolver: () => void;
}

function CobroExitoso({ monto, nota, txHash, onVolver }: CobroExitosoProps) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 60 }).start();
  }, [scale]);

  const montoLegible = formatStablecoinAmount(BigInt(monto));

  return (
    <View style={styles.exitoBox}>
      <Animated.View style={[styles.exitoCheckCircle, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark" size={56} color="#fff" />
      </Animated.View>
      <Text style={styles.exitoTitulo}>¡Pago recibido!</Text>
      <Text style={styles.exitoMonto}>${montoLegible} mUSDC</Text>
      {nota ? <Text style={styles.exitoNota}>{nota}</Text> : null}
      {txHash ? (
        <Pressable onPress={() => Linking.openURL(`${HSK_EXPLORER_URL}/tx/${txHash}`)}>
          <Text style={styles.exitoTxHash} numberOfLines={1}>
            Ver transacción real en el explorador
          </Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.exitoBoton} onPress={onVolver}>
        <Text style={styles.exitoBotonTexto}>Volver al inicio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f8f7" },
  chat: { flex: 1 },
  chatContent: { padding: 16, gap: 10 },
  chatContentCentered: { flexGrow: 1, justifyContent: "center" },
  generatorCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e6ebef",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  generatorTitle: { color: "#08090a", fontSize: 22, fontWeight: "900" },
  generatorSubtitle: { color: "#646b72", fontSize: 13, lineHeight: 18 },
  generatorRow: { flexDirection: "row", gap: 10 },
  generatorInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#dfe5e8",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    color: "#08090a",
  },
  amountInput: { flex: 1 },
  currencyPill: {
    minWidth: 78,
    borderRadius: 8,
    backgroundColor: "#08090a",
    alignItems: "center",
    justifyContent: "center",
  },
  currencyText: { color: "#fff", fontWeight: "900" },
  generateButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#08090a",
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  hint: { color: "#888", textAlign: "center", marginTop: 40 },
  bubble: { padding: 12, borderRadius: 12, maxWidth: "85%" },
  bubbleComercio: { backgroundColor: "#1a1a2e", alignSelf: "flex-end" },
  bubbleAgente: { backgroundColor: "#f1f5f9", alignSelf: "flex-start" },
  bubbleTextComercio: { color: "#fff" },
  bubbleTextAgente: { color: "#1a1a2e" },
  qrBox: {
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6ebef",
  },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 4 },
  backText: { color: "#08090a", fontSize: 15, fontWeight: "900" },
  qrTitle: { color: "#08090a", fontSize: 20, fontWeight: "900" },
  qr: { width: 240, height: 240 },
  qrHint: { color: "#666", fontSize: 13, textAlign: "center" },
  qrMeta: { color: "#9aa0a6", fontSize: 11, maxWidth: "100%" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  statusText: { color: "#666" },
  exitoBox: {
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e6ebef",
  },
  exitoCheckCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  exitoTitulo: { color: "#08090a", fontSize: 24, fontWeight: "900" },
  exitoMonto: { color: "#0f766e", fontSize: 20, fontWeight: "900", marginTop: 4 },
  exitoNota: { color: "#646b72", fontSize: 14, marginTop: 2 },
  exitoTxHash: { color: "#2f80ed", fontSize: 13, fontWeight: "700", marginTop: 12, textDecorationLine: "underline" },
  exitoBoton: {
    minHeight: 48,
    minWidth: 200,
    borderRadius: 8,
    backgroundColor: "#08090a",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  exitoBotonTexto: { color: "#fff", fontSize: 15, fontWeight: "900" },
  error: { color: "#b91c1c", textAlign: "center", marginTop: 8 },
  inputRow: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#ddd", backgroundColor: "#fff" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sendButton: { backgroundColor: "#0f766e", paddingHorizontal: 18, borderRadius: 10, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
