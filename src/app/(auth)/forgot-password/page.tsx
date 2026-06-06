"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

import { forgotPasswordAction } from "../actions";
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

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    startTransition(async () => {
      const res = await forgotPasswordAction({ email });
      if (res?.error) toast.error(res.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MailCheck className="h-6 w-6 text-success" /> Cek email kamu
          </CardTitle>
          <CardDescription>
            Jika email terdaftar, kami sudah mengirim link untuk mengatur ulang kata sandi
            (berlaku 1 jam). Cek juga folder spam.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Kembali ke Masuk</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Lupa kata sandi</CardTitle>
        <CardDescription>
          Masukkan email akunmu. Kami kirim link untuk membuat kata sandi baru.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="nama@email.com" required autoComplete="email" />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Mengirim..." : "Kirim link reset"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Ingat kata sandi?
        <Link href="/login" className="ml-1 font-medium text-primary">Masuk</Link>
      </CardFooter>
    </Card>
  );
}
