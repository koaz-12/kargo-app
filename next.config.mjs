/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    experimental: {
        serverComponentsExternalPackages: [
            'puppeteer-core',
            '@sparticuz/chromium',
            'puppeteer-extra',
            'puppeteer-extra-plugin-stealth',
            'puppeteer'
        ]
    }
};

export default nextConfig;
