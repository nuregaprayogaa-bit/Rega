import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { listCategories } from "@/server/services/catalog-service";
import { JobForm } from "@/components/jobs/job-form";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  await requireUser("/jobs/new");
  const categories = await listCategories();

  return (
    <div className="container max-w-2xl py-8">
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Kembali ke papan pekerjaan
      </Link>
      <h1 className="mb-1 text-2xl font-bold">Posting Pekerjaan</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Jelaskan kebutuhanmu, dan biarkan freelancer mengirim penawaran terbaik.
      </p>
      <JobForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
