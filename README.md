# tienda-stablecoin-pay

App de cobro con stablecoin + agente de IA, construida para el **ETHCali Builders
Tour**.

- **Track:** EAG → *Real-World Ethereum Applications*
- **Track:** HSK Chain (HashKey Chain) → *Stablecoins*

Un comercio real (tienda de ropa) cobra hablando o escribiendo en lenguaje natural
(*"cóbrale 15 dólares a Ana por la camisa azul"*), un agente con function calling
(Claude Sonnet 5) genera un cobro y un QR, y la persona paga escaneando el QR con
su propia wallet no-custodial. El pago es una transferencia ERC-20 normal en
**HSK Chain testnet**; un listener detecta la confirmación onchain y la anota en
un contrato de registro.

## Features

- 🗣️ **Agente cajero** (`POST /agent/message`) — entiende lenguaje natural, pide
  el monto/moneda si faltan, nunca ejecuta el cobro él mismo.
- 🧾 **Checkout** (`POST /checkout`) — genera sesión de pago + QR.
- 📱 **App móvil única, dos roles** — Comercio (cobra) y Persona (paga), Expo +
  React Native.
- 🔑 **Wallet no-custodial** — la llave privada de la persona vive solo en
  Keychain (iOS) / Keystore (Android), nunca sale del dispositivo.
- 👂 **Listener onchain** — detecta la transferencia ERC-20 y registra la venta
  en `SalesRegistry` automáticamente.
- ⛓️ **Contratos verificados** en HSK Chain testnet (Blockscout).

## Arquitectura

```
tienda-stablecoin-pay/
├── app/                    ← React Native (Expo, dev workflow) — un solo app, dos roles
│   └── src/
│       ├── core/           ← config, cliente HTTP del backend, wallet (viem + SecureStore)
│       ├── features/
│       │   ├── roleSelect/ ← elegir Comercio o Persona
│       │   ├── comercio/   ← chat con el agente, muestra QR, espera confirmación
│       │   └── persona/    ← wallet, scanner QR, firma y paga
│       └── navigation/
├── api/                    ← Node + Express + TypeScript
│   └── src/
│       ├── agent/          ← tool `crear_cobro` + POST /agent/message (function calling)
│       ├── checkout/       ← POST /checkout + GET /checkout/:id (sesiones en memoria)
│       ├── faucet/         ← POST /faucet/gas (sponsorea gas de demo a wallets nuevas)
│       ├── listeners/      ← escucha transferencias ERC-20 y llama registrarVenta()
│       └── chain.ts        ← cliente viem compartido (HSK Chain testnet)
├── contracts/              ← Foundry
│   └── src/
│       ├── SalesRegistry.sol    ← anota ventas confirmadas, sin custodiar fondos
│       └── MockStablecoin.sol   ← ERC-20 de prueba (6 decimales) para la demo
└── docs/technical-documentation.md
```

## Stack

- **App:** React Native + TypeScript (Expo, dev workflow con `ios/`/`android/`
  nativos), `viem` para firmar/enviar, `expo-secure-store` para la llave privada,
  `expo-camera` para el scanner QR.
- **Backend:** Node + Express + TypeScript, `@anthropic-ai/sdk` (modelo
  `claude-sonnet-5`), `viem`.
- **Contratos:** Solidity + OpenZeppelin, Foundry.
- **Red:** HSK Chain testnet — chain ID `133`, RPC `https://testnet.hsk.xyz`,
  explorer [`testnet-explorer.hskchain.net`](https://testnet-explorer.hskchain.net).

### Contratos desplegados y verificados

| Contrato | Dirección |
|---|---|
| `SalesRegistry` | [`0x47a1e2F914C6aB7523804c8eD2fE76df149735e0`](https://testnet-explorer.hskchain.net/address/0x47a1e2f914c6ab7523804c8ed2fe76df149735e0) |
| `MockStablecoin` (mUSDC) | [`0x59e12F42dE357De29AA810E27C0c02650Ea66e85`](https://testnet-explorer.hskchain.net/address/0x59e12f42de357de29aa810e27c0c02650ea66e85) |

> **Nota:** no encontramos una dirección oficial y verificable de USDC/USDT en
> HSK Chain testnet, así que desplegamos `MockStablecoin` (ERC-20, 6 decimales,
> `faucet()` público) para la demo. Ver `docs/technical-documentation.md`.

## Instalación y cómo correrlo

### 1. Contratos (opcional — ya están desplegados arriba)

```bash
cd contracts
cp .env.example .env   # PRIVATE_KEY de tu wallet deployer
forge build && forge test
forge script script/Deploy.s.sol --rpc-url hsk_testnet --broadcast \
  --verify --verifier blockscout --verifier-url https://testnet-explorer.hskchain.net/api
```

### 2. Backend

```bash
cd api
cp .env.example .env
# completa ANTHROPIC_API_KEY y PRIVATE_KEY (wallet owner de SalesRegistry, con HSK de gas)
npm install
npm run dev   # http://localhost:3000
```

### 3. App

```bash
cd app
npm install
```

Antes de compilar, revisa `src/core/config.ts` → `API_BASE_URL`:
- Simulador iOS: `http://localhost:3000`
- Emulador Android: `http://10.0.2.2:3000`
- Dispositivo físico: la IP de tu computadora en la red local (ej.
  `http://192.168.1.42:3000`)

```bash
npx expo run:ios       # o
npx expo run:android
```

(Necesita dev client, no Expo Go puro, porque usa módulos nativos —
`expo-camera` y `expo-secure-store`.)

### Probar el flujo completo

1. Abre la app en dos instancias (dos simuladores, o simulador + tu celular).
2. En una, elige **Comercio** y escribe algo como *"cóbrale 1 dólar a Ana por la
   camisa azul"*.
3. En la otra, elige **Persona** → "Pedir fondos de prueba" (necesita gas +
   mUSDC antes de poder pagar) → "Escanear QR para pagar" → escanea el QR que
   generó el comercio → confirma.
4. El comercio ve "✓ Pagado y confirmado onchain" en segundos, cuando el
   listener detecta la transferencia y llama `registrarVenta()`.

## Limitaciones conocidas (decisiones de tiempo de hackathon)

- Sesiones de checkout y conversaciones del agente **en memoria** — se pierden
  si el backend se reinicia. Sin base de datos.
- `POST /faucet/gas` es un helper de demo (sponsorea gas una vez por dirección
  desde la wallet del backend) — no es un mecanismo de producción.
- `MockStablecoin` en vez de un USDC/USDT real de testnet (ver nota arriba).

Ver `docs/technical-documentation.md` para el roadmap post-hackathon.
