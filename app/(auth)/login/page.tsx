import { AuthScreen } from "@/components/auth/auth-screen";
import { isDemoModeEnabled } from "@/lib/env.server";

export default function LoginPage() {
  return <AuthScreen mode="login" demoModeEnabled={isDemoModeEnabled} />;
}
