import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Plus Jakarta Sans — tipografi modern yang dirancang di Indonesia,
// memberi karakter lokal & orisinal pada brand Rega.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description:
    "Rega adalah marketplace jasa freelance Indonesia. Pesan jasa desain, penulisan, video, web, dan banyak lagi dengan pembayaran aman (escrow). Harga Rupiah, pembayaran lokal (QRIS, VA, e-wallet).",
  keywords: ["freelance", "jasa", "marketplace", "Indonesia", "Rega", "desain", "programmer"],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
          <Toaster position="top-center" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
