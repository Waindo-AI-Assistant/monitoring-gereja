import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/roles";
import { defaultMatrix, defaultPermissions, readStoredPermissions, type Permissions, type PermissionMatrix } from "@/lib/permissions";

export async function getRolePermissions(role: Role): Promise<Permissions> {
  if (role === "superadmin") return defaultPermissions(role);
  const row = await prisma.rolePermission.findUnique({ where: { role } });
  return row ? readStoredPermissions(row.permissions) : defaultPermissions(role);
}

export async function getPermissionMatrix(): Promise<PermissionMatrix> {
  const rows = await prisma.rolePermission.findMany();
  const matrix = defaultMatrix();
  for (const role of ROLES) {
    if (role === "superadmin") continue;
    const row = rows.find((item) => item.role === role);
    if (row) matrix[role] = readStoredPermissions(row.permissions);
  }
  return matrix;
}

export async function savePermissionMatrix(matrix: PermissionMatrix): Promise<void> {
  await prisma.$transaction(ROLES.filter((role) => role !== "superadmin").map((role) => prisma.rolePermission.upsert({
    where: { role },
    create: { role, permissions: matrix[role] },
    update: { permissions: matrix[role] },
  })));
}
