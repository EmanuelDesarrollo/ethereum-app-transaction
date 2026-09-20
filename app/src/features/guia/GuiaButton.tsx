import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { GuideAction, TourModo } from "../../core/api/types";
import type { MainTabParamList } from "../../navigation/MainTabs";
import { useTour } from "../onboarding/TourProvider";
import { sendGuideMessage } from "./api";

type ChatMessage = {
  from: "user" | "guide";
  text: string;
};

const tabForModo: Record<TourModo, keyof MainTabParamList> = {
  cobrar: "Cobrar",
  pagar: "Pagar",
};

function modoForRoute(routeName: string): TourModo | undefined {
  if (routeName === "Cobrar") return "cobrar";
  if (routeName === "Pagar") return "pagar";
  return undefined;
}

export function GuiaButton() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const route = useRoute();
  const { iniciarTour } = useTour();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "guide", text: "Hola, soy tu guia. Te ayudo a cobrar, pagar o repetir un tutorial." },
  ]);

  const runAction = (action: GuideAction) => {
    if (action.type === "navigate") {
      navigation.navigate(action.tab);
      return;
    }
    if (action.type === "start_tour") {
      navigation.navigate(tabForModo[action.modo]);
      setTimeout(() => iniciarTour(action.modo, action.desdePaso), 350);
      return;
    }
    if (action.type === "handoff_cobros") {
      navigation.navigate("Cobrar");
    }
  };

  const enviar = async () => {
    const mensaje = input.trim();
    if (!mensaje || sending) return;

    setInput("");
    setSending(true);
    setMessages((current) => [...current, { from: "user", text: mensaje }]);

    try {
      const response = await sendGuideMessage({
        mensaje,
        conversationId,
        modoActual: modoForRoute(route.name),
      });
      setConversationId(response.conversationId);
      setMessages((current) => [...current, { from: "guide", text: response.respuesta }]);
      response.acciones.forEach(runAction);
    } catch (err) {
      setMessages((current) => [
        ...current,
        { from: "guide", text: `No pude conectar con el guia ahora. La app sigue funcionando: ${(err as Error).message}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Pressable style={styles.floatingButton} onPress={() => setOpen(true)}>
        <Ionicons name="help-buoy-outline" size={26} color="#fff" />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Guia X-Mate</Text>
                <Text style={styles.subtitle}>Preguntame como cobrar o pagar</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color="#08090a" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.chat}>
              {messages.map((message, index) => (
                <View
                  key={`${message.from}-${index}`}
                  style={[styles.bubble, message.from === "user" ? styles.userBubble : styles.guideBubble]}
                >
                  <Text style={message.from === "user" ? styles.userText : styles.guideText}>{message.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ej. no entiendo cómo cobro"
                onSubmitEditing={enviar}
                editable={!sending}
              />
              <Pressable style={styles.sendButton} onPress={enviar} disabled={sending}>
                {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#08090a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.38)" },
  sheet: { maxHeight: "78%", backgroundColor: "#fff", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { color: "#08090a", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#66717b", fontSize: 13, marginTop: 2 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2f3",
  },
  chat: { gap: 10, paddingVertical: 8 },
  bubble: { maxWidth: "86%", borderRadius: 12, padding: 12 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#08090a" },
  guideBubble: { alignSelf: "flex-start", backgroundColor: "#eef4f6" },
  userText: { color: "#fff", lineHeight: 20 },
  guideText: { color: "#101820", lineHeight: 20 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 10 },
  input: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dfe5e8",
    paddingHorizontal: 12,
    color: "#08090a",
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#08090a",
    alignItems: "center",
    justifyContent: "center",
  },
});
