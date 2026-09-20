import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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

export function ComercioScreen() {
  useAutoTour("cobrar");
  const { messages, send, crearCobro, limpiarCobro, sending, error, cobro, cobroStatus } = useComercioAgent();
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
              ) : cobroStatus === "confirmed" ? (
                <Text style={styles.statusConfirmed}>✓ Pagado y confirmado onchain</Text>
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
  statusConfirmed: { color: "#0f766e", fontWeight: "700", marginTop: 4 },
  error: { color: "#b91c1c", textAlign: "center", marginTop: 8 },
  inputRow: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#ddd", backgroundColor: "#fff" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sendButton: { backgroundColor: "#0f766e", paddingHorizontal: 18, borderRadius: 10, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
