import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { restoreSignIn } from "./utils/auth";

// Signed in on an earlier visit: load Firebase and sync the account's trips.
restoreSignIn();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
