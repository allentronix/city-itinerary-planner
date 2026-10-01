// Sign-in state, shared across the app. Firebase itself is only downloaded
// when someone signs in, or comes back after signing in before.

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
}

export type AuthState =
  | { status: "unavailable" }
  | { status: "signed-out" }
  | { status: "loading" }
  // Syncing until the first copy of the account's trips has arrived.
  | {
      status: "signed-in";
      user: AuthUser;
      isSyncing: boolean;
      // Set when Firestore refused a read or write, e.g. missing security rules.
      hasSyncError: boolean;
    };

// "signed-in": this browser's trips are a copy of the account's, so Firebase
// loads on the next visit. "pending": left for a Google sign-in redirect.
type RememberedSignIn = "signed-in" | "pending";

const SIGNED_IN_KEY = "itiplanner.signed-in";

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

let state: AuthState = isConfigured
  ? { status: getRememberedSignIn() ? "loading" : "signed-out" }
  : { status: "unavailable" };

const listeners = new Set<() => void>();

export function getRememberedSignIn(): RememberedSignIn | null {
  try {
    const value = localStorage.getItem(SIGNED_IN_KEY);

    return value === "signed-in" || value === "pending" ? value : null;
  } catch {
    return null;
  }
}

export function rememberSignIn(value: RememberedSignIn | null) {
  try {
    if (value) {
      localStorage.setItem(SIGNED_IN_KEY, value);
    } else {
      localStorage.removeItem(SIGNED_IN_KEY);
    }
  } catch {
    // Storage blocked: sign-in just won't be restored on the next visit.
  }
}

export function getAuthState(): AuthState {
  return state;
}

export function setAuthState(next: AuthState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeToAuth(onChange: () => void): () => void {
  listeners.add(onChange);

  return () => listeners.delete(onChange);
}

function loadSession() {
  return import("../lib/firebase-session");
}

// Restores a sign-in from an earlier visit. Called once when the app starts.
export function restoreSignIn() {
  if (state.status === "loading") {
    loadSession()
      .then((session) => session.start())
      .catch(() => setAuthState({ status: "signed-out" }));
  }
}

// Returns an error message, or null once signed in (or the popup was closed).
export async function signIn(): Promise<string | null> {
  try {
    const session = await loadSession();

    return await session.signIn();
  } catch {
    return "Couldn't load sign-in. Check your connection and try again.";
  }
}

export async function signOut() {
  const session = await loadSession();

  await session.signOut();
}
