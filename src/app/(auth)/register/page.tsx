"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { registerAction, loginAction } from "../actions";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"CLIENT" | "FREELANCER">(
    params.get("role") === "freelancer" ? "FREELANCER" : "CLIENT",
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      confirmPassword: String(fd.get("confirmPassword")),
      role,
    };

    startTransition(async () => {
      const res = await registerAction(payload);
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Akun berhasil dibuat");
      await loginAction({
        email: payload.email,
        password: payload.password,
        callbackUrl: role === "FREELANCER" ? "/sell" : "/dashboard",
      });
      router.push(role === "FREELANCER" ? "/sell/profile" : "/dashboard");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Buat akun Rega</CardTitle>
        <CardDescription>Gratis. Pilih cara kamu menggunakan Rega.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pemilih peran */}
        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            active={role === "CLIENT"}
            onClick={() => setRole("CLIENT")}
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Saya Client"
            desc="Mau pesan jasa"
          />
          <RoleCard
            active={role === "FREELANCER"}
            onClick={() => setRole("FREELANCER")}
            icon={<Briefcase className="h-5 w-5" />}
            title="Saya Freelancer"
            desc="Mau jual jasa"
          />
        </div>

        <GoogleButton callbackUrl={role === "FREELANCER" ? "/sell" : "/dashboard"} />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ATAU</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="nama@email.com" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata sandi</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi kata sandi</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Memproses..." : "Daftar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Sudah punya akun?
        <Link href="/login" className="ml-1 font-medium text-primary">Masuk</Link>
      </CardFooter>
    </Card>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-colors",
        active ? "border-primary bg-secondary" : "border-border hover:border-primary/50",
      )}
    >
      <span className={cn("text-primary", !active && "text-muted-foreground")}>{icon}</span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}
