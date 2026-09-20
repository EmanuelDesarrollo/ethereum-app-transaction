import { useCallback, useEffect, useState } from "react";
import type { PrivateKeyAccount } from "viem/accounts";
import {
  getOrCreateAccount,
  getStablecoinBalance,
  formatStablecoinAmount,
  requestTestStablecoin,
} from "../../core/wallet/walletService";
import { requestGasSponsorship } from "../../core/api/client";
import { getSession } from "../../core/session";

export function usePersonaWallet() {
  const [account, setAccount] = useState<PrivateKeyAccount>();
  const [balance, setBalance] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const refreshBalance = useCallback(async (address: `0x${string}`) => {
    const units = await getStablecoinBalance(address);
    setBalance(formatStablecoinAmount(units));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (!session) throw new Error("No hay sesión activa; vuelve a iniciar sesión.");
        const acc = await getOrCreateAccount(session.userId);
        setAccount(acc);
        await refreshBalance(acc.address);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshBalance]);

  const requestTestFunds = useCallback(async () => {
    if (!account) return;
    setBusy(true);
    setError(undefined);
    try {
      // Sponsorea gas (una vez por dirección) y luego mintea stablecoin de
      // prueba — la persona necesita ambas cosas para poder pagar después.
      try {
        await requestGasSponsorship(account.address);
      } catch (err) {
        const message = (err as Error).message;
        if (!message.includes("ya recibió gas")) {
          throw new Error("No pude pedir HSK para gas. Revisa que el backend este corriendo y que API_BASE_URL apunte a tu computador.");
        }
      }
      try {
        await requestTestStablecoin(account);
      } catch {
        throw new Error("Tu wallet aun no tiene HSK suficiente para gas. Pide HSK de prueba y vuelve a intentar.");
      }
      await refreshBalance(account.address);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [account, refreshBalance]);

  return { account, balance, loading, busy, error, requestTestFunds, refreshBalance };
}
