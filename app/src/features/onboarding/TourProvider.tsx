import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { marcarTourVisto } from "./storage";
import { TOUR, type TourModo } from "./tourSteps";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextValue {
  registrar: (name: string, node: View | null) => void;
  iniciarTour: (modo: TourModo, desdePaso?: string) => void;
  tourActivo: boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour() debe usarse dentro de <TourProvider>");
  return ctx;
}

const COLORS = {
  velo: "rgba(7, 17, 31, 0.88)",
  card: "#0f2035",
  borde: "#1e3550",
  acento: "#65e4c4",
  texto: "#f8fafc",
  textoSuave: "#9aa7ba",
};

const PAD = 8;
const MARGEN_CARD = 16;

export function TourProvider({ children }: { children: React.ReactNode }) {
  const targets = useRef(new Map<string, View>()).current;
  const [modo, setModo] = useState<TourModo | null>(null);
  const [indice, setIndice] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const pasos = modo ? TOUR[modo] : [];
  const paso = pasos[indice];

  const registrar = useCallback(
    (name: string, node: View | null) => {
      if (node) targets.set(name, node);
      else targets.delete(name);
    },
    [targets],
  );

  const iniciarTour = useCallback((m: TourModo, desdePaso?: string) => {
    const pasoInicial = desdePaso ? Math.max(TOUR[m].findIndex((step) => step.id === desdePaso), 0) : 0;
    setModo(m);
    setIndice(pasoInicial);
    setRect(null);
  }, []);

  const cerrar = useCallback(async () => {
    const actual = modo;
    setModo(null);
    setRect(null);
    setIndice(0);
    if (actual) await marcarTourVisto(actual);
  }, [modo]);

  useEffect(() => {
    if (!paso?.target) {
      setRect(null);
      return;
    }
    const node = targets.get(paso.target);
    if (!node) {
      setRect(null);
      return;
    }
    const id = requestAnimationFrame(() => {
      node.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) setRect({ x, y, width, height });
        else setRect(null);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [paso, targets]);

  const value = useMemo<TourContextValue>(
    () => ({ registrar, iniciarTour, tourActivo: modo !== null }),
    [registrar, iniciarTour, modo],
  );

  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
  const foco = rect
    ? { x: rect.x - PAD, y: rect.y - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;
  const cardAbajo = foco ? foco.y + foco.height < windowHeight * 0.6 : true;
  const cardStyle = foco
    ? cardAbajo
      ? { top: foco.y + foco.height + 14, left: MARGEN_CARD, right: MARGEN_CARD }
      : { bottom: windowHeight - foco.y + 14, left: MARGEN_CARD, right: MARGEN_CARD }
    : { top: windowHeight * 0.35, left: MARGEN_CARD, right: MARGEN_CARD };
  const esUltimo = indice === pasos.length - 1;

  return (
    <TourContext.Provider value={value}>
      {children}

      <Modal visible={modo !== null && !!paso} transparent animationType="fade" onRequestClose={cerrar}>
        <View style={StyleSheet.absoluteFill}>
          {foco ? (
            <>
              <View style={[styles.velo, { top: 0, left: 0, width: windowWidth, height: Math.max(foco.y, 0) }]} />
              <View
                style={[
                  styles.velo,
                  {
                    top: foco.y + foco.height,
                    left: 0,
                    width: windowWidth,
                    height: Math.max(windowHeight - (foco.y + foco.height), 0),
                  },
                ]}
              />
              <View style={[styles.velo, { top: foco.y, left: 0, width: Math.max(foco.x, 0), height: foco.height }]} />
              <View
                style={[
                  styles.velo,
                  {
                    top: foco.y,
                    left: foco.x + foco.width,
                    width: Math.max(windowWidth - (foco.x + foco.width), 0),
                    height: foco.height,
                  },
                ]}
              />
              <View
                pointerEvents="none"
                style={[styles.marco, { top: foco.y, left: foco.x, width: foco.width, height: foco.height }]}
              />
            </>
          ) : (
            <View style={[styles.velo, StyleSheet.absoluteFill]} />
          )}

          <View style={[styles.card, cardStyle]}>
            <Text style={styles.contador}>
              Paso {indice + 1} de {pasos.length}
            </Text>
            <Text style={styles.titulo}>{paso?.titulo}</Text>
            <Text style={styles.texto}>{paso?.texto}</Text>

            <View style={styles.acciones}>
              <Pressable onPress={cerrar} hitSlop={10}>
                <Text style={styles.omitir}>Omitir</Text>
              </Pressable>

              <View style={styles.accionesDerecha}>
                {indice > 0 ? (
                  <Pressable onPress={() => setIndice((i) => i - 1)} style={styles.btnSecundario} hitSlop={6}>
                    <Text style={styles.btnSecundarioTexto}>Atrás</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={() => (esUltimo ? cerrar() : setIndice((i) => i + 1))}
                  style={styles.btnPrincipal}
                  hitSlop={6}
                >
                  <Text style={styles.btnPrincipalTexto}>{esUltimo ? "Entendido" : "Siguiente"}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.puntos}>
              {pasos.map((item, i) => (
                <View key={item.id} style={[styles.punto, i === indice && styles.puntoActivo]} />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </TourContext.Provider>
  );
}

const styles = StyleSheet.create({
  velo: { position: "absolute", backgroundColor: COLORS.velo },
  marco: { position: "absolute", borderRadius: 12, borderWidth: 2, borderColor: COLORS.acento },
  card: {
    position: "absolute",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borde,
    padding: 18,
  },
  contador: { color: COLORS.acento, fontSize: 12, fontWeight: "900", marginBottom: 6, letterSpacing: 0 },
  titulo: { color: COLORS.texto, fontSize: 20, fontWeight: "900", marginBottom: 6 },
  texto: { color: COLORS.textoSuave, fontSize: 15, lineHeight: 21 },
  acciones: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 },
  accionesDerecha: { flexDirection: "row", alignItems: "center", gap: 10 },
  omitir: { color: COLORS.textoSuave, fontSize: 14, fontWeight: "700" },
  btnSecundario: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#17293f" },
  btnSecundarioTexto: { color: COLORS.texto, fontSize: 14, fontWeight: "800" },
  btnPrincipal: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: COLORS.acento },
  btnPrincipalTexto: { color: "#07111f", fontSize: 14, fontWeight: "900" },
  puntos: { flexDirection: "row", gap: 6, marginTop: 14, justifyContent: "center" },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#28405c" },
  puntoActivo: { backgroundColor: COLORS.acento, width: 18 },
});
