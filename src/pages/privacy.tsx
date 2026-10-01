import { useState, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/confirm-dialog";
import PageBanner from "../components/page-banner";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/use-auth";
import { useSavedTrips } from "../hooks/use-saved-trips";
import { deleteAccount } from "../utils/auth";

const LAST_UPDATED = "1 October 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-700">{children}</div>
    </section>
  );
}

function DeleteAccount() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const tripCount = useSavedTrips().length;

  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsConfirming(false);
    setIsDeleting(true);
    setError("");

    const result = await deleteAccount();

    if (result === "deleted") {
      // A fresh start: Firebase is shut down after deleting.
      window.location.replace("/privacy?deleted=1");
      return;
    }

    setIsDeleting(false);
    setError(result === "cancelled" ? "" : result);
  }

  if (auth.status !== "signed-in") {
    return (
      <p>
        To delete an account,{" "}
        <Link
          to="/sign-in"
          state={{ from: pathname }}
          className="font-medium text-slate-900 underline"
        >
          sign in
        </Link>{" "}
        first and come back to this page.
      </p>
    );
  }

  return (
    <div className="border border-red-200 bg-red-50/50 p-5">
      <p>
        Signed in as{" "}
        <strong className="font-medium text-slate-900">
          {auth.user.email || auth.user.name}
        </strong>
        .
      </p>
      <p className="mt-2 text-sm">
        Deleting your account removes it and everything saved in it, on every
        device. Google will ask you to confirm it's you.
      </p>

      <Button
        variant="destructive"
        className="mt-4 h-auto px-5 py-3 text-base"
        disabled={isDeleting}
        onClick={() => setIsConfirming(true)}
      >
        {isDeleting ? "Deleting…" : "Delete my account"}
      </Button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={isConfirming}
        title="Delete your account?"
        confirmLabel="Delete my account"
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsConfirming(false)}
      >
        <p>
          Your account and{" "}
          <strong className="font-medium text-slate-900">
            {tripCount} {tripCount === 1 ? "trip" : "trips"}
          </strong>
          , plus any places you added yourself, will be permanently deleted from
          every device.
        </p>
        <p className="mt-2">This can't be undone.</p>
      </ConfirmDialog>
    </div>
  );
}

function PrivacyPage() {
  const [searchParams] = useSearchParams();
  const wasDeleted = searchParams.get("deleted") === "1";

  return (
    <>
      <PageBanner eyebrow="Your data" title="Privacy" />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="max-w-3xl">
          {wasDeleted && (
            <p
              role="status"
              className="mb-10 border border-emerald-300 bg-emerald-50 p-4 text-emerald-900"
            >
              Your account and everything saved in it have been deleted.
            </p>
          )}

          <p className="text-lg text-slate-700">
            ItiPlanner keeps as little about you as it can. There are no ads, no
            analytics or tracking, and nothing is sold or shared for marketing.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Last updated {LAST_UPDATED}.
          </p>

          <div className="mt-10">
            <Section title="Without an account">
              <p>
                Everything stays in this browser: your trips, the trip you're
                planning but haven't saved, places you've added yourself, and
                copies of place lists and city photos so pages load faster.
              </p>
              <p>
                You can delete trips on{" "}
                <Link to="/trips" className="font-medium underline">
                  My trips
                </Link>
                , or remove everything by clearing this site's data in your
                browser settings.
              </p>
            </Section>

            <Section title="With an account">
              <p>
                Signing in with Google uses Firebase, a Google service.
                ItiPlanner receives your name, email address and an account id
                from Google, never your password.
              </p>
              <p>
                Your trips and the places you've added are stored in Google
                Cloud Firestore under your account, so they can appear on your
                other devices. Only you can read or change them.
              </p>
              <p>
                Signing out removes them from that browser. They stay in your
                account until you delete them or the account.
              </p>
            </Section>

            <Section title="Services ItiPlanner uses">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="font-medium text-slate-900">
                    City search and places:
                  </strong>{" "}
                  searches go through ItiPlanner's server to Geoapify, and place
                  details come from Wikidata, Wikipedia, Wikimedia Commons and
                  Wikivoyage. These services see the city, not who you are.
                </li>
                <li>
                  <strong className="font-medium text-slate-900">
                    Fair-use limits:
                  </strong>{" "}
                  to stop one visitor using up the free place lookups, the
                  server counts lookups per visitor per day. It stores a
                  scrambled (hashed) version of your IP address for this, never
                  the address itself.
                </li>
                <li>
                  <strong className="font-medium text-slate-900">
                    Weather and maps:
                  </strong>{" "}
                  your browser asks Open-Meteo for the forecast at the trip's
                  city and loads map images from OpenStreetMap. Like any
                  website, they see your IP address when it does.
                </li>
                <li>
                  <strong className="font-medium text-slate-900">
                    Hosting:
                  </strong>{" "}
                  the site runs on Netlify, which keeps standard server logs.
                </li>
              </ul>
            </Section>

            <Section title="Delete your account">
              <DeleteAccount />
            </Section>
          </div>
        </div>
      </main>
    </>
  );
}

export default PrivacyPage;
