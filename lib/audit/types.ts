export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export interface AuditLogData {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuditLogEntry {
    id: string;
    userId: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    action: AuditAction;
    entityType: string;
    entityId: string;
    oldData: any;
    newData: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
}
