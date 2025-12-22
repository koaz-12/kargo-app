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
            // Using networkidle2 to ensure sufficient load
            try {
                await page.goto(cleanUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            } catch (navError) {
                console.warn('Navigation timeout/error, trying to parse what we have:', navError);
            }

            // Wait a sec for dynamic content?
            // await new Promise(r => setTimeout(r, 2000));

            // Grab full HTML content
            const html = await page.content();
            await browser.close();

            // --- SERVER SIDE PARSING WITH CHEERIO ---
            console.log('HTML Captured. Length:', html.length);
            const $ = cheerio.load(html);

            // Debug: Check if we are on Login page
            const pageTitle = $('title').text();
            console.log('Page Title:', pageTitle);

            // 1. Initial Logic: Title
            let title = $('h1').first().text().trim() ||
                $('.product-name').text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                pageTitle ||
                'Producto Temu';

            // 2. Logic: Image
            let image = $('meta[property="og:image"]').attr('content') || '';
            if (!image) {
                const imgEl = $('img.main-image').first() ||
                    $('img[class*="product-image"]').first();
                if (imgEl && imgEl.length > 0) image = imgEl.attr('src') || '';
            }

            // 3. Logic: Price (The main goal)
            let price = 0;

            const getPrice = (str: string | undefined | null) => {
                if (!str) return 0;
                // Look for standard price format X.XX or XX.XX
                const matches = str.match(/(?:^|\D)(\d{1,5}\.\d{2})(?!\d)/);
                if (matches) return parseFloat(matches[1]);
                return 0;
            };

            // Strategy A: Meta Tags
            const metaPrice = $('meta[property="og:price:amount"]').attr('content') ||
                $('meta[property="product:price:amount"]').attr('content');
            if (metaPrice) price = getPrice(metaPrice);

            // Strategy B: DOM Selectors (Loop through candidates)
            if (price === 0) {
                const candidates = [
                    $('span[data-type="0"]'), // User finding
                    $('.g-price'),
                    $('[data-test="pay-price"]'),
                    $('[class*="product-price"]'),
                    $('.price'),
                    $('.current-price'),
                    // Try finding spans that contain "$" directly
                    $('span:contains("$")')
                ];

                for (const el of candidates) {
                    if (el && el.length > 0) {
                        const txt = el.first().text();
                        const p = getPrice(txt);
                        if (p > 0) {
                            price = p;
                            console.log('Found price via selector:', el.get(0)?.tagName, 'Text:', txt);
                            break;
                        }
                    }
                }
            }

            // Strategy C: Regex Search on Body Text (Nuclear Option)
            if (price === 0) {
                const bodyText = $('body').text();
                // Look for $101.33 pattern, not preceded by other digits (minimize version numbers)
                const match = bodyText.match(/(?:^|\s)\$(\d{1,5}\.\d{2})(?!\d)/);
                if (match) {
                    price = parseFloat(match[1]);
                    console.log('Found price via Regex on Body:', match[0]);
                }
            }

            // Fallback for Title
            if (title === 'Producto Temu' || title === 'Temu') {
                const altTitle = $('meta[property="og:description"]').attr('content');
                if (altTitle && altTitle.length > 5) title = altTitle;
            }

            // Restore image from original URL if local failed (Temu specific)
            const originalUrlObj = new URL(url);
            const topGalleryUrl = originalUrlObj.searchParams.get('top_gallery_url');
            if (topGalleryUrl && !image) {
                image = decodeURIComponent(topGalleryUrl);
            }

            const result = {
                title: title?.trim(),
                image,
                price
            };

            console.log('Final Scrape Result:', result);
            return NextResponse.json(result);

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
