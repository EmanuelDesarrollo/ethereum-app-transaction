export type TourModo = "cobrar" | "pagar";
export type AppRole = TourModo;

export type TourStep = {
  id: string;
  titulo: string;
  texto: string;
  pantalla?: string;
  target?: string;
};

export const TOUR: Record<TourModo, TourStep[]> = {
  cobrar: [
    {
      id: "chat",
      titulo: "Cobra escribiendo",
      texto: 'Escribe algo como "cóbrale 15 dólares a Ana por la camisa azul" y el agente arma el cobro por ti.',
      target: "cobrar-input",
    },
    {
      id: "manual",
      titulo: "O genera el QR a mano",
      texto: "Si prefieres, pon el monto y una nota corta, y toca Generar QR.",
      target: "cobrar-generador",
    },
    {
      id: "qr",
      titulo: "Muestra el QR",
      texto: "La persona lo escanea con su wallet y paga. Tú no tocas nada más.",
      target: "cobrar-qr",
    },
    {
      id: "confirm",
      titulo: "Confirmacion onchain",
      texto: "Cuando el pago se confirma en la red, verás el check verde y la venta queda registrada.",
    },
  ],
  pagar: [
    {
      id: "wallet",
      titulo: "Tu wallet es tuya",
      texto: "La llave privada se guarda solo en este teléfono. Nadie más puede moverla.",
      target: "pagar-saldo",
    },
    {
      id: "faucet",
      titulo: "Fondos de prueba",
      texto: "Pide gas y mUSDC de demo antes de tu primer pago. Es un solo toque.",
      target: "pagar-faucet",
    },
    {
      id: "scan",
      titulo: "Escanea y paga",
      texto: "Apunta al QR del vendedor, revisa el monto y confirma. Listo.",
      target: "pagar-escanear",
    },
  ],
};
