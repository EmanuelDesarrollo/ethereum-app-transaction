import { useCallback, useEffect, useRef, useState } from "react";
import { sendAgentMessage, getCheckoutSession } from "../../core/api/client";
import type { CheckoutPayload, CheckoutStatus } from "../../core/api/types";

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
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const send = useCallback(
    async (mensaje: string) => {
      setSending(true);
      setError(undefined);
      setMessages((prev) => [...prev, { from: "comercio", text: mensaje }]);
      try {
        const res = await sendAgentMessage(mensaje, conversationId);
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

  // Mientras el cobro esté pendiente, pregunta al backend cada pocos
  // segundos si ya se confirmó (el listener de eventos onchain lo actualiza).
  useEffect(() => {
    if (!cobro || cobroStatus !== "pending") return;

    pollRef.current = setInterval(async () => {
      try {
        const session = await getCheckoutSession(cobro.sessionId);
        if (session.status !== "pending") {
          setCobroStatus(session.status);
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

  return { messages, send, sending, error, cobro, cobroStatus };
}
