import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAdminPage = req.nextUrl.pathname.startsWith('/admin');

        // If it's an admin page and user is not admin, redirect to dashboard
        if (isAdminPage && token?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // If it's a regular user page and user is admin, redirect to admin dashboard
        const pathname = req.nextUrl.pathname;
        const isUserPage = 
            pathname.startsWith('/dashboard') || 
            pathname.startsWith('/transactions') || 
            pathname.startsWith('/goals') || 
            pathname.startsWith('/reports') || 
            pathname.startsWith('/smart-wallet') || 
            pathname.startsWith('/profile') || 
            pathname.startsWith('/audit');
            
        if (isUserPage && token?.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/transactions/:path*',
        '/reports/:path*',
        '/goals/:path*',
        '/smart-wallet/:path*',
        '/profile/:path*',
        '/admin/:path*',
    ],
};
