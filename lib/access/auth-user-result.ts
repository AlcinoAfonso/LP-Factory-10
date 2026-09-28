type AuthUserLookup = Readonly<{
  data: Readonly<{ user: Readonly<{ id: string }> | null }>;
  error: Readonly<{ name: string }> | null;
}>;

export function accessUserIdFromAuthLookup(
  result: AuthUserLookup,
  throwOnReadError = false,
): string | null {
  if (result.error?.name === "AuthSessionMissingError") return null;
  if (result.error && throwOnReadError) throw new Error("access_auth_read_failed");
  return result.data.user?.id || null;
}
