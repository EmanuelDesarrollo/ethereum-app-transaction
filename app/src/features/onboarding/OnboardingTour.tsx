import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TOUR, type AppRole } from "./tourSteps";
import { guardarPasoTour, marcarTourCompleto, necesitaTour, obtenerPasoTour, reiniciarTour } from "./state";

type Props = {
  rol: AppRole;
  restartToken?: number;
};

export function OnboardingTour({ rol, restartToken = 0 }: Props) {
  const steps = TOUR[rol];
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  const open = useCallback(
    async (force = false) => {
      const shouldStart = force || (await necesitaTour(rol));
      if (!shouldStart) return;
      const stored = force ? 0 : await obtenerPasoTour(rol);
      setIndex(Math.min(stored, steps.length - 1));
      setVisible(true);
    },
    [rol, steps.length],
  );

  useEffect(() => {
    void open(restartToken > 0);
  }, [open, restartToken]);

  if (!visible || steps.length === 0) return null;

  const current = steps[index];
  const isLast = index === steps.length - 1;

  const close = async () => {
    await marcarTourCompleto(rol);
    setVisible(false);
  };

  const prev = async () => {
    const next = Math.max(index - 1, 0);
    setIndex(next);
    await guardarPasoTour(rol, next);
  };

  const next = async () => {
    if (isLast) {
      await close();
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    await guardarPasoTour(rol, nextIndex);
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.targetGlow}>
          <Ionicons name={rol === "cobrar" ? "qr-code-outline" : "wallet-outline"} size={34} color="#08090a" />
        </View>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.stepCount}>
              {index + 1}/{steps.length}
            </Text>
            <Pressable onPress={close} hitSlop={10}>
              <Text style={styles.skip}>Omitir</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{current.titulo}</Text>
          <Text style={styles.body}>{current.texto}</Text>
          <Text style={styles.target}>Modulo: {current.pantalla}</Text>
          <View style={styles.actions}>
            <Pressable style={[styles.secondaryButton, index === 0 && styles.disabledButton]} onPress={prev} disabled={index === 0}>
              <Text style={styles.secondaryText}>Atras</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={next}>
              <Text style={styles.primaryText}>{isLast ? "Terminar" : "Siguiente"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export async function relanzarTour(rol: AppRole): Promise<void> {
  await reiniciarTour(rol, 0);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  targetGlow: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderWidth: 4,
    borderColor: "#42e86f",
  },
  card: { width: "100%", maxWidth: 360, backgroundColor: "#fff", borderRadius: 8, padding: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  stepCount: { color: "#606970", fontSize: 13, fontWeight: "900" },
  skip: { color: "#606970", fontSize: 13, fontWeight: "900" },
  title: { color: "#08090a", fontSize: 24, fontWeight: "900", marginBottom: 8 },
  body: { color: "#3f464d", fontSize: 15, lineHeight: 21 },
  target: { color: "#8a9299", fontSize: 12, fontWeight: "800", marginTop: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  primaryButton: { flex: 1, minHeight: 46, borderRadius: 8, backgroundColor: "#08090a", alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: "#f1f3f4",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: "#08090a", fontWeight: "900" },
  disabledButton: { opacity: 0.45 },
});
