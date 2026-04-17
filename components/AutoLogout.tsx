'use client';

import { useEffect, useCallback, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';

export function AutoLogout({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const timeoutRef = useRef<NodeJS.Timeout>();

    const handleLogout = useCallback(() => {
        if (status === 'authenticated') {
            console.log('[AutoLogout] User idle for 5 minutes, logging out...');
            signOut({ callbackUrl: '/login' });
        }
    }, [status]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Set timeout for 5 minutes (5 * 60 * 1000 = 300000 ms)
        timeoutRef.current = setTimeout(handleLogout, 300000);
    }, [handleLogout]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        // Reset timer on load
        resetTimer();

        // Events that indicate user activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart'
        ];

        const handleActivity = () => {
            resetTimer();
        };

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [status, resetTimer]);

    return <>{children}</>;
}
