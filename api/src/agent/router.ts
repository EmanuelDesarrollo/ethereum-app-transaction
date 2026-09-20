import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import { crearCobroTool } from "./tools";
import type { Moneda, CheckoutPayload } from "../checkout/service";
import { crearCobro } from "../agents/cobrosAgent";
import { responderGuia } from "../agents/guiaAgent";
import type { GuideRole } from "../agents/appMap";

const SYSTEM_PROMPT =
  "Eres el asistente de cobro de una tienda. Cuando el comercio te pida cobrar algo, usa la " +
  "herramienta crear_cobro con el monto exacto. Si falta el monto o la moneda, pregunta antes " +
  "de actuar. Responde siempre en español, breve y claro.";

// Límite de vueltas tool_use -> tool_result en un mismo mensaje, por si el
// modelo insiste en llamar la herramienta repetidamente (no debería pasar con
// una sola tool, pero evita un loop infinito si algo sale mal).
const MAX_TOOL_TURNS = 3;

const client = new Anthropic();

interface AgentConversation {
  messages: Anthropic.MessageParam[];
}

// Conversaciones en memoria — igual que checkout/service.ts, suficiente para
// la demo del hackathon.
const conversations = new Map<string, AgentConversation>();

export const agentRouter = Router();

agentRouter.post("/guide", async (req, res) => {
  const { mensaje, rol, contexto } = req.body ?? {};

  if (typeof mensaje !== "string" || mensaje.trim() === "") {
    return res.status(400).json({ error: "falta el campo mensaje" });
  }
  if (rol !== "comercio" && rol !== "persona") {
    return res.status(400).json({ error: "rol invalido: debe ser comercio o persona" });
  }

  try {
    const result = await responderGuia({ mensaje, rol: rol as GuideRole, contexto });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

agentRouter.post("/message", async (req, res) => {
  const { mensaje, conversationId: incomingId } = req.body ?? {};

  if (typeof mensaje !== "string" || mensaje.trim() === "") {
    return res.status(400).json({ error: "falta el campo mensaje (texto del comercio)" });
  }

  const conversationId = typeof incomingId === "string" && conversations.has(incomingId) ? incomingId : randomUUID();
  const conversation = conversations.get(conversationId) ?? { messages: [] };
  conversations.set(conversationId, conversation);

  conversation.messages.push({ role: "user", content: mensaje });

  let cobro: { sessionId: string; qrDataUrl: string; payload: CheckoutPayload } | undefined;

  try {
    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const response = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [crearCobroTool],
        messages: conversation.messages,
      });

      conversation.messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") {
        const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
        return res.json({ conversationId, respuesta: textBlock?.text ?? "", cobro });
      }

      const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const tool of toolUseBlocks) {
        if (tool.name !== "crear_cobro") {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            is_error: true,
            content: `herramienta desconocida: ${tool.name}`,
          });
          continue;
        }

        try {
          // El agente nunca ejecuta el cobro directamente: solo pide la
          // herramienta, y es este backend el que corre la misma lógica que
          // POST /checkout (createCheckoutSession) y genera el QR.
          const input = tool.input as { monto: number; moneda: Moneda; nota?: string };
          const result = await crearCobro(input);
          const session = result.session;
          cobro = { sessionId: result.sessionId, qrDataUrl: result.qrDataUrl, payload: result.payload };

          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: JSON.stringify({
              orderId: result.orderId,
              sessionId: session.id,
              monto: session.monto,
              moneda: session.moneda,
              nota: session.nota,
              status: session.status,
              expiresAt: session.expiresAt,
            }),
          });
        } catch (err) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            is_error: true,
            content: (err as Error).message,
          });
        }
      }

      conversation.messages.push({ role: "user", content: toolResults });
    }

    return res.status(500).json({ error: "el agente no pudo completar la respuesta (demasiadas herramientas seguidas)" });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});
