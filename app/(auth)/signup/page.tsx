import { AuthScreen } from "@/components/auth/auth-screen";
import { isDemoModeEnabled } from "@/lib/env.server";

export default function SignupPage() {
  return <AuthScreen mode="signup" demoModeEnabled={isDemoModeEnabled} />;
}
