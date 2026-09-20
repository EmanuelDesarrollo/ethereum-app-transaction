import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import { APP_MAP, GUIDE_SYSTEM_PROMPT, NETWORK_CONTEXT, type GuideTab, type TourModo } from "./appMap";

export type GuideAction =
  | { type: "navigate"; tab: GuideTab }
  | { type: "start_tour"; modo: TourModo; desdePaso?: string }
  | { type: "handoff_cobros"; mensaje: string };

export interface GuideResponse {
  conversationId: string;
  respuesta: string;
  acciones: GuideAction[];
}

type GuideConversation = {
  messages: Anthropic.MessageParam[];
};

const client = new Anthropic();
const conversations = new Map<string, GuideConversation>();

export const guiaRouter = Router();

const GUIDE_TOOLS: Anthropic.Tool[] = [
  {
    name: "abrir_modulo",
    description: "Pide a la app abrir una pestana principal.",
    input_schema: {
      type: "object",
      properties: {
        tab: { type: "string", enum: ["Cobrar", "Pagar", "Historial"] },
      },
      required: ["tab"],
    },
  },
  {
    name: "iniciar_tour",
    description: "Pide a la app relanzar un mini tour visual.",
    input_schema: {
      type: "object",
      properties: {
        modo: { type: "string", enum: ["cobrar", "pagar"] },
        desdePaso: { type: "string", enum: ["chat", "manual", "qr", "confirm", "wallet", "faucet", "scan"] },
      },
      required: ["modo"],
    },
  },
  {
    name: "derivar_a_cobros",
    description: "Deriva al agente de cobros sin crear cobros desde el guia.",
    input_schema: {
      type: "object",
      properties: {
        mensaje: { type: "string" },
      },
      required: ["mensaje"],
    },
  },
];

function fallbackGuide(mensaje: string, conversationId: string): GuideResponse {
  const text = mensaje.toLowerCase();

  if (text.includes("ethskill") || text.includes("ethereum") || text.includes("onchain") || text.includes("on-chain")) {
    return {
      conversationId,
      respuesta:
        "Uso EthSkills como contexto para no inventar datos Ethereum: digo onchain, separo gas de tokens y respeto que la llave vive en tu telefono. En esta app el pago es una transferencia ERC-20 firmada localmente.",
      acciones: [],
    };
  }

  if (text.includes("rabby") || text.includes("chainlist") || text.includes("metamask") || text.includes("red personalizada")) {
    return {
      conversationId,
      respuesta: `Rabby es opcional para pruebas externas: la app ya trae wallet local. Si agregas la red manualmente, usa la configuracion del proyecto: ${NETWORK_CONTEXT.chainName}, chain ID ${NETWORK_CONTEXT.chainId}, RPC ${NETWORK_CONTEXT.rpcUrl}, moneda ${NETWORK_CONTEXT.nativeCurrency}.`,
      acciones: [{ type: "navigate", tab: "Pagar" }],
    };
  }

  if (text.includes("gas") || text.includes("hsk") || text.includes("faucet") || text.includes("fondos")) {
    return {
      conversationId,
      respuesta: `HSK paga el gas de la red; mUSDC es el token demo para el cobro. Desde Pagar puedes pedir fondos de prueba, y para pruebas externas el faucet es ${NETWORK_CONTEXT.faucetUrl}.`,
      acciones: [
        { type: "navigate", tab: "Pagar" },
        { type: "start_tour", modo: "pagar", desdePaso: "faucet" },
      ],
    };
  }

  if (text.includes("musdc") || text.includes("stablecoin") || text.includes("token")) {
    return {
      conversationId,
      respuesta: `La demo usa ${NETWORK_CONTEXT.stablecoinSymbol}, un ERC-20 de prueba con ${NETWORK_CONTEXT.stablecoinDecimals} decimales. Su contrato configurado es ${NETWORK_CONTEXT.stablecoinAddress}.`,
      acciones: [{ type: "navigate", tab: "Pagar" }],
    };
  }

  if (text.includes("historial") || text.includes("movimiento") || text.includes("venta")) {
    return {
      conversationId,
      respuesta: "Te llevo al historial para revisar ventas y pagos registrados.",
      acciones: [{ type: "navigate", tab: "Historial" }],
    };
  }

  if (text.includes("cobrar") || text.includes("cobro") || text.includes("qr")) {
    return {
      conversationId,
      respuesta: "Para cobrar puedes escribir el pedido o generar el QR manualmente. Te muestro el tour de cobros.",
      acciones: [
        { type: "navigate", tab: "Cobrar" },
        { type: "start_tour", modo: "cobrar", desdePaso: text.includes("qr") ? "qr" : "chat" },
      ],
    };
  }

  if (text.includes("pagar") || text.includes("escan") || text.includes("wallet") || text.includes("fondo")) {
    return {
      conversationId,
      respuesta: "Para pagar revisa tu wallet, pide fondos de prueba si hace falta y escanea el QR del vendedor.",
      acciones: [
        { type: "navigate", tab: "Pagar" },
        { type: "start_tour", modo: "pagar", desdePaso: text.includes("fondo") ? "faucet" : "scan" },
      ],
    };
  }

  if (text.includes("tutorial") || text.includes("tour") || text.includes("guia")) {
    return {
      conversationId,
      respuesta: "Puedo relanzar los tours de cobrar o pagar. Empiezo por el tour de pagos.",
      acciones: [{ type: "start_tour", modo: "pagar" }],
    };
  }

  return {
    conversationId,
    respuesta: "Puedo ayudarte a cobrar, pagar, pedir fondos de prueba o revisar el historial.",
    acciones: [],
  };
}

function actionFromTool(tool: Anthropic.ToolUseBlock): GuideAction | undefined {
  const input = tool.input as Record<string, unknown>;

  if (tool.name === "abrir_modulo") {
    const tab = input.tab;
    if (tab === "Cobrar" || tab === "Pagar" || tab === "Historial") return { type: "navigate", tab };
  }

  if (tool.name === "iniciar_tour") {
    const modo = input.modo;
    const desdePaso = typeof input.desdePaso === "string" ? input.desdePaso : undefined;
    if (modo === "cobrar" || modo === "pagar") return { type: "start_tour", modo, desdePaso };
  }

  if (tool.name === "derivar_a_cobros") {
    return {
      type: "handoff_cobros",
      mensaje: typeof input.mensaje === "string" ? input.mensaje : "Abrir modulo de cobros.",
    };
  }

  return undefined;
}

export async function responderGuia(input: {
  mensaje: string;
  conversationId?: string;
  modoActual?: TourModo;
}): Promise<GuideResponse> {
  const conversationId =
    input.conversationId && conversations.has(input.conversationId) ? input.conversationId : randomUUID();
  const conversation = conversations.get(conversationId) ?? { messages: [] };
  conversations.set(conversationId, conversation);

  conversation.messages.push({
    role: "user",
    content: `${input.mensaje}\n\nContexto: ${JSON.stringify({ modoActual: input.modoActual, app: APP_MAP.tabs })}`,
  });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: GUIDE_SYSTEM_PROMPT,
      tools: GUIDE_TOOLS,
      messages: conversation.messages,
    });

    conversation.messages.push({ role: "assistant", content: response.content });

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    const actions = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use")
      .map(actionFromTool)
      .filter((action): action is GuideAction => Boolean(action));

    if (actions.length === 0) {
      const fallback = fallbackGuide(input.mensaje, conversationId);
      return {
        conversationId,
        respuesta: textBlock?.text?.trim() || fallback.respuesta,
        acciones: fallback.acciones,
      };
    }

    return {
      conversationId,
      respuesta: textBlock?.text?.trim() || "Listo, te acompaño.",
      acciones: actions,
    };
  } catch {
    return fallbackGuide(input.mensaje, conversationId);
  }
}

guiaRouter.post("/guide", async (req, res) => {
  const { mensaje, conversationId, modoActual } = req.body ?? {};

  if (typeof mensaje !== "string" || mensaje.trim() === "") {
    return res.status(400).json({ error: "falta el campo mensaje" });
  }

  if (modoActual !== undefined && modoActual !== "cobrar" && modoActual !== "pagar") {
    return res.status(400).json({ error: "modoActual invalido" });
  }

  try {
    const result = await responderGuia({
      mensaje: mensaje.trim(),
      conversationId: typeof conversationId === "string" ? conversationId : undefined,
      modoActual,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});
