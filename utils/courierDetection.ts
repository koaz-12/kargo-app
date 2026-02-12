// Courier auto-detection utility
export const COURIER_PATTERNS: Record<string, RegExp> = {
    'Pintopack': /^(PP|PINTO)-?\d+/i,
    'Temu DO': /^(TEMU|TE)-?DO-?\d+/i,
    'BM Cargo': /^BM-?\d{5,}/i,
    'DHL': /^\d{10}$/,
    'FedEx': /^\d{12,14}$/,
    'UPS': /^1Z[A-Z0-9]{16}$/i,
    'USPS': /^\d{20,22}$/,
    'Ara Envíos': /^ARA-?\d{6}/i,
};

export function detectCourier(trackingNumber: string): string {
    if (!trackingNumber) return '';

    const cleaned = trackingNumber.trim();

    for (const [courier, pattern] of Object.entries(COURIER_PATTERNS)) {
        if (pattern.test(cleaned)) {
            return courier;
        }
    }

    return 'Otro';
}

export const COURIER_OPTIONS = [
    'Pintopack',
    'Temu DO',
    'BM Cargo',
    'DHL',
    'FedEx',
    'UPS',
    'USPS',
    'Ara Envíos',
    'Otro'
];
