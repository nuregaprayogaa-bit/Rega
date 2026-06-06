import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { listThreads } from "@/server/services/message-thread-service";
import { initials, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const threads = await listThreads(user.id);

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <MessageCircle className="h-6 w-6 text-primary" /> Pesan
      </h1>
      <p className="text-sm text-muted-foreground">Percakapan langsung dengan freelancer & client</p>

      {threads.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada percakapan</p>
          <p className="text-sm text-muted-foreground">
            Mulai chat dari halaman jasa atau profil freelancer.
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y rounded-xl border">
          {threads.map((t) => (
            <Link key={t.id} href={`/messages/${t.id}`} className="flex items-center gap-3 p-3 hover:bg-secondary/50">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-secondary">
                {t.other.image ? (
                  <Image src={t.other.image} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
                    {initials(t.other.name)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.other.name}</p>
                <p className="truncate text-sm text-muted-foreground">{t.lastMessage ?? "Mulai percakapan"}</p>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">{formatDateTime(t.lastAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
