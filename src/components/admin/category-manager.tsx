"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategoryAction,
  renameCategoryAction,
  deleteCategoryAction,
} from "@/app/(main)/admin/actions";

type Cat = { id: string; name: string; gigs: number };

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function add() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const res = await createCategoryAction(newName);
      if (res.ok) {
        toast.success("Kategori ditambahkan");
        setNewName("");
        router.refresh();
      } else toast.error(res.error ?? "Gagal");
    });
  }

  function saveRename(id: string) {
    startTransition(async () => {
      const res = await renameCategoryAction(id, editName);
      if (res.ok) {
        toast.success("Kategori diubah");
        setEditing(null);
        router.refresh();
      } else toast.error(res.error ?? "Gagal");
    });
  }

  function remove(id: string) {
    if (!confirm("Hapus kategori ini?")) return;
    startTransition(async () => {
      const res = await deleteCategoryAction(id);
      if (res.ok) {
        toast.success("Kategori dihapus");
        router.refresh();
      } else toast.error(res.error ?? "Gagal");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama kategori baru, mis. Voice Over"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" /> Tambah
        </Button>
      </div>

      <div className="divide-y rounded-xl border">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3">
            {editing === c.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8"
                  onKeyDown={(e) => e.key === "Enter" && saveRename(c.id)}
                />
                <Button size="sm" disabled={isPending} onClick={() => saveRename(c.id)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                  Batal
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.gigs} jasa</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(c.id);
                    setEditName(c.name);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={isPending}
                  onClick={() => remove(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
