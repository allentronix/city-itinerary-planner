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
// loads on the next visit.
type RememberedSignIn = "signed-in";

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

    return value === "signed-in" ? value : null;
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

export function getSyncMessage(
  auth: Extract<AuthState, { status: "signed-in" }>,
): string {
  if (auth.hasSyncError) {
    return "Couldn't sync. Your changes are kept on this device for now.";
  }

  return auth.isSyncing
    ? "Syncing your trips…"
    : "Your trips sync across your devices.";
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

type Session = typeof import("../lib/firebase-session");

// Kept once loaded, so signing in can open Google's window straight from the
// tap. Browsers block windows opened after waiting on the network.
let session: Session | null = null;
let sessionRequest: Promise<Session> | null = null;
let readyRequest: Promise<void> | null = null;

function loadSession(): Promise<Session> {
  sessionRequest ??= import("../lib/firebase-session").then(
    (loaded) => (session = loaded),
    (error: unknown) => {
      // Let a later attempt try the download again.
      sessionRequest = null;
      throw error;
    },
  );

  return sessionRequest;
}

// Restores a sign-in from an earlier visit. Called once when the app starts.
export function restoreSignIn() {
  if (state.status === "loading") {
    loadSession()
      .then((loaded) => loaded.start())
      .catch(() => setAuthState({ status: "signed-out" }));
  }
}

// Downloads and sets up Firebase ahead of the tap on "Continue with Google".
export function prepareSignIn(): Promise<void> {
  readyRequest ??= loadSession()
    .then((loaded) => loaded.prepare())
    .catch((error: unknown) => {
      readyRequest = null;
      throw error;
    });

  return readyRequest;
}

export function isSignInReady(): boolean {
  return session?.isPrepared() ?? false;
}

// Google blocks its sign-in inside apps' built-in browsers (Instagram,
// Facebook, TikTok and others), so people need to open the page elsewhere.
export function isInAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|Twitter|LinkedInApp|; wv\)/i.test(
    navigator.userAgent,
  );
}

// Returns an error message, or null once signed in (or the window was closed).
// Not async on purpose: Google's window has to open within the tap.
export function signIn(): Promise<string | null> {
  if (!session?.isPrepared()) {
    return Promise.resolve(
      "Sign-in is still getting ready. Please try again in a moment.",
    );
  }

  return session.signIn();
}

export async function signOut() {
  const session = await loadSession();

  await session.signOut();
}

// "deleted", "cancelled", or an error message.
export async function deleteAccount(): Promise<string> {
  try {
    const session = await loadSession();

    return await session.deleteAccount();
  } catch {
    return "Couldn't delete your account. Please try again.";
  }
}
