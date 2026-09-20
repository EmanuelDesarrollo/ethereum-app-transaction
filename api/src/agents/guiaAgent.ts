import Anthropic from "@anthropic-ai/sdk";
import { APP_MAP, type GuideRole, type GuideScreen } from "./appMap";

export type GuideAction =
  | { type: "navigate"; pantalla: GuideScreen }
  | { type: "start_tour"; rol: GuideRole; desde_paso?: string }
  | { type: "handoff"; agente: "cobros"; mensaje: string };

export interface GuideResult {
  reply: string;
  actions: GuideAction[];
}

const client = new Anthropic();

function fallbackGuide(mensaje: string, rol: GuideRole): GuideResult {
  const text = mensaje.toLowerCase();

  if (text.includes("tour") || text.includes("tutorial") || text.includes("guia")) {
    return {
      reply: "Te relanzo el tutorial para recorrer las funciones principales.",
      actions: [{ type: "start_tour", rol }],
    };
  }

  if (text.includes("cobrar") || text.includes("cobro") || text.includes("qr")) {
    return {
      reply: "Para cobrar, ve al modulo de comercio y genera un QR con monto y nota.",
      actions: [{ type: "navigate", pantalla: "ComercioChat" }],
    };
  }

  if (text.includes("fondo") || text.includes("gas") || text.includes("musdc") || text.includes("wallet")) {
    return {
      reply: "En tu wallet puedes pedir fondos de prueba y ver tu balance.",
      actions: [{ type: "navigate", pantalla: "PersonaWallet" }],
    };
  }

  if (text.includes("escan") || text.includes("pagar")) {
    return {
      reply: "Para pagar, abre el scanner y apunta al QR del comercio.",
      actions: [{ type: "navigate", pantalla: "PersonaScanner" }],
    };
  }

  return {
    reply: "Puedo guiarte para cobrar, pagar, pedir fondos de prueba o repetir el tutorial.",
    actions: [],
  };
}

export async function responderGuia(input: {
  mensaje: string;
  rol: GuideRole;
  contexto?: unknown;
}): Promise<GuideResult> {
  const system = [
    "Eres el guia de X-Mate, una app de cobros con stablecoin.",
    "Explicas como funciona la app y llevas al usuario al modulo correcto.",
    "NUNCA creas cobros, firmas transacciones ni mueves dinero.",
    "Si el usuario quiere cobrar, deriva al modulo de comercio.",
    "Responde en maximo 3 frases.",
    `Rol actual del usuario: ${input.rol}`,
    `Mapa: ${JSON.stringify(APP_MAP)}`,
    `Contexto de app: ${JSON.stringify(input.contexto ?? {})}`,
  ].join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: input.mensaje }],
    });

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    const fallback = fallbackGuide(input.mensaje, input.rol);

    return {
      reply: textBlock?.text?.trim() || fallback.reply,
      actions: fallback.actions,
    };
  } catch {
    return fallbackGuide(input.mensaje, input.rol);
  }
}
