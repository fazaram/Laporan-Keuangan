import { prisma } from '@/lib/db';
import { AuditAction, AuditLogData } from './types';
import { NextRequest } from 'next/server';

export class AuditLogger {
    /**
     * Log a CREATE action
     */
    static async logCreate(
        userId: string,
        entityType: string,
        entityId: string,
        newData: any,
        request?: NextRequest
    ) {
        return this.log({
            userId,
            action: AuditAction.CREATE,
            entityType,
            entityId,
            newData,
            ipAddress: this.getIpAddress(request),
            userAgent: this.getUserAgent(request),
        });
    }

    /**
     * Log an UPDATE action
     */
    static async logUpdate(
        userId: string,
        entityType: string,
        entityId: string,
        oldData: any,
        newData: any,
        request?: NextRequest
    ) {
        return this.log({
            userId,
            action: AuditAction.UPDATE,
            entityType,
            entityId,
            oldData,
            newData,
            ipAddress: this.getIpAddress(request),
            userAgent: this.getUserAgent(request),
        });
    }

    /**
     * Log a DELETE action
     */
    static async logDelete(
        userId: string,
        entityType: string,
        entityId: string,
        oldData: any,
        request?: NextRequest
    ) {
        return this.log({
            userId,
            action: AuditAction.DELETE,
            entityType,
            entityId,
            oldData,
            ipAddress: this.getIpAddress(request),
            userAgent: this.getUserAgent(request),
        });
    }

    /**
     * Core logging function
     */
    private static async log(data: AuditLogData) {
        try {
            const auditLog = await prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    oldData: data.oldData || null,
                    newData: data.newData || null,
                    ipAddress: data.ipAddress || null,
                    userAgent: data.userAgent || null,
                },
            });

            return auditLog;
        } catch (error) {
            console.error('Error creating audit log:', error);
            // Don't throw error - audit logging should not break the main operation
            return null;
        }
    }

    /**
     * Get IP address from request
     */
    private static getIpAddress(request?: NextRequest): string | undefined {
        if (!request) return undefined;

        const forwarded = request.headers.get('x-forwarded-for');
        const ip = request.headers.get('x-real-ip');

        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }

        return ip || undefined;
    }

    /**
     * Get user agent from request
     */
    private static getUserAgent(request?: NextRequest): string | undefined {
        if (!request) return undefined;
        return request.headers.get('user-agent') || undefined;
    }

    /**
     * Get audit logs for a specific entity
     */
    static async getEntityLogs(entityType: string, entityId: string) {
        return prisma.auditLog.findMany({
            where: {
                entityType,
                entityId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * Get all audit logs with filters
     */
    static async getLogs(filters: {
        userId?: string;
        action?: AuditAction;
        entityType?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};

        if (filters.userId) where.userId = filters.userId;
        if (filters.action) where.action = filters.action;
        if (filters.entityType) where.entityType = filters.entityType;

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: filters.limit || 50,
                skip: filters.offset || 0,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return { logs, total };
    }
}
