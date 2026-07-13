import { Suspense } from "react";
import { BulkUploadPage } from "@/components/bulk-upload/bulk-upload-page";

export const dynamic = "force-dynamic";

export default function BulkUploadRoute() {
  return (
    <Suspense>
      <BulkUploadPage />
    </Suspense>
  );
}
