import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { useSavedTrips } from "../hooks/use-saved-trips";
import AccountMenu from "./account-menu";

function focusCityField() {
  document.getElementById("city")?.focus();
}

function Navbar() {
  const { pathname } = useLocation();

  const savedTripCount = useSavedTrips().length;
  const myTripsLabel =
    savedTripCount > 0 ? `My trips (${savedTripCount})` : "My trips";

  // The menu remembers which page it was opened on, so it closes itself after navigating.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const isMenuOpen = menuOpenOn === pathname;

  // On the home page the navbar sits on top of the hero photo.
  const isOverHero = pathname === "/";

  // The home page already has the trip search, so its main button is Sign in.
  const authStatus = useAuth().status;
  const showsHomeSignIn = isOverHero && authStatus === "signed-out";

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpenOn(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  function closeMenu() {
    setMenuOpenOn(null);
  }

  function navLinkClass({ isActive }: { isActive: boolean }) {
    if (isOverHero) {
      return isActive
        ? "font-medium text-white"
        : "font-medium text-white/80 hover:text-white";
    }

    return isActive
      ? "font-medium text-slate-900"
      : "font-medium text-slate-500 hover:text-slate-900";
  }

  function mobileLinkClass({ isActive }: { isActive: boolean }) {
    return `block px-6 py-3 font-medium ${
      isActive ? "text-slate-900" : "text-slate-500"
    }`;
  }

  return (
    <nav
      className={
        isOverHero
          ? "absolute inset-x-0 top-0 z-30"
          : "relative z-30 border-b bg-white"
      }
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link
          to="/"
          className={`text-xl font-medium tracking-[0.3em] uppercase ${
            isOverHero ? "text-white" : "text-slate-900"
          }`}
        >
          ItiPlanner
        </Link>

        <div className="hidden items-center gap-8 sm:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/trips" className={navLinkClass}>
            {myTripsLabel}
          </NavLink>

          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>

          {showsHomeSignIn ? (
            <Link
              to="/sign-in"
              state={{ from: "/" }}
              className="bg-white px-5 py-3 font-medium text-slate-900 hover:bg-white/90"
            >
              Sign in
            </Link>
          ) : (
            <AccountMenu layout="desktop" isOverHero={isOverHero} />
          )}

          {!isOverHero && (
            <Link
              to="/"
              onClick={focusCityField}
              className="bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
            >
              Plan a trip
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpenOn(isMenuOpen ? null : pathname)}
          className={`px-4 py-2 font-medium sm:hidden ${
            isOverHero
              ? "border border-white/60 text-white"
              : "border text-slate-900"
          }`}
        >
          {isMenuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-t border-b bg-white shadow-lg sm:hidden"
        >
          <NavLink to="/" end className={mobileLinkClass} onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/trips" className={mobileLinkClass} onClick={closeMenu}>
            {myTripsLabel}
          </NavLink>

          <NavLink to="/about" className={mobileLinkClass} onClick={closeMenu}>
            About
          </NavLink>

          <AccountMenu layout="mobile" onDone={closeMenu} />

          {!isOverHero && (
            <div className="px-6 pt-2 pb-5">
              <Link
                to="/"
                onClick={() => {
                  closeMenu();
                  focusCityField();
                }}
                className="block bg-slate-900 px-5 py-3 text-center font-medium text-white"
              >
                Plan a trip
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
export default Navbar;
