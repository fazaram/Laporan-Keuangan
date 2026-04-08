/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Performance: Enable gzip compression
    compress: true,
    // Performance: Remove X-Powered-By header
    poweredByHeader: false,
    // Performance: Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400, // 1 day cache for optimized images
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;
