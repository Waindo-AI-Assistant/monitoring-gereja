import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/authorization";
import { getRolePermissions } from "@/lib/permission-store";
import { canAccessAdmin, landingPath } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser((await cookies()).get("admin_session")?.value);
  if (user) {
    const permissions = await getRolePermissions(user.role);
    if (!canAccessAdmin(permissions)) redirect(landingPath(permissions));
  }
  return children;
}
