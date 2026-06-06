import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { getThread } from "@/server/services/message-thread-service";
import { initials } from "@/lib/format";
import { DirectChat } from "@/components/messages/direct-chat";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  const thread = await getThread(id, user.id);
  if (!thread) notFound();

  return (
    <div className="container max-w-2xl py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={`/freelancer/${thread.other.id}`} className="flex items-center gap-2">
          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-secondary">
            {thread.other.image ? (
              <Image src={thread.other.image} alt="" fill sizes="36px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                {initials(thread.other.name)}
              </span>
            )}
          </div>
          <span className="font-semibold hover:text-primary">{thread.other.name}</span>
        </Link>
      </div>

      <DirectChat
        threadId={thread.id}
        currentUserId={user.id}
        messages={thread.messages}
      />
    </div>
  );
}
