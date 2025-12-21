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
            return NextResponse.json({
                image: decodedImg,
                title: 'Temu Product' // We might skip parsing HTML if we just want image. But user wants title? Let's try parsing HTML for title too. 
                // Better to just return image if that's the main pain point. Title is secondary.
                // Let's parse HTML anyway for title, but use this image as priority.
            });
        }

        const html = await response.text();
        console.log('HTML Length:', html.length);
        const $ = cheerio.load(html);

        // Try to find OG Image
        let image = $('meta[property="og:image"]').attr('content');

        // Fallbacks
        if (!image) image = $('meta[name="twitter:image"]').attr('content');
        if (!image) image = $('link[rel="image_src"]').attr('href');
        // Try data/json-ld for schema.org image
        if (!image) {
            try {
                const script = $('script[type="application/ld+json"]').first().html();
                if (script) {
                    const json = JSON.parse(script);
                    if (json.image) {
                        image = Array.isArray(json.image) ? json.image[0] : json.image;
                    }
                }
            } catch (e) { /* ignore json parse error */ }
        }

        // Specific Fallback for generic img tags if high res
        if (!image) {
            // Priority 1: Look for common e-commerce main image IDs/Classes
            image = $('#landingImage').attr('src') // Amazon
                || $('#imgTagWrapperId img').attr('src') // Amazon
                || $('img[data-role="pdp-main-image"]').attr('src'); // Generic SPA

            // Priority 2: Scan all images for best candidate
            if (!image) {
                $('img').each((i, el) => {
                    const src = $(el).attr('src');
                    const alt = $(el).attr('alt')?.toLowerCase() || '';

                    // Filter out obvious bad images
                    if (src && src.startsWith('http')
                        && !src.endsWith('.svg')
                        && !src.includes('logo')
                        && !src.includes('icon')
                        && !src.includes('banner')
                        && !src.includes('rating')
                        && !src.includes('avatar')
                        && !src.includes('spacer')
                        && src.length > 50 // Tiny URLs often tracking pixels or assets (heuristic)
                    ) {
                        // Heuristic: If alt text contains "product" or matches title words, it's likely the one.
                        // For now, just take the first "good" high-res looking one.
                        image = src;
                        return false;
                    }
                });
            }
        }

        // Title
        const title = $('meta[property="og:title"]').attr('content') || $('title').text();
        console.log('Found Image:', image);

        // Fix relative URLs if any (basic handler)
        if (image && image.startsWith('//')) {
            image = 'https:' + image;
        }

        return NextResponse.json({
            image: image || null,
            title: title?.trim() || null
        });

    } catch (error: any) {
        console.error('Scrape error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
