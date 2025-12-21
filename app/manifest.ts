import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Kargo',
        short_name: 'Kargo',
        description: 'Gestión Inteligente de Importaciones',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#2563eb',
        icons: [
            {
                src: '/icon',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
