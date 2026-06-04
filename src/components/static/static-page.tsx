export function StaticPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {lead && <p className="mt-2 text-muted-foreground">{lead}</p>}
      <div className="prose-worq mt-8 space-y-4 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
