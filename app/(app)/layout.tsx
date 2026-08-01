import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profiles";
import { listNotifications } from "@/lib/db/notifications";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profile, notifications] = await Promise.all([
    user ? getProfile(user.id) : Promise.resolve(null),
    user ? listNotifications(user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar userName={profile?.full_name ?? ""} userEmail={user?.email ?? ""} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar notifications={notifications} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
