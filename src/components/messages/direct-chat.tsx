"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { initials, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { sendDirectMessageAction } from "@/app/(main)/messages/actions";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string | Date;
  sender: { id: string; name: string | null; image: string | null };
};

export function DirectChat({
  threadId,
  messages: initialMessages,
  currentUserId,
}: {
  threadId: string;
  messages: ChatMessage[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${threadId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      /* abaikan */
    }
  }, [threadId]);

  useEffect(() => {
    const id = setInterval(poll, 5000);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [poll]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send() {
    const text = body.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await sendDirectMessageAction(threadId, text);
      if (res?.error) toast.error(res.error);
      else {
        setBody("");
        await poll();
      }
    });
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border bg-card">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="my-auto text-center text-sm text-muted-foreground">
            Belum ada pesan. Sapa dulu 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender.id === currentUserId;
            return (
              <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-secondary">
                  {m.sender.image ? (
                    <Image src={m.sender.image} alt="" fill sizes="28px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold">
                      {initials(m.sender.name)}
                    </span>
                  )}
                </div>
                <div className={cn("max-w-[75%]", mine && "text-right")}>
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-3 py-2 text-sm",
                      mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                    )}
                  >
                    {m.body}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t p-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Tulis pesan..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button size="icon" onClick={send} disabled={isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
