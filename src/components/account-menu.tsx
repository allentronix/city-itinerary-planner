import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { getSyncMessage, signOut } from "../utils/auth";
import { cn } from "../lib/utils";
import { Button, buttonVariants } from "./ui/button";

interface AccountMenuProps {
  // "desktop" sits in the navbar row; "mobile" fills the phone menu.
  layout: "desktop" | "mobile";
  isOverHero?: boolean;
  onDone?: () => void;
}

function AccountMenu({ layout, isOverHero = false, onDone }: AccountMenuProps) {
  const auth = useAuth();
  const { pathname } = useLocation();

  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account dropdown on Escape or a click elsewhere.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleSignOut() {
    setIsOpen(false);
    await signOut();
    onDone?.();
  }

  // Sign-in isn't set up (no Firebase config), or a sign-in is being restored.
  if (auth.status === "unavailable" || auth.status === "loading") {
    return null;
  }

  const textClass = isOverHero
    ? "font-medium text-white/80 hover:text-white"
    : "font-medium text-slate-500 hover:text-slate-900";

  // The sign-in page sends people back here afterwards.
  const signInState = { from: pathname };

  if (layout === "mobile") {
    return (
      <div className="border-t px-6 py-4">
        {auth.status === "signed-in" ? (
          <>
            <p className="text-sm text-slate-900">
              Signed in as{" "}
              <span className="font-medium">
                {auth.user.email || auth.user.name}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {getSyncMessage(auth)}
            </p>
            <Button
              variant="outline"
              className="mt-3 h-auto w-full py-3"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Link
              to="/sign-in"
              state={signInState}
              onClick={onDone}
              // cn() resolves the base and outline border classes, as <Button> does.
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto w-full py-3",
              )}
            >
              Sign in
            </Link>
            <p className="mt-2 text-xs text-slate-500">
              Keep your trips on all your devices.
            </p>
          </>
        )}
      </div>
    );
  }

  if (auth.status === "signed-out") {
    return (
      <NavLink
        to="/sign-in"
        state={signInState}
        className={({ isActive }) =>
          isActive && !isOverHero ? "font-medium text-slate-900" : textClass
        }
      >
        Sign in
      </NavLink>
    );
  }

  const firstName = auth.user.name.split(" ")[0];

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex items-center gap-1.5 ${textClass}`}
      >
        {firstName}
        <span aria-hidden="true" className="text-xs">
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-72 border bg-white p-4 text-left shadow-lg">
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Signed in as
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900">
            {auth.user.email || auth.user.name}
          </p>
          <p
            className={`mt-2 text-xs ${auth.hasSyncError ? "text-amber-700" : "text-slate-500"}`}
          >
            {getSyncMessage(auth)}
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
