import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// Initialize Supabase Client (Service Role not strictly needed here if we just verifying JWT, 
// but using the standard client with headers is safer for context)
// Actually, usually in API routes we construct client from cookies to get the user session.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

        console.log('Scraping URL:', url);

        if (!url) {
            return NextResponse.json({ error: 'URL Missing' }, { status: 400 });
        }

        // Fetch the HTML with robust headers
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            console.error('Fetch failed:', response.status, response.statusText);
            return NextResponse.json({ error: `Failed to fetch page: ${response.status}` }, { status: response.status });
        }

        // SPECIAL HANDLING: TEMU Query Params
        // Temu often puts the image in 'top_gallery_url' or 'spec_gallery_id' mapped URL.
        // We check the FINAL url after redirects (e.g. from share.temu.com)
        const finalUrl = new URL(response.url);
        const topGalleryUrl = finalUrl.searchParams.get('top_gallery_url');

        if (topGalleryUrl) {
            const decodedImg = decodeURIComponent(topGalleryUrl);
            console.log('Found Temu Gallery URL:', decodedImg);
            // We continue to parse HTML for title, but prioritize this image later
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Image Strategy
        let image = '';
        if (topGalleryUrl) {
            image = decodeURIComponent(topGalleryUrl);
        } else {
            image = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('link[rel="image_src"]').attr('href') ||
                // Temu specific fallback selectors
                $('img[class*="main-image"]').attr('src') ||
                $('img[class*="product-image"]').attr('src') ||
                '';
        }

        // 2. Title Strategy
        const title = $('meta[property="og:title"]').attr('content') ||
            $('head title').text() ||
            $('h1').first().text() ||
            'Producto Temu';

        return NextResponse.json({
            image,
            title: title.trim()
        });



    } catch (error: any) {
        console.error('Scrape error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
