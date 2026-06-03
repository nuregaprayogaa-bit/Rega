import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { getMyGig } from "@/server/services/gig-service";
import { listCategories } from "@/server/services/catalog-service";
import { Role } from "@prisma/client";
import { GigForm, type GigFormInitial } from "@/components/sell/gig-form";

export const dynamic = "force-dynamic";

export default async function EditGigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const { id } = await params;
  const [gig, categories] = await Promise.all([getMyGig(user.id, id), listCategories()]);
  if (!gig) notFound();

  const initial: GigFormInitial = {
    id: gig.id,
    title: gig.title,
    description: gig.description,
    categoryId: gig.categoryId ?? categories[0]?.id ?? "",
    coverImage: gig.coverImage ?? "",
    gallery: gig.gallery,
    packages: gig.packages.map((p) => ({
      tier: p.tier,
      title: p.title,
      description: p.description,
      priceIDR: p.priceIDR,
      deliveryDays: p.deliveryDays,
      revisions: p.revisions,
      deliverables: p.deliverables,
    })),
  };

  return (
    <div>
      <Link href="/sell/gigs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Edit jasa</h1>
      <GigForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} initial={initial} />
    </div>
  );
}
