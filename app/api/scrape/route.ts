import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Puppeteer imports
let chromium: any;

export async function POST(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'URL Missing' }, { status: 400 });

        // Clean URL to remove tracking params which might trigger anti-bot
        // Exception: Keep 'top_gallery_url' if present, but usually we just want the base product page
        // Let's try base URL first.
        // Actually, user's URL has a lot of tracking.
        const cleanUrl = url.split('?')[0];
        console.log('Launching Puppeteer for Clean URL:', cleanUrl);

        let browser;
        try {
            if (process.env.NODE_ENV === 'production') {
                // Production: Use sparticuz/chromium with puppeteer-core
                if (!chromium) chromium = require('@sparticuz/chromium');
                const puppeteerCore = require('puppeteer-core');
                // Stealth doesn't work easily with pure core on Vercel without extra setup, 
                // but usually Vercel IP + headless is enough or gets blocked anyway.
                // For now, keep standard core for prod.
                browser = await puppeteerCore.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless,
                    ignoreHTTPSErrors: true,
                });
            } else {
                // Local: Use puppeteer-extra + stealth
                const puppeteer = require('puppeteer-extra');
                const StealthPlugin = require('puppeteer-extra-plugin-stealth');
                puppeteer.use(StealthPlugin());

                browser = await puppeteer.launch({
                    headless: "new",
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            }

            const page = await browser.newPage();

            // Standard Viewport
            await page.setViewport({ width: 1920, height: 1080 });

            // Block resources
            await page.setRequestInterception(true);
            page.on('request', (req: any) => {
                const resourceType = req.resourceType();
                if (['stylesheet', 'font', 'image'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // Navigate
            await page.goto(cleanUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // Extract Data
            const data = await page.evaluate(() => {
                const getPrice = (text: string | null) => {
                    if (!text) return 0;
                    const parsed = parseFloat(text.replace(/[^\d.]/g, ''));
                    return isNaN(parsed) ? 0 : parsed;
                };

                const title = document.querySelector('h1')?.innerText ||
                    document.querySelector('.product-name')?.textContent ||
                    document.title;

                let image = '';
                const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
                if (ogImage) image = ogImage;

                if (!image) {
                    const imgEl = document.querySelector('img.main-image') || document.querySelector('img[class*="product-image"]');
                    if (imgEl) image = (imgEl as HTMLImageElement).src;
                }

                let price = 0;

                // 1. Meta Tags
                const metaPrice = document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content');
                if (metaPrice) price = getPrice(metaPrice);

                // 2. DOM Selectors
                if (price === 0) {
                    const priceEl = document.querySelector('.g-price') ||
                        document.querySelector('[data-test="pay-price"]') ||
                        document.querySelector('[class*="product-price"]') ||
                        document.querySelector('span[data-type="0"]');
                    if (priceEl) price = getPrice(priceEl.textContent);
                }

                // 3. Regex Fallback
                if (price === 0) {
                    const match = document.body.innerText.match(/\$\s?(\d{1,4}\.\d{2})/);
                    if (match) price = parseFloat(match[1]);
                }

                return {
                    title: title?.trim(),
                    image,
                    price,
                    debugTitle: document.title
                };
            });

            await browser.close();

            // Restore image from original URL if local failed (Temu specific)
            // If the original URL had 'top_gallery_url', use it as fallback
            const originalUrlObj = new URL(url);
            const topGalleryUrl = originalUrlObj.searchParams.get('top_gallery_url');
            if (topGalleryUrl && !data.image) {
                data.image = decodeURIComponent(topGalleryUrl);
            }

            console.log('Puppeteer Result:', data);
            return NextResponse.json(data);

        } catch (error: any) {
            console.error('Puppeteer Error:', error);
            if (browser) await browser.close();
            return NextResponse.json({ error: 'Scrape Failed: ' + error.message }, { status: 500 });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
