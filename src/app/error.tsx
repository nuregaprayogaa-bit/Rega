"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <div>
        <p className="text-5xl">😵‍💫</p>
        <h1 className="mt-4 text-xl font-bold">Terjadi kesalahan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maaf, ada yang tidak beres. Coba lagi sebentar.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Coba lagi</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Ke beranda
        </Button>
      </div>
    </div>
  );
}
