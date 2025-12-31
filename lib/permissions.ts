import { Session } from 'next-auth';

export type UserRole = 'VIEWER' | 'USER' | 'ADMIN';

export interface PermissionCheck {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canAccessAudit: boolean;
    canManageUsers: boolean;
}

/**
 * Get permissions for a user based on their role
 */
export function getPermissions(role: UserRole): PermissionCheck {
    switch (role) {
        case 'VIEWER':
            return {
                canRead: true,
                canCreate: false,
                canUpdate: false,
                canDelete: false,
                canAccessAudit: false,
                canManageUsers: false,
            };

        case 'USER':
            return {
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
                canAccessAudit: false,
                canManageUsers: false,
            };

        case 'ADMIN':
            return {
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
                canAccessAudit: true,
                canManageUsers: true,
            };

        default:
            return {
                canRead: false,
                canCreate: false,
                canUpdate: false,
                canDelete: false,
                canAccessAudit: false,
                canManageUsers: false,
            };
    }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
    session: Session | null,
    permission: keyof PermissionCheck
): boolean {
    if (!session || !session.user || !session.user.role) {
        return false;
    }

    const permissions = getPermissions(session.user.role as UserRole);
    return permissions[permission];
}

/**
 * Ensure user has permission, throw error if not
 */
export function requirePermission(
    session: Session | null,
    permission: keyof PermissionCheck
): void {
    if (!hasPermission(session, permission)) {
        const action = permission.replace('can', '').toLowerCase();
        throw new Error(`Forbidden: You don't have permission to ${action}`);
    }
}
