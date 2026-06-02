import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/constants";

// Konfigurasi next-intl tanpa routing prefix (MVP).
// Locale ditentukan dari cookie "NEXT_LOCALE"; default Bahasa Indonesia.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = SUPPORTED_LOCALES.includes(
    (cookieLocale ?? "") as (typeof SUPPORTED_LOCALES)[number],
  )
    ? (cookieLocale as string)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
