import { useEffect, useState } from "react";
import type { AccountType } from "./api/types";
import { getSession } from "./session";

export interface AccountTheme {
  accountType: AccountType;
  accent: string;
  accentDark: string;
  accentSoft: string;
  accentBorder: string;
}

export const accountThemes: Record<AccountType, AccountTheme> = {
  person: {
    accountType: "person",
    accent: "#2563eb",
    accentDark: "#1d4ed8",
    accentSoft: "#eff6ff",
    accentBorder: "#bfdbfe",
  },
  business: {
    accountType: "business",
    accent: "#7c3aed",
    accentDark: "#6d28d9",
    accentSoft: "#f5f3ff",
    accentBorder: "#ddd6fe",
  },
};

export const defaultAccountTheme = accountThemes.person;

export function getAccountTheme(accountType: AccountType | undefined): AccountTheme {
  return accountType ? accountThemes[accountType] : defaultAccountTheme;
}

export function useAccountTheme(): AccountTheme {
  const [theme, setTheme] = useState<AccountTheme>(defaultAccountTheme);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const session = await getSession();
      if (mounted) setTheme(getAccountTheme(session?.accountType));
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return theme;
}
