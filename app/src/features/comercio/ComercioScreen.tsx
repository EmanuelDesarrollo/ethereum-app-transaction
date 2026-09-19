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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useComercioAgent } from "./useComercioAgent";

type Props = NativeStackScreenProps<RootStackParamList, "Comercio">;

export function ComercioScreen(_props: Props) {
  const { messages, send, sending, error, cobro, cobroStatus } = useComercioAgent();
  const [texto, setTexto] = useState("");

  const enviar = () => {
    if (!texto.trim() || sending) return;
    send(texto.trim());
    setTexto("");
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent}>
        {messages.length === 0 ? (
          <Text style={styles.hint}>
            Escríbele al agente, ej. "cóbrale 15 dólares a Ana por la camisa azul"
          </Text>
        ) : null}
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.from === "comercio" ? styles.bubbleComercio : styles.bubbleAgente]}>
            <Text style={m.from === "comercio" ? styles.bubbleTextComercio : styles.bubbleTextAgente}>{m.text}</Text>
          </View>
        ))}

        {cobro ? (
          <View style={styles.qrBox}>
            <Image source={{ uri: cobro.qrDataUrl }} style={styles.qr} />
            <Text style={styles.qrHint}>Que la persona escanee este QR con su wallet</Text>
            {cobroStatus === "pending" ? (
              <View style={styles.statusRow}>
                <ActivityIndicator />
                <Text style={styles.statusText}>Esperando pago...</Text>
              </View>
            ) : cobroStatus === "confirmed" ? (
              <Text style={styles.statusConfirmed}>✓ Pagado y confirmado onchain</Text>
            ) : null}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.inputRow}>
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  chat: { flex: 1 },
  chatContent: { padding: 16, gap: 8 },
  hint: { color: "#888", textAlign: "center", marginTop: 40 },
  bubble: { padding: 12, borderRadius: 12, maxWidth: "85%" },
  bubbleComercio: { backgroundColor: "#1a1a2e", alignSelf: "flex-end" },
  bubbleAgente: { backgroundColor: "#f1f5f9", alignSelf: "flex-start" },
  bubbleTextComercio: { color: "#fff" },
  bubbleTextAgente: { color: "#1a1a2e" },
  qrBox: { alignItems: "center", marginTop: 16, gap: 8 },
  qr: { width: 220, height: 220 },
  qrHint: { color: "#666", fontSize: 13 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  statusText: { color: "#666" },
  statusConfirmed: { color: "#0f766e", fontWeight: "700", marginTop: 4 },
  error: { color: "#b91c1c", textAlign: "center", marginTop: 8 },
  inputRow: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#ddd" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sendButton: { backgroundColor: "#0f766e", paddingHorizontal: 18, borderRadius: 10, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
