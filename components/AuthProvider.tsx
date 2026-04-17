'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { AutoLogout } from './AutoLogout';

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <AutoLogout>
                {children}
            </AutoLogout>
        </SessionProvider>
    );
}
