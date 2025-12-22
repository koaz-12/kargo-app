import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as cheerio from 'cheerio';

// Puppeteer imports
// We use a pattern to support both Local (puppeteer) and Production/Vercel (@sparticuz/chromium)
let chromium: any;

export async function POST(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL Missing' }, { status: 400 });
        }

        // Clean URL to increase success rate
        const cleanUrl = url.split('?')[0];
        console.log('Hybrid Scraper: Launching Puppeteer for:', cleanUrl);

        let browser;
        try {
            if (process.env.NODE_ENV === 'production') {
                // Production: Use sparticuz/chromium with puppeteer-core
                if (!chromium) chromium = require('@sparticuz/chromium');
                const puppeteerCore = require('puppeteer-core');
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
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-blink-features=AutomationControlled',
                        '--window-size=1920,1080'
                    ]
                });
            }

            const page = await browser.newPage();

            // Set Standard Viewport
            await page.setViewport({ width: 1920, height: 1080 });

            // Set Headers to look like real Chrome
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/'
            });

            // Optimizations: Block images/fonts/stylesheets to speed up load
            await page.setRequestInterception(true);
            page.on('request', (req: any) => {
                const resourceType = req.resourceType();
                if (['image', 'font'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // Navigate
            try {
                // Navigate with reasonable timeout
                await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

                // Short wait for dynamic content
                await new Promise(r => setTimeout(r, 2000));

            } catch (navError) {
                console.warn('Navigation timeout, parsing available content:', navError);
            }

            // Grab full HTML content
            const html = await page.content();
            await browser.close();

            // --- SERVER SIDE PARSING WITH CHEERIO ---
            const $ = cheerio.load(html);

            // 1. Title Strategy
            let title = $('h1').first().text().trim() ||
                $('.product-name').text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                $('title').text().trim() ||
                'Producto Temu';

            // 2. Image Strategy
            let image = $('meta[property="og:image"]').attr('content') || '';
            if (!image) {
                const imgEl = $('img.main-image').first() ||
                    $('img[class*="product-image"]').first();
                if (imgEl && imgEl.length > 0) image = imgEl.attr('src') || '';
            }

            // 3. Price Strategy (Best Effort)
            let price = 0;

            const getPrice = (str: string | undefined | null) => {
                if (!str) return 0;
                const matches = str.match(/(?:^|\D)(\d{1,5}\.\d{2})(?!\d)/);
                if (matches) return parseFloat(matches[1]);
                return 0;
            };

            const metaPrice = $('meta[property="og:price:amount"]').attr('content') ||
                $('meta[property="product:price:amount"]').attr('content');
            if (metaPrice) price = getPrice(metaPrice);

            // Attempt DOM selectors if meta failed
            if (price === 0) {
                const candidates = [
                    $('span[data-type="0"]'),
                    $('.g-price'),
                    $('[data-test="pay-price"]')
                ];
                for (const el of candidates) {
                    if (el && el.length > 0) {
                        const p = getPrice(el.first().text());
                        if (p > 0) { price = p; break; }
                    }
                }
            }

            // Regex Fallback
            if (price === 0) {
                const bodyText = $('body').text();
                const match = bodyText.match(/(?:^|\s)\$(\d{1,5}\.\d{2})(?!\d)/);
                if (match) price = parseFloat(match[1]);
            }

            // Restore image from original URL if local failed (Temu specific)
            const originalUrlObj = new URL(url);
            const topGalleryUrl = originalUrlObj.searchParams.get('top_gallery_url');
            if (topGalleryUrl && !image) {
                image = decodeURIComponent(topGalleryUrl);
            }

            return NextResponse.json({
                title: title?.trim(),
                image,
                price
            });

        } catch (error: any) {
            console.error('Puppeteer Runtime Error:', error);
            if (browser) await browser.close();
            return NextResponse.json({ error: 'Browser Automation Failed: ' + error.message }, { status: 500 });
        }

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
