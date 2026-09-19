import type Anthropic from "@anthropic-ai/sdk";

export const crearCobroTool: Anthropic.Tool = {
  name: "crear_cobro",
  description:
    "Crea un cobro: genera una sesion de pago y un codigo QR que la persona escanea con su wallet para pagar en stablecoin sobre HSK Chain testnet.",
  input_schema: {
    type: "object",
    properties: {
      monto: {
        type: "number",
        description: "Monto a cobrar, en dolares (ej. 15 o 15.5). Debe ser mayor a 0.",
      },
      moneda: {
        type: "string",
        enum: ["USDC", "USDT"],
        description: "Stablecoin en la que se cobra.",
      },
      nota: {
        type: "string",
        description: "Descripcion breve de la venta, ej. 'camisa azul para Ana'.",
      },
    },
    required: ["monto", "moneda"],
  },
};
