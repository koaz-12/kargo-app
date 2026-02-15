export interface ShipmentTracking {
    id: string;
    user_id: string;
    tracking_number: string;
    store_tracking?: string;
    courier: string;
    weight_kg?: number;
    weight_lb?: number;
    notes?: string;
    status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    tracking_type: 'PERSONAL' | 'BUSINESS';
    created_at: string;
    updated_at: string;
}
