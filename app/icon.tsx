import { ImageResponse } from 'next/og'

// Route segment config
// Route segment config
// export const runtime = 'edge'

// Image metadata
export const size = {
    width: 512,
    height: 512,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 256,
                    background: 'linear-gradient(to bottom right, #2563eb, #1e40af)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '20%',
                    fontWeight: 'bold',
                }}
            >
                $
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    )
}
