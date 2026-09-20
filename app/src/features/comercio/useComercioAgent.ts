import { useCallback, useEffect, useRef, useState } from "react";
import { createCheckoutSession, sendAgentMessage, getCheckoutSession } from "../../core/api/client";
import type { CheckoutPayload, CheckoutStatus, Moneda } from "../../core/api/types";
import { registrarMovimiento } from "../historial/ledger";
import { getSession } from "../../core/session";

export interface ChatEntry {
  from: "comercio" | "agente";
  text: string;
}

interface Cobro {
  sessionId: string;
  qrDataUrl: string;
  payload: CheckoutPayload;
}

export function useComercioAgent() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const [cobro, setCobro] = useState<Cobro | undefined>(undefined);
  const [cobroStatus, setCobroStatus] = useState<CheckoutStatus>();
  const [cobroTxHash, setCobroTxHash] = useState<`0x${string}`>();
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const send = useCallback(
    async (mensaje: string) => {
      setSending(true);
      setError(undefined);
      setMessages((prev) => [...prev, { from: "comercio", text: mensaje }]);
      try {
        const session = await getSession();
        if (!session) throw new Error("No hay sesión activa; vuelve a iniciar sesión.");
        const res = await sendAgentMessage(mensaje, session.walletAddress, conversationId);
        setConversationId(res.conversationId);
        setMessages((prev) => [...prev, { from: "agente", text: res.respuesta }]);
        if (res.cobro) {
          setCobro(res.cobro);
          setCobroStatus("pending");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  const crearCobro = useCallback(async (input: { monto: number; moneda: Moneda; nota?: string }) => {
    setSending(true);
    setError(undefined);
    try {
      const authSession = await getSession();
      if (!authSession) throw new Error("No hay sesión activa; vuelve a iniciar sesión.");
      const session = await createCheckoutSession({ ...input, comercio: authSession.walletAddress });
      if (!session.qrDataUrl) {
        throw new Error("El backend no devolvio QR para este cobro.");
      }
      setCobro({
        sessionId: session.sessionId,
        qrDataUrl: session.qrDataUrl,
        payload: session.payload,
      });
      setCobroStatus("pending");
      setMessages((prev) => [
        ...prev,
        { from: "comercio", text: `Generar QR por ${input.monto} ${input.moneda}` },
        { from: "agente", text: "QR de cobro generado. La persona puede escanearlo con su wallet." },
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }, []);

  const limpiarCobro = useCallback(() => {
    setCobro(undefined);
    setCobroStatus(undefined);
    setCobroTxHash(undefined);
    setError(undefined);
  }, []);

  // Mientras el cobro esté pendiente, pregunta al backend cada pocos
  // segundos si ya se confirmó (el listener de eventos onchain lo actualiza).
  useEffect(() => {
    if (!cobro || cobroStatus !== "pending") return;

    pollRef.current = setInterval(async () => {
      try {
        const session = await getCheckoutSession(cobro.sessionId);
        if (session.status !== "pending") {
          setCobroStatus(session.status);
          if (session.status === "confirmed") {
            setCobroTxHash(session.txHash);
            await registrarMovimiento({
              tipo: "venta",
              monto: session.monto ?? Number(cobro.payload.amount) / 10 ** cobro.payload.decimals,
              moneda: session.moneda ?? "mUSDC",
              nota: session.nota ?? cobro.payload.nota,
              txHash: session.txHash,
              orderId: session.orderId,
            });
          }
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // errores transitorios de red durante el polling se ignoran
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [cobro, cobroStatus]);

  return { messages, send, crearCobro, limpiarCobro, sending, error, cobro, cobroStatus, cobroTxHash };
}
