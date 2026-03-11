import { ClerkProvider } from "@clerk/chrome-extension";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const SYNC_HOST = import.meta.env.VITE_CLERK_SYNC_HOST;
const popupUrl = `${chrome.runtime.getURL(".")}/popup.html`;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      afterSignOutUrl={popupUrl}
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl={popupUrl}
      signUpFallbackRedirectUrl={popupUrl}
      syncHost={SYNC_HOST}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
