"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

export function ApiExplorer() {
  return (
    <ApiReferenceReact
      configuration={{
        url: "/openapi.json",
        layout: "modern",
        theme: "default",
        hideClientButton: true,
        persistAuth: false,
        showSidebar: true,
      }}
    />
  );
}
