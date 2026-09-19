# Contratos — tienda-stablecoin-pay

Foundry project con dos contratos para la demo en HSK Chain testnet:

- `src/SalesRegistry.sol` — anota ventas confirmadas onchain (sin custodia de fondos).
- `src/MockStablecoin.sol` — ERC-20 de prueba (6 decimales, `faucet()` público) usado
  como stablecoin en la demo, ya que no se encontró una dirección oficial de
  USDC/USDT verificable en HSK Chain testnet.

## Setup

```shell
cp .env.example .env   # completa PRIVATE_KEY (wallet del backend, con HSK testnet)
forge build
forge test
```

## Deploy en HSK Chain testnet

```shell
forge script script/Deploy.s.sol --rpc-url hsk_testnet --broadcast \
  --verify --verifier blockscout --verifier-url https://testnet-explorer.hsk.xyz/api
```

Guarda las direcciones que imprime el script (`SalesRegistry`, `MockStablecoin`) — el
backend (`api/`) las necesita en su `.env`.

Red: HSK Chain Testnet — chain ID `133`, RPC `https://testnet.hsk.xyz`,
explorer `https://testnet-explorer.hsk.xyz`. Faucet de HSK (gas): https://hskchain.net/faucet.
