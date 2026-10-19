import DashboardShell from "@/components/dashboard/DashboardShell";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/authorization";
import { getRolePermissions } from "@/lib/permission-store";
import { canAccessAdmin, landingPath } from "@/lib/permissions";

export default async function DashboardPage() {
  const user = await getSessionUser((await cookies()).get("admin_session")?.value);
  if (!user) redirect("/admin?next=/dashboard");
  const permissions = await getRolePermissions(user.role);
  if (!permissions["dashboard.view"]) redirect(landingPath(permissions));
  return <DashboardShell hasManagementAccess={canAccessAdmin(permissions)} />;
}
