"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { toast } from "sonner";

import { setUserRoleAction } from "@/app/(main)/admin/actions";

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={role}
      disabled={disabled || isPending}
      onChange={(e) => {
        const next = e.target.value as Role;
        startTransition(async () => {
          const res = await setUserRoleAction(userId, next);
          if (res.ok) {
            toast.success("Peran diperbarui");
            router.refresh();
          } else toast.error("Gagal mengubah peran.");
        });
      }}
      className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      <option value="CLIENT">Client</option>
      <option value="FREELANCER">Freelancer</option>
      <option value="ADMIN">Admin</option>
    </select>
  );
}
