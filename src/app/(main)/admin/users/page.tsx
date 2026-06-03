import Image from "next/image";

import { listAllUsers } from "@/server/services/admin-service";
import { getCurrentUser } from "@/server/auth-helpers";
import { formatDate, initials } from "@/lib/format";
import { UserRoleSelect } from "@/components/admin/user-role-select";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, me] = await Promise.all([listAllUsers(), getCurrentUser()]);

  return (
    <div>
      <h2 className="text-lg font-semibold">Pengguna</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Kelola peran pengguna. Mengubah ke Freelancer otomatis menyiapkan profil & dompet.
      </p>

      <div className="divide-y rounded-xl border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary">
              {u.image ? (
                <Image src={u.image} alt="" fill sizes="36px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                  {initials(u.name)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {u.name ?? "Tanpa nama"}
                {me?.id === u.id && <span className="ml-1 text-xs text-muted-foreground">(kamu)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              <p className="text-xs text-muted-foreground">
                {u._count.gigs} jasa · {u._count.ordersAsClient} order · gabung {formatDate(u.createdAt)}
              </p>
            </div>
            <UserRoleSelect userId={u.id} role={u.role} disabled={me?.id === u.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
