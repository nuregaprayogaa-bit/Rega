import Link from "next/link";
import { Camera } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-xl font-bold"
      >
        <Camera className="h-7 w-7 text-primary" />
        {APP_NAME}
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
