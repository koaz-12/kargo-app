import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
// Default size
export const size = {
    width: 32,
    height: 32,
};

export const contentType = 'image/png';

// Image generation
export default function Icon({ params, searchParams }: any) {
    const sizeParam = searchParams?.size;
    const sizeParsed = sizeParam ? parseInt(sizeParam) : 32;

    const currentSize = {
        width: sizeParsed,
        height: sizeParsed,
    };
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 24,
                    background: 'black',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '50%',
                }}
            >
                K
            </div>
        ),
        // ImageResponse options
        {
            ...currentSize,
        }
    );
}
