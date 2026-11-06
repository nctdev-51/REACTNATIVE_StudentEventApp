import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../types";

const AUTH_SESSION_KEY = "@student-event/auth-session:v1";

export interface AuthSession {
  token: string;
  user: User;
}

function isValidSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<AuthSession>;
  return (
    typeof session.token === "string" &&
    session.token.length > 0 &&
    !!session.user &&
    typeof session.user._id === "string" &&
    typeof session.user.email === "string"
  );
}

/**
 * Persist the non-sensitive session metadata needed to restore navigation on
 * the next launch. Passwords are intentionally never written to storage.
 */
export async function saveAuthSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

/** Return a valid session, removing corrupt or obsolete persisted data. */
export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    const session: unknown = JSON.parse(raw);
    if (isValidSession(session)) return session;
  } catch {
    // The value is removed below so a corrupt cache cannot block app launch.
  }

  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  return null;
}

export function clearAuthSession(): Promise<void> {
  return AsyncStorage.removeItem(AUTH_SESSION_KEY);
}
