"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getDownloadLinkAction } from "@/app/(app)/downloads/actions";

export function DownloadButton({ assetId }: { assetId: string }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    const res = await getDownloadLinkAction(assetId);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (res.simulated) {
      toast.info("Mode demo: file asli memerlukan konfigurasi storage (R2/S3).");
    }
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button size="sm" onClick={handle} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Unduh
    </Button>
  );
}
