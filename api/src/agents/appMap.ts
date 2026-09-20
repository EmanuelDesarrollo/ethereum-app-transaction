export const APP_MAP = {
  comercio: [
    {
      id: "qr",
      titulo: "Generar QR de cobro",
      texto: "Crea un QR EIP-681 con monto, token y destinatario para que cualquier wallet compatible lo escanee.",
      pantalla: "ComercioChat",
      target: "qr-card",
    },
    {
      id: "chat",
      titulo: "Cobrar hablando",
      texto: "El comercio puede escribir una instruccion natural y el agente de cobros crea la orden.",
      pantalla: "ComercioChat",
      target: "input-chat",
    },
    {
      id: "confirm",
      titulo: "Confirmacion onchain",
      texto: "El listener detecta el Transfer en HSK Chain y marca la sesion como confirmada.",
      pantalla: "ComercioChat",
      target: "estado-pago",
    },
  ],
  persona: [
    {
      id: "wallet",
      titulo: "Wallet no custodial",
      texto: "La llave privada vive en el telefono y se usa para firmar pagos.",
      pantalla: "PersonaWallet",
      target: "saldo",
    },
    {
      id: "faucet",
      titulo: "Fondos de prueba",
      texto: "La app puede pedir gas y mUSDC para el flujo demo.",
      pantalla: "PersonaWallet",
      target: "btn-faucet",
    },
    {
      id: "scan",
      titulo: "Escanear QR",
      texto: "La persona escanea el QR, revisa el monto y firma la transferencia.",
      pantalla: "PersonaScanner",
      target: "btn-escanear",
    },
  ],
} as const;

export type GuideRole = keyof typeof APP_MAP;
export type GuideScreen = "ComercioChat" | "ComercioHistorial" | "PersonaWallet" | "PersonaScanner";
