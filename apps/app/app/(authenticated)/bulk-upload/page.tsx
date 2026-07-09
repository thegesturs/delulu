import { Suspense } from "react";
import { BulkUploadPage } from "@/components/bulk-upload/bulk-upload-page";

export const dynamic = "force-dynamic";

export default function BulkUploadRoute() {
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex-1">
        <Suspense>
          <BulkUploadPage />
        </Suspense>
      </div>
    </div>
  );
}
