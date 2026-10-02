import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageBanner from "../components/page-banner";
import { Button, buttonVariants } from "../components/ui/button";
import { useAuth } from "../hooks/use-auth";
import {
  getSyncMessage,
  isInAppBrowser,
  isSignInReady,
  prepareSignIn,
  signIn,
  signOut,
} from "../utils/auth";

const BENEFITS = [
  "Your trips on your phone, laptop and any other device.",
  "Places you've added yourself come too.",
  "Trips you've already planned in this browser move into your account.",
];

// Where to go after signing in: the page that sent people here, or My trips.
function getReturnPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;

  return typeof from === "string" &&
    from.startsWith("/") &&
    !from.startsWith("/sign-in")
    ? from
    : "/trips";
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function SignInPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getReturnPath(location.state);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const [isReady, setIsReady] = useState(isSignInReady);
  const [hasLoadFailed, setHasLoadFailed] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const isInApp = isInAppBrowser();

  // Get Google sign-in ready while people read the page, so the tap can open
  // Google's window straight away. Phones block it if it opens late.
  useEffect(() => {
    if (auth.status !== "signed-out" || isReady || hasLoadFailed || isInApp) {
      return;
    }

    let isCurrent = true;

    prepareSignIn().then(
      () => isCurrent && setIsReady(true),
      () => isCurrent && setHasLoadFailed(true),
    );

    return () => {
      isCurrent = false;
    };
  }, [auth.status, isReady, hasLoadFailed, isInApp]);

  // Set once the Google button is pressed, so arriving here already signed
  // in shows the account instead of jumping away.
  const hasPressedSignInRef = useRef(false);

  useEffect(() => {
    if (auth.status === "signed-in" && hasPressedSignInRef.current) {
      navigate(returnPath, { replace: true });
    }
  }, [auth.status, navigate, returnPath]);

  // Firebase takes about 10 seconds to notice a closed popup. Coming back to
  // this page without signing in means it was closed, so stop waiting.
  useEffect(() => {
    if (!isSigningIn) {
      return;
    }

    let timer: number | undefined;

    function handleFocus() {
      timer = window.setTimeout(() => setIsSigningIn(false), 1000);
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.clearTimeout(timer);
    };
  }, [isSigningIn]);

  function handleSignIn() {
    // First, before anything else: Google's window must open within the tap.
    const request = signIn();

    hasPressedSignInRef.current = true;
    setIsSigningIn(true);
    setError("");

    void request.then((message) => {
      setIsSigningIn(false);
      setError(message ?? "");
    });
  }

  function handleCopyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => setHasCopiedLink(true))
      .catch(() => setHasCopiedLink(false));
  }

  return (
    <>
      <PageBanner eyebrow="Your account" title="Sign in" />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="max-w-md border bg-white p-6 sm:p-8">
          {auth.status === "unavailable" && (
            <p className="text-slate-600">
              Sign-in isn't available right now. Your trips are still saved in
              this browser.
            </p>
          )}

          {auth.status === "loading" && (
            <p className="text-slate-500">Checking your account…</p>
          )}

          {auth.status === "signed-in" && (
            <>
              <h2 className="font-serif text-2xl">You're signed in</h2>
              <p className="mt-2 text-slate-600">
                {auth.user.email || auth.user.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {getSyncMessage(auth)}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to="/trips"
                  className={buttonVariants({
                    className: "h-auto px-5 py-3 text-base",
                  })}
                >
                  Go to My trips
                </Link>
                <Button
                  variant="outline"
                  className="h-auto px-5 py-3 text-base"
                  onClick={() => void signOut()}
                >
                  Sign out
                </Button>
              </div>
            </>
          )}

          {auth.status === "signed-out" && (
            <>
              <h2 className="font-serif text-2xl">
                Keep your trips everywhere
              </h2>

              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex gap-2">
                    <span aria-hidden="true" className="text-emerald-700">
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>

              {isInApp ? (
                <div className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  <p>
                    Google sign-in doesn't work inside this app's browser. Open
                    this page in Safari or Chrome to sign in.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 h-auto w-full py-3 text-base"
                    onClick={handleCopyLink}
                  >
                    {hasCopiedLink ? "Link copied" : "Copy link"}
                  </Button>
                </div>
              ) : hasLoadFailed ? (
                <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p>Couldn't load sign-in. Check your connection.</p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => setHasLoadFailed(false)}
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mt-6 h-auto w-full gap-3 py-3 text-base"
                  disabled={!isReady}
                  onClick={handleSignIn}
                >
                  <GoogleLogo />
                  {!isReady
                    ? "Getting sign-in ready…"
                    : isSigningIn
                      ? "Signing in…"
                      : "Continue with Google"}
                </Button>
              )}

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <p className="mt-6 border-t pt-4 text-sm text-slate-500">
                No account needed to plan: without one, your trips stay in this
                browser.{" "}
                <Link
                  to={returnPath === "/trips" ? "/" : returnPath}
                  className="font-medium text-slate-900 underline"
                >
                  Continue without signing in
                </Link>
              </p>

              <p className="mt-3 text-sm text-slate-500">
                <Link to="/privacy" className="underline">
                  What's stored and how to delete it
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default SignInPage;
