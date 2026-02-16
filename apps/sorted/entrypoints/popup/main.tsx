import { ClerkProvider } from "@clerk/chrome-extension";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const popupUrl = `${chrome.runtime.getURL(".")}/popup.html`;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      afterSignOutUrl={popupUrl}
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl={popupUrl}
      signUpFallbackRedirectUrl={popupUrl}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
