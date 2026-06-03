import { listCategoriesAdmin } from "@/server/services/admin-service";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesAdmin();

  return (
    <div>
      <h2 className="text-lg font-semibold">Kelola Kategori</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Tambah, ubah nama, atau hapus kategori jasa.
      </p>
      <CategoryManager
        categories={categories.map((c) => ({ id: c.id, name: c.name, gigs: c._count.gigs }))}
      />
    </div>
  );
}
