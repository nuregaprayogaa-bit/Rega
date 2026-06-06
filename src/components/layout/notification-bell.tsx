"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAllReadAction } from "@/app/actions/notifications";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({
  initialItems,
  initialUnread,
}: {
  initialItems: Notif[];
  initialUnread: number;
}) {
  const [items, setItems] = useState<Notif[]>(initialItems);
  const [unread, setUnread] = useState(initialUnread);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* abaikan error polling */
    }
  }, []);

  // Ambil saat dimuat + polling near-real-time + saat tab kembali fokus.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 25000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  async function onOpenChange(open: boolean) {
    if (open && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      await markAllReadAction();
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger className="relative rounded-full p-2 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifikasi</span>
          {items.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCheck className="h-3.5 w-3.5" /> Tersimpan
            </span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Belum ada notifikasi.
            </p>
          ) : (
            items.map((n) => {
              const content = (
                <div
                  className={cn(
                    "flex flex-col gap-0.5 px-3 py-2.5 transition-colors hover:bg-secondary",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <p className="text-sm font-medium leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} className="block border-b last:border-0">
                  {content}
                </Link>
              ) : (
                <div key={n.id} className="border-b last:border-0">{content}</div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
