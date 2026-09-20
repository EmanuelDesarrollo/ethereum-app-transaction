export const PRIVY_APP_ID = "cmuag5fns01i70cjtxiowfkz3";
export const PRIVY_CLIENT_ID = "client-WY6dwhHV3pG93inj8LvUBZUJDmduMWYG6zCXJiHJwCc1J";

export function isPrivyConfigured(): boolean {
  return !PRIVY_APP_ID.startsWith("REPLACE_") && !PRIVY_CLIENT_ID.startsWith("REPLACE_");
}
