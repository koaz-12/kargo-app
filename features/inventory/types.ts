export type { AdjustmentType } from '../../types';
import { Product, AdjustmentType } from '../../types';

export interface InventoryItem extends Product {
    image_url?: string;
    financial_adjustments?: {
        id: string;
        type: AdjustmentType;
        amount: number;
        percentage?: number;
    }[];
}

export type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'PRICE_DESC' | 'PRICE_ASC' | 'NAME_ASC';
export type StatusFilter = 'ALL' | 'ORDERED' | 'RECEIVED' | 'SOLD';
