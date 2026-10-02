import { initializeApp } from "firebase/app";
import {
  deleteUser,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  clearIndexedDbPersistence,
  collection,
  deleteDoc,
  doc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  terminate,
  writeBatch,
} from "firebase/firestore";
import type { Place } from "../data/types";
import {
  firebaseConfig,
  getAuthState,
  getRememberedSignIn,
  rememberSignIn,
  setAuthState,
  type AuthUser,
} from "../utils/auth";
import { setCloudSink } from "../utils/cloud-sync";
import { clearDraft } from "../utils/draft-trip";
import {
  loadCustomPlaces,
  replaceCustomPlaces,
  type CustomPlacesByCity,
} from "../utils/custom-places";
import { loadTrips, replaceTrips, type SavedTrip } from "../utils/saved-trips";

// Loaded only when someone signs in. The account's data lives in Firestore:
//   users/{uid}/trips/{tripId}            a SavedTrip
//   users/{uid}/customPlaces/{placeId}    { cityId, place }
// This browser's localStorage keeps a copy that the app reads from, so pages
// stay instant and work offline; Firestore keeps the copies in step.

interface StoredCustomPlace {
  cityId: string;
  place: Place;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = initializeFirestore(app, {
  // Saved places leave optional fields undefined; Firestore rejects those otherwise.
  ignoreUndefinedProperties: true,
  // Keeps changes made offline, even across a reload, until they're sent.
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

let hasStarted = false;
let isReady = false;
let stopSync: (() => void) | null = null;

function tripsRef(uid: string) {
  return collection(db, "users", uid, "trips");
}

function placesRef(uid: string) {
  return collection(db, "users", uid, "customPlaces");
}

function updateSignedIn(changes: {
  isSyncing?: boolean;
  hasSyncError?: boolean;
}) {
  const current = getAuthState();

  if (current.status === "signed-in") {
    setAuthState({ ...current, ...changes });
  }
}

function reportSyncError(error: unknown) {
  console.error("Couldn't sync with your account:", error);
  updateSignedIn({ isSyncing: false, hasSyncError: true });
}

// The first time someone signs in on this browser, the trips and places they
// made while signed out join their account. The newer copy of a trip wins.
async function uploadLocalData(uid: string) {
  const [cloudTrips, cloudPlaces] = await Promise.all([
    getDocs(tripsRef(uid)),
    getDocs(placesRef(uid)),
  ]);

  const cloudUpdatedAt = new Map(
    cloudTrips.docs.map((snapshot) => [
      snapshot.id,
      (snapshot.data() as SavedTrip).updatedAt,
    ]),
  );
  const cloudPlaceIds = new Set(
    cloudPlaces.docs.map((snapshot) => snapshot.id),
  );

  const batch = writeBatch(db);
  let changeCount = 0;

  for (const trip of loadTrips()) {
    const updatedAt = cloudUpdatedAt.get(trip.id);

    if (!updatedAt || trip.updatedAt > updatedAt) {
      batch.set(doc(tripsRef(uid), trip.id), trip);
      changeCount++;
    }
  }

  for (const [cityId, places] of Object.entries(loadCustomPlaces())) {
    for (const place of places) {
      if (!cloudPlaceIds.has(place.id)) {
        const stored: StoredCustomPlace = { cityId, place };
        batch.set(doc(placesRef(uid), place.id), stored);
        changeCount++;
      }
    }
  }

  if (changeCount > 0) {
    // Not awaited: offline, the batch is applied locally and sent later.
    batch.commit().catch(reportSyncError);
  }
}

// Mirrors the account's trips and places into this browser as they change.
function startSync(uid: string): () => void {
  let hasTrips = false;
  let hasPlaces = false;

  function markLoaded() {
    if (hasTrips && hasPlaces) {
      updateSignedIn({ isSyncing: false });
    }
  }

  const stopTrips = onSnapshot(
    tripsRef(uid),
    (snapshot) => {
      replaceTrips(snapshot.docs.map((trip) => trip.data() as SavedTrip));
      hasTrips = true;
      markLoaded();
    },
    reportSyncError,
  );

  const stopPlaces = onSnapshot(
    placesRef(uid),
    (snapshot) => {
      const byCity: CustomPlacesByCity = {};

      for (const stored of snapshot.docs) {
        const { cityId, place } = stored.data() as StoredCustomPlace;
        (byCity[cityId] ??= []).push(place);
      }

      replaceCustomPlaces(byCity);
      hasPlaces = true;
      markLoaded();
    },
    reportSyncError,
  );

  return () => {
    stopTrips();
    stopPlaces();
  };
}

async function handleSignedIn(user: User) {
  const isFreshSignIn = getRememberedSignIn() !== "signed-in";

  const authUser: AuthUser = {
    uid: user.uid,
    name: user.displayName || user.email || "You",
    email: user.email ?? "",
  };

  setAuthState({
    status: "signed-in",
    user: authUser,
    isSyncing: true,
    hasSyncError: false,
  });

  const uid = user.uid;

  setCloudSink({
    saveTrip: (trip) =>
      void setDoc(doc(tripsRef(uid), trip.id), trip).catch(reportSyncError),
    deleteTrip: (tripId) =>
      void deleteDoc(doc(tripsRef(uid), tripId)).catch(reportSyncError),
    saveCustomPlace: (cityId, place) => {
      const stored: StoredCustomPlace = { cityId, place };
      void setDoc(doc(placesRef(uid), place.id), stored).catch(reportSyncError);
    },
    deleteCustomPlace: (placeId) =>
      void deleteDoc(doc(placesRef(uid), placeId)).catch(reportSyncError),
  });

  if (isFreshSignIn) {
    try {
      await uploadLocalData(uid);
    } catch (error) {
      reportSyncError(error);
    }
  }

  // From here on this browser holds the account's copy.
  rememberSignIn("signed-in");
  stopSync = startSync(uid);
}

function handleSignedOut() {
  stopSync?.();
  stopSync = null;
  setCloudSink(null);

  // The trips here belonged to the account; they stay safe in it. Clearing
  // them means the next person on this browser doesn't see them.
  if (getRememberedSignIn() === "signed-in") {
    replaceTrips([]);
    replaceCustomPlaces({});
  }

  rememberSignIn(null);
  setAuthState({ status: "signed-out" });
}

// Gets everything Google's sign-in window needs ready ahead of the tap, so
// it opens straight away. Opening it after loading would get it blocked.
export async function prepare() {
  start();
  await auth.authStateReady();

  // Loads Firebase's sign-in helper frame (it also finishes any sign-in
  // left from an earlier visit).
  await getRedirectResult(auth).catch(() => null);

  isReady = true;
}

export function isPrepared(): boolean {
  return isReady;
}

export function start() {
  if (hasStarted) {
    return;
  }

  hasStarted = true;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      void handleSignedIn(user);
    } else {
      handleSignedOut();
    }
  });
}

function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  return provider;
}

function isPopupClosed(code: string | undefined): boolean {
  return (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  );
}

// Removes Firestore's offline copy of the account from this browser.
// Firestore can't be used again on this page afterwards, so callers reload.
async function clearOfflineCopy() {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch {
    // Another ItiPlanner tab still has it open; it's cleared on a later sign-out.
  }
}

// Returns an error message, or null once signed in (or the popup was closed).
export async function signIn(): Promise<string | null> {
  start();

  const provider = getGoogleProvider();

  try {
    await signInWithPopup(auth, provider);
    return null;
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (isPopupClosed(code)) {
      return null;
    }

    // Going to Google's page and back instead isn't reliable on phones
    // (browsers block the storage it needs), but a second tap opens the window.
    if (code === "auth/popup-blocked") {
      return "Your browser blocked the Google sign-in window. Tap Continue with Google again.";
    }

    if (code === "auth/unauthorized-domain") {
      return "Sign-in isn't set up for this website yet.";
    }

    console.error("Sign-in failed:", code ?? error);
    return "Couldn't sign in. Please try again.";
  }
}

// Signs out and removes the account's trips from this browser. Reloads the app.
export async function signOut() {
  await firebaseSignOut(auth);
  handleSignedOut();
  await clearOfflineCopy();
  window.location.assign("/");
}

// Deletes the account with all its trips and places, everywhere. Returns
// "deleted", "cancelled" (the confirmation popup was closed) or an error message.
export async function deleteAccount(): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    return "You're not signed in.";
  }

  // Firebase only deletes accounts after a recent sign-in, so Google asks the
  // person to confirm it's them. It also stops a borrowed laptop deleting it.
  try {
    await reauthenticateWithPopup(user, getGoogleProvider());
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (isPopupClosed(code)) {
      return "cancelled";
    }

    if (code === "auth/user-mismatch") {
      return "That's a different Google account. Choose the one you're signed in with.";
    }

    console.error("Couldn't confirm the account:", code ?? error);
    return "Couldn't confirm it's you. Please try again.";
  }

  // Stop syncing first, so the deletions don't bounce back into this browser.
  stopSync?.();
  stopSync = null;
  setCloudSink(null);

  try {
    const snapshots = await Promise.all([
      getDocs(tripsRef(user.uid)),
      getDocs(placesRef(user.uid)),
    ]);
    const refs = snapshots.flatMap((snapshot) =>
      snapshot.docs.map((stored) => stored.ref),
    );

    // A batch holds at most 500 changes.
    for (let index = 0; index < refs.length; index += 500) {
      const batch = writeBatch(db);
      refs.slice(index, index + 500).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    await deleteUser(user);
  } catch (error) {
    console.error("Couldn't delete the account:", error);
    // Still signed in: carry on syncing whatever is left.
    void handleSignedIn(user);
    return "Couldn't delete your account. Please try again.";
  }

  handleSignedOut();
  clearDraft();
  await clearOfflineCopy();

  return "deleted";
}
