export type PlatformType = 'TEMU' | 'AMAZON' | 'ALIEXPRESS' | 'SHEIN' | 'OTHER';

export type AdjustmentType = 'CREDIT_CLAIM' | 'REWARD_BACK' | 'PRICE_ADJUSTMENT' | 'COUPON' | 'PRICE_PROTECTION' | 'OTHER';

export interface Platform {
  id: string;
  user_id?: string; // Multi-tenancy
  name: string;
  type: PlatformType;
  fee_structure_type: string; // Enables different fee calculation strategies per platform
  created_at: string;
}

export interface FinancialAdjustment {
  id: string;
  product_id: string;
  type: AdjustmentType;
  amount: number; // Positive value reduces cost (credit), negative increases cost (charge)
  percentage?: number;
  description?: string;
  date: string;
  created_at?: string;
}

export interface PurchaseAccount {
  id: string;
  name: string;
  type?: string;
  last_digits?: string;
  created_at?: string;
}

export type ProductStatus = 'draft' | 'ordered' | 'received' | 'sold';

export interface Product {
  id: string;
  platform_id: string;
  purchase_account_id?: string; // New field
  name: string;
  sku?: string;
  buy_price: number;
  shipping_cost: number;
  origin_tax?: number; // US Sales Tax (7%)
  tax_cost: number;
  sale_price?: number; // Optional until sold
  local_shipping_cost?: number; // Cost to ship to final customer
  exchange_rate: number; // USD -> DOP
  currency: string;
  image_url?: string;
  product_url?: string;

  // Financials (Calculated)
  net_cost?: number;
  gross_profit?: number;
  margin?: number;
  roi?: number;

  status: ProductStatus;
  images?: ProductImage[]; // New: Multi-image support
  created_at?: string;
  sold_at?: string; // Date when sold
  // Relations
  platform?: Platform;
  purchase_account?: PurchaseAccount;
  adjustments?: FinancialAdjustment[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  display_order: number;
  created_at: string;
}

export interface MonthlyGoal {
  id: string;
  month_key: string; // 'YYYY-MM'
  target_amount: number;
}

// Transaction interface for the calculation utility
export interface Transaction {
  buy_price: number;
  shipping_cost: number;
  tax_cost: number;
  adjustments: FinancialAdjustment[];
  exchange_rate: number; // Important for conversion
}

export interface ProfitResult {
  net_cost: number;
  gross_profit: number; // Potential or realized
  margin: number; // Renamed from profit_margin or added
  roi: number; // New
  total_adjustments: number;
}

export interface FormState {
  platformId: string;
  purchaseAccountId: string;
  name: string;
  buyPrice: number;
  shippingCost: number;
  originTax: number;
  taxCost: number;
  salePrice: number;
  localShipping: number;
  exchangeRate: number;
  adjustments: FinancialAdjustment[];
  productUrl: string;
  imageUrl: string;
  isScraping: boolean;
  images?: any[];
}

export interface FormSetters {
  setPlatformId: (val: string) => void;
  setPurchaseAccountId: (val: string) => void;
  setName: (val: string) => void;
  setBuyPrice: (val: number) => void;
  setShippingCost: (val: number) => void;
  setOriginTax: (val: number) => void;
  setTaxCost: (val: number) => void;
  setExchangeRate: (val: number) => void;
  setSalePrice: (val: number) => void;
  setLocalShipping: (val: number) => void;
  setAdjustments: (val: FinancialAdjustment[]) => void;
  setProductUrl: (val: string) => void;
  setImageUrl: (val: string) => void;
  setImages: (val: any[]) => void;
  setIsScraping: (val: boolean) => void;
  loadProduct: (p: any) => void;
  resetForm: () => void;
  softReset: () => void;
  addAdjustment: (type: any, amount: number) => void;
  removeAdjustment: (id: string) => void;
  updateAdjustment: (id: string, field: string, value: any) => void;
  fetchMetadata: (url: string) => void;
}
