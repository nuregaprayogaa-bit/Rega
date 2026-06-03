import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { getMyProfile } from "@/server/services/profile-service";
import { db } from "@/server/db";
import { Role } from "@prisma/client";
import { ProfileForm } from "@/components/sell/profile-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SellProfilePage() {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const [profile, dbUser] = await Promise.all([
    getMyProfile(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, image: true } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profil Freelancer</h1>
          <p className="text-sm text-muted-foreground">
            Profil ini tampil ke calon client. Lengkapi agar lebih dipercaya.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/freelancer/${user.id}`} target="_blank">
            Lihat publik <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <ProfileForm
          initial={{
            name: dbUser?.name ?? "",
            image: dbUser?.image ?? "",
            headline: profile?.headline ?? "",
            bio: profile?.bio ?? "",
            location: profile?.location ?? "",
            skills: profile?.skills ?? [],
          }}
        />
      </div>
    </div>
  );
}
