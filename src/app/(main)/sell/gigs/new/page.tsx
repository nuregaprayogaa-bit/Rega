import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { listCategories } from "@/server/services/catalog-service";
import { Role } from "@prisma/client";
import { GigForm } from "@/components/sell/gig-form";

export const dynamic = "force-dynamic";

export default async function NewGigPage() {
  await requireRole([Role.FREELANCER, Role.ADMIN]);
  const categories = await listCategories();

  return (
    <div>
      <Link href="/sell/gigs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Buat jasa baru</h1>
      <GigForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
