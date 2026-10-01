import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import CityPage from "./pages/city";
import TripsPage from "./pages/trips";
import SavedTripPage from "./pages/saved-trip";
import TripViewPage from "./pages/trip-view";
import SignInPage from "./pages/sign-in";
import NotFound from "./pages/not-found";
import Navbar from "./components/navbar";

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

// A data router is needed for useBlocker, which warns before leaving an unsaved trip.
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/sign-in", element: <SignInPage /> },
      { path: "/city/:id", element: <CityPage /> },
      { path: "/trips", element: <TripsPage /> },
      // Open: a read-only view. Edit: the full planner.
      { path: "/trips/:tripId", element: <TripViewPage /> },
      { path: "/trips/:tripId/edit", element: <SavedTripPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
