import { config } from "../config";

export type TourModo = "cobrar" | "pagar";
export type GuideTab = "Cobrar" | "Pagar" | "Historial";

export const ETHSKILLS_CONTEXT = {
  terminologia: [
    'Usa "onchain" sin guion.',
    "No inventes direcciones de contratos, RPCs, explorers ni chain IDs.",
    "Explica gas como el costo de publicar una transaccion en la red.",
    "Distingue la moneda nativa para gas del token ERC-20 usado para pagar.",
  ],
  seguridad: [
    "La llave privada no debe salir del dispositivo ni enviarse al backend.",
    "El agente guia no firma, no crea cobros y no mueve fondos.",
    "El backend solo registra o verifica; el pago lo firma la wallet del usuario.",
    "Rabby o ChainList son herramientas externas para pruebas manuales, no requisito del flujo principal de la app.",
  ],
  ux: [
    "Cuando alguien pregunte por gas, faucet, red o Rabby, guia primero a la tab Pagar.",
    "Si falta gas, recomienda pedir fondos de prueba desde la app antes de escanear y pagar.",
    "Si pregunta por Rabby, explica que la app ya trae wallet local y Rabby es opcional para validar la red por fuera.",
  ],
} as const;

export const NETWORK_CONTEXT = {
  appWallet: "Wallet local no-custodial creada en el telefono con expo-secure-store.",
  chainName: "HSK Chain Testnet",
  chainId: config.hskChainId,
  rpcUrl: config.hskRpcUrl,
  nativeCurrency: "HSK",
  faucetUrl: "https://hskchain.net/faucet",
  explorerUrl: "https://testnet-explorer.hskchain.net",
  stablecoinSymbol: "mUSDC",
  stablecoinAddress: config.stablecoinAddress,
  stablecoinDecimals: config.stablecoinDecimals,
  salesRegistryAddress: config.salesRegistryAddress,
  comercioAddress: config.comercioAddress,
} as const;

export const APP_MAP = {
  tabs: {
    Cobrar: "Generar cobros con QR, usar el agente de cobros y ver confirmacion onchain.",
    Pagar: "Ver wallet, pedir fondos de prueba, escanear QR y pagar.",
    Historial: "Revisar ventas y pagos registrados en el telefono y en el backend.",
  },
  tours: {
    cobrar: [
      {
        id: "chat",
        titulo: "Cobra escribiendo",
        texto: 'Escribe algo como "cobrale 15 dolares a Ana por la camisa azul" y el agente arma el cobro por ti.',
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
        texto: "La persona lo escanea con su wallet y paga. Tu no tocas nada mas.",
        target: "cobrar-qr",
      },
      {
        id: "confirm",
        titulo: "Confirmacion onchain",
        texto: "Cuando el pago se confirma en la red, veras el check verde y la venta queda registrada.",
      },
    ],
    pagar: [
      {
        id: "wallet",
        titulo: "Tu wallet es tuya",
        texto: "La llave privada se guarda solo en este telefono. Nadie mas puede moverla.",
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
  },
} as const;

export const GUIDE_SYSTEM_PROMPT = [
  "Eres el guia de X-Mate.",
  "Respondes en espanol, maximo 3 frases, con tono claro y practico.",
  "No creas cobros, no firmas transacciones y no mueves dinero.",
  "Solo puedes sugerir acciones del catalogo cerrado: navigate, start_tour, handoff_cobros.",
  "Si el usuario quiere aprender a cobrar, explica y relanza el tour cobrar desde el paso mas util.",
  "Si el usuario quiere aprender a pagar, explica y relanza el tour pagar desde el paso mas util.",
  "Usa el contexto EthSkills para explicar Ethereum con precision y sin inventar datos.",
  "Si hay conflicto entre una captura externa y la configuracion del proyecto, di que la app usa la configuracion del proyecto.",
  `Mapa de app: ${JSON.stringify(APP_MAP)}`,
  `Contexto EthSkills: ${JSON.stringify(ETHSKILLS_CONTEXT)}`,
  `Contexto de red del proyecto: ${JSON.stringify(NETWORK_CONTEXT)}`,
].join("\n");
