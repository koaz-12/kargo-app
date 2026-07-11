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

export interface StorageLocation {
  id: string;
  user_id?: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export type ProductStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'SOLD';

export interface Product {
  id: string;
  platform_id: string;
  purchase_account_id?: string; // New field
  storage_location_id?: string; // Storage location reference
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
  images?: string[];
  product_url?: string;
  tracking_number?: string; // Store Tracking (Amazon/Shein)
  courier_tracking?: string; // Local Courier (EPS/BM)

  // Financials (Calculated)
  net_cost?: number;
  gross_profit?: number;
  margin?: number;
  roi?: number;

  status: ProductStatus;
  images?: ProductImage[]; // New: Multi-image support
  created_at?: string;
  updated_at?: string; // Last update
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

export interface MarketplaceListing {
  id: string;
  user_id: string;
  group_id?: string;
  skus?: string[];
  title: string;
  description: string;
  price: number;
  tags: string[];
  image_urls: string[];
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
  origin_tax?: number; // New: US Sales Tax
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
  currency: 'USD' | 'DOP'; // NEW: Currency selector
  applyUSATax?: boolean; // NEW: Optional US tax checkbox
  sku?: string; // NEW: SKU system
  adjustments: FinancialAdjustment[];
  productUrl: string;
  imageUrl: string;
  isScraping: boolean;
  images?: any[];
  trackingNumber?: string;
  courierTracking?: string;
  storageLocationId?: string; // Storage location reference
  defaultPoundRate?: string;
  is_archived?: boolean; // New field for archiving
  order_id?: string; // Phase 4
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
  setCurrency: (val: 'USD' | 'DOP') => void; // NEW
  setApplyUSATax: (val: boolean) => void; // NEW
  setSku: (val: string) => void; // NEW: SKU System
  setAdjustments: (val: FinancialAdjustment[]) => void;
  setProductUrl: (val: string) => void;
  setImageUrl: (val: string) => void;
  setImages: (val: any[]) => void;
  setTrackingNumber: (val: string) => void;
  setCourierTracking: (val: string) => void;
  setStorageLocationId: (val: string) => void; // Storage location
  setIsScraping: (val: boolean) => void;
  loadProduct: (p: any) => void;
  resetForm: () => void;
  softReset: () => void;
  addAdjustment: (type: any, amount: number) => void;
  removeAdjustment: (id: string) => void;
  updateAdjustment: (id: string, field: string, value: any) => void;
  fetchMetadata: (url: string) => Promise<boolean>;
}

// Phase 4: Clients and Orders
export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  created_at: string;
}

export type OrderStatus = 'LAYAWAY' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  workspace_id: string;
  client_id?: string;
  status: OrderStatus;
  total_amount: number;
  shipping_cost: number;
  discount: number;
  amount_paid?: number; // Virtual field we can calculate
  notes?: string;
  created_at: string;
  
  // Relations
  client?: Client;
  payments?: OrderPayment[];
  products?: Product[];
}
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

export interface StorageLocation {
  id: string;
  user_id?: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export type ProductStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'SOLD';

export interface Product {
  id: string;
  platform_id: string;
  purchase_account_id?: string; // New field
  storage_location_id?: string; // Storage location reference
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
  images?: string[];
  product_url?: string;
  tracking_number?: string; // Store Tracking (Amazon/Shein)
  courier_tracking?: string; // Local Courier (EPS/BM)

  // Financials (Calculated)
  net_cost?: number;
  gross_profit?: number;
  margin?: number;
  roi?: number;

  status: ProductStatus;
  images?: ProductImage[]; // New: Multi-image support
  created_at?: string;
  updated_at?: string; // Last update
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

export interface MarketplaceListing {
  id: string;
  user_id: string;
  group_id?: string;
  sku?: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  image_urls: string[];
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
  origin_tax?: number; // New: US Sales Tax
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
  currency: 'USD' | 'DOP'; // NEW: Currency selector
  applyUSATax?: boolean; // NEW: Optional US tax checkbox
  sku?: string; // NEW: SKU system
  adjustments: FinancialAdjustment[];
  productUrl: string;
  imageUrl: string;
  isScraping: boolean;
  images?: any[];
  trackingNumber?: string;
  courierTracking?: string;
  storageLocationId?: string; // Storage location reference
  defaultPoundRate?: string;
  is_archived?: boolean; // New field for archiving
  order_id?: string; // Phase 4
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
  setCurrency: (val: 'USD' | 'DOP') => void; // NEW
  setApplyUSATax: (val: boolean) => void; // NEW
  setSku: (val: string) => void; // NEW: SKU System
  setAdjustments: (val: FinancialAdjustment[]) => void;
  setProductUrl: (val: string) => void;
  setImageUrl: (val: string) => void;
  setImages: (val: any[]) => void;
  setTrackingNumber: (val: string) => void;
  setCourierTracking: (val: string) => void;
  setStorageLocationId: (val: string) => void; // Storage location
  setIsScraping: (val: boolean) => void;
  loadProduct: (p: any) => void;
  resetForm: () => void;
  softReset: () => void;
  addAdjustment: (type: any, amount: number) => void;
  removeAdjustment: (id: string) => void;
  updateAdjustment: (id: string, field: string, value: any) => void;
  fetchMetadata: (url: string) => Promise<boolean>;
}

// Phase 4: Clients and Orders
export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  created_at: string;
}

export type OrderStatus = 'LAYAWAY' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  workspace_id: string;
  client_id?: string;
  status: OrderStatus;
  total_amount: number;
  shipping_cost: number;
  discount: number;
  amount_paid?: number; // Virtual field we can calculate
  notes?: string;
  created_at: string;
  
  // Relations
  client?: Client;
  payments?: OrderPayment[];
  products?: Product[];
}

export interface OrderPayment {
  id: string;
  order_id: string;
  amount: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

// Phase 6: Opex & Returns
export interface OperatingExpense {
  id: string;
  workspace_id: string;
  category: 'MARKETING' | 'PACKAGING' | 'SHIPPING' | 'SOFTWARE' | 'SALARY' | 'OTHER';
  amount: number;
  notes?: string;
  expense_date: string;
  created_at: string;
}

export interface Return {
  id: string;
  workspace_id: string;
  order_id: string;
  product_id: string;
  reason?: string;
  refund_amount: number;
  returned_to_inventory: boolean;
  created_at: string;
}
