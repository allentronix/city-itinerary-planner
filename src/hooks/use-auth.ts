import { useSyncExternalStore } from "react";
import { getAuthState, subscribeToAuth, type AuthState } from "../utils/auth";

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribeToAuth, getAuthState, getAuthState);
}

// True while the account's trips may still be on their way to this browser.
export function useIsLoadingTrips(): boolean {
  const auth = useAuth();

  return (
    auth.status === "loading" || (auth.status === "signed-in" && auth.isSyncing)
  );
}
