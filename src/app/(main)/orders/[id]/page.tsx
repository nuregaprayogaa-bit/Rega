import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Package, FileText, RefreshCw, Download, ArrowLeft } from "lucide-react";

import { getOrderForUser } from "@/server/services/order-service";
import { requireUser } from "@/server/auth-helpers";
import { formatIDR } from "@/lib/money";
import { formatDateTime, relativeDays } from "@/lib/format";
import { PACKAGE_TIER_LABEL } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { OrderActions } from "@/components/order/order-actions";
import { OrderChat } from "@/components/order/order-chat";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  const order = await getOrderForUser(id, user.id);
  if (!order) notFound();

  const isClient = order.clientId === user.id;
  const role = isClient ? "client" : "freelancer";
  const counterpart = isClient ? order.freelancer : order.client;

  return (
    <div className="container max-w-5xl py-8">
      <Link
        href={isClient ? "/orders" : "/sell/orders"}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{order.gig.title}</h1>
          <p className="text-sm text-muted-foreground">
            Order #{order.code} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Kolom utama */}
        <div className="space-y-6">
          {/* Pihak terkait */}
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="relative h-11 w-11 overflow-hidden rounded-full bg-secondary">
              {counterpart.image ? (
                <Image src={counterpart.image} alt="" fill sizes="44px" className="object-cover" />
              ) : null}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isClient ? "Freelancer" : "Client"}</p>
              <p className="font-medium">{counterpart.name}</p>
            </div>
          </div>

          {/* Brief / kebutuhan */}
          {order.requirements && (
            <Section icon={FileText} title="Brief dari client">
              <p className="whitespace-pre-wrap text-sm">{order.requirements}</p>
            </Section>
          )}

          {/* Timeline pengiriman & revisi */}
          {(order.deliveries.length > 0 || order.revisionRequests.length > 0) && (
            <Section icon={Package} title="Riwayat pengerjaan">
              <div className="space-y-3">
                {order.deliveries.map((d) => (
                  <div key={d.id} className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-success">Hasil dikirim</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(d.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{d.message}</p>
                    {d.files.map((f, i) => (
                      <a
                        key={i}
                        href={f}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Download className="h-4 w-4" /> Unduh file {i + 1}
                      </a>
                    ))}
                  </div>
                ))}
                {order.revisionRequests.map((r) => (
                  <div key={r.id} className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-700">
                        <RefreshCw className="h-3.5 w-3.5" /> Revisi diminta
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{r.message}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Chat */}
          <OrderChat
            orderId={order.id}
            currentUserId={user.id}
            messages={order.conversation?.messages ?? []}
          />
        </div>

        {/* Sidebar: ringkasan + aksi */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold">Detail pesanan</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Paket" value={PACKAGE_TIER_LABEL[order.packageTier]} />
              <Row label="Harga paket" value={formatIDR(order.packagePriceIDR)} />
              {isClient && <Row label="Biaya layanan" value={formatIDR(order.serviceFeeIDR)} />}
              <div className="my-1 border-t" />
              {isClient ? (
                <Row label="Total dibayar" value={formatIDR(order.totalIDR)} bold />
              ) : (
                <Row label="Penghasilan kamu" value={formatIDR(order.freelancerNetIDR)} bold />
              )}
              <Row label="Revisi" value={`${order.revisionsUsed}/${order.revisionsAllowed} terpakai`} />
              {order.status === "DELIVERED" && order.autoAcceptAt && (
                <Row label="Auto-selesai" value={relativeDays(order.autoAcceptAt)} />
              )}
            </dl>
          </div>

          <OrderActions
            orderId={order.id}
            status={order.status}
            role={role}
            revisionsAllowed={order.revisionsAllowed}
            revisionsUsed={order.revisionsUsed}
            hasReview={!!order.review}
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={bold ? "font-semibold" : ""}>{value}</dd>
    </div>
  );
}
