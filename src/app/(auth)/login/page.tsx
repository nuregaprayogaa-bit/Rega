import { isGoogleConfigured } from "@/server/auth-helpers";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm googleEnabled={isGoogleConfigured()} />;
}
