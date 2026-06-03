"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { becomeFreelancerAction } from "@/app/actions/session";

/**
 * Tombol upgrade jadi freelancer untuk user yang SUDAH login sebagai client.
 * Setelah upgrade, sesi disegarkan (update) agar peran langsung berlaku,
 * lalu diarahkan ke halaman lengkapi profil.
 */
export function BecomeFreelancerButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await becomeFreelancerAction();
          if (!res.ok) {
            toast.error("Gagal. Coba lagi.");
            return;
          }
          await update(); // segarkan JWT -> role FREELANCER
          toast.success("Selamat datang, Freelancer! Lengkapi profilmu.");
          router.push("/sell/profile");
          router.refresh();
        })
      }
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-60",
        className,
      )}
    >
      {isPending ? "Memproses..." : (children ?? "Jadi Freelancer")}
    </button>
  );
}
