import { ApiKeysClient } from "./api-keys-client";

export const dynamic = "force-dynamic";

export default function ApiKeysPage() {
  return (
    <div className="min-h-screen overflow-auto bg-background">
      <ApiKeysClient />
    </div>
  );
}
