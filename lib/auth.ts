import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.error('[NextAuth] Missing credentials');
                    return null;
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                    });

                    if (!user) {
                        console.error('[NextAuth] User not found:', credentials.email);
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        console.error('[NextAuth] Invalid password for user:', credentials.email);
                        return null;
                    }

                    console.log('[NextAuth] User authenticated successfully:', user.email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('[NextAuth] Authorization error:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                console.log('[NextAuth] JWT token created for user:', user.email);
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "VIEWER" | "USER" | "ADMIN";
                console.log('[NextAuth] Session created for user:', session.user.email);
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            console.log('[NextAuth] Redirect callback - URL:', url, 'BaseURL:', baseUrl);
            // Redirect to dashboard after sign in
            if (url === baseUrl || url === `${baseUrl}/`) {
                return `${baseUrl}/dashboard`;
            }
            // Allow callback URLs on the same origin
            if (url.startsWith(baseUrl)) {
                return url;
            }
            return baseUrl;
        },
    },
    // Secret is required for production
    secret: process.env.NEXTAUTH_SECRET,
    // Enable debug mode for better error logging
    debug: true,
    // Logger for capturing errors in production
    logger: {
        error(code, metadata) {
            console.error('[NextAuth Error]', code, metadata);
        },
        warn(code) {
            console.warn('[NextAuth Warning]', code);
        },
        debug(code, metadata) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[NextAuth Debug]', code, metadata);
            }
        },
    },
};
