import { useState, useMemo, useEffect } from 'react';
import { Product, FinancialAdjustment, PlatformType, Transaction, Platform } from '../types';
import { calculateProfit } from '../utils/calculateProfit';

interface UseProfitCalculatorProps {
    initialProduct?: Partial<Product>;
    platforms?: Platform[]; // List of available platforms
}

export const useProfitCalculator = ({ initialProduct, platforms = [] }: UseProfitCalculatorProps = {}) => {
    // Form State
    const [platformId, setPlatformId] = useState<string>(initialProduct?.platform_id || '');
    const [purchaseAccountId, setPurchaseAccountId] = useState<string>((initialProduct as any)?.purchase_account_id || '');
    const [name, setName] = useState<string>(initialProduct?.name || ''); // New Name State
    const [buyPrice, setBuyPrice] = useState<number>(initialProduct?.buy_price || 0);
    const [shippingCost, setShippingCost] = useState<number>(initialProduct?.shipping_cost || 0);
    const [originTax, setOriginTax] = useState<number>(initialProduct?.origin_tax || 0); // New
    const [taxCost, setTaxCost] = useState<number>(initialProduct?.tax_cost || 0);
    const [exchangeRate, setExchangeRate] = useState<number>(initialProduct?.exchange_rate || 58.50); // Default DOP Rate
    const [salePrice, setSalePrice] = useState<number>(initialProduct?.sale_price || 0);
    const [localShipping, setLocalShipping] = useState<number>(initialProduct?.local_shipping_cost || 0);
    const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>(initialProduct?.adjustments || []);
    // New Metadata State
    const [productUrl, setProductUrl] = useState<string>(initialProduct?.product_url || '');
    const [imageUrl, setImageUrl] = useState<string>(initialProduct?.image_url || '');
    const [images, setImages] = useState<any[]>(initialProduct?.images || []); // New Images Array
    const [isScraping, setIsScraping] = useState(false);

    const [isRateLoaded, setIsRateLoaded] = useState(false);

    // Persistence: Load Exchange Rate
    useEffect(() => {
        // Only load if not editing an existing product (which has its own rate)
        if (!initialProduct?.exchange_rate) {
            const savedRate = localStorage.getItem('ecom_exchange_rate');
            if (savedRate) {
                setExchangeRate(Number(savedRate));
            }
        }
        setIsRateLoaded(true);
    }, [initialProduct]);

    // Persistence: Save Exchange Rate
    useEffect(() => {
        if (isRateLoaded && exchangeRate > 0) {
            localStorage.setItem('ecom_exchange_rate', exchangeRate.toString());
        }
    }, [exchangeRate, isRateLoaded]);

    // Derived State: Selected Platform
    const selectedPlatform = useMemo(() =>
        platforms.find(p => p.id === platformId),
        [platformId, platforms]);

    // Real-time Calculation
    const profitMeta = useMemo(() => {
        const transaction: Transaction = {
            buy_price: buyPrice,
            shipping_cost: shippingCost,
            tax_cost: taxCost,
            adjustments: adjustments,
            exchange_rate: exchangeRate
        };

        return calculateProfit(transaction, salePrice, localShipping);
    }, [buyPrice, shippingCost, taxCost, adjustments, salePrice, localShipping, exchangeRate]);

    // Actions
    const addAdjustment = (type: FinancialAdjustment['type'], amount: number) => {
        let initialPercentage = 0;
        let initialAmount = amount;

        // Default 50% for Credit Claim
        if (type === 'CREDIT_CLAIM' && amount === 0 && buyPrice > 0) {
            initialPercentage = 50;
            initialAmount = Number((buyPrice * 0.50).toFixed(2));
        }

        const newAdjustment: FinancialAdjustment = {
            id: crypto.randomUUID(), // Temp ID for UI
            product_id: '', // Not created yet
            type,
            amount: initialAmount,
            percentage: initialPercentage,
            date: new Date().toISOString(),
        };
        setAdjustments(prev => [...prev, newAdjustment]);
    };

    const removeAdjustment = (id: string) => {
        setAdjustments(prev => prev.filter(a => a.id !== id));
    };

    const updateAdjustment = (id: string, field: keyof FinancialAdjustment, value: any) => {
        setAdjustments(prev => prev.map(a => {
            if (a.id !== id) return a;
            const updated = { ...a, [field]: value };

            // Smart Calc: Percentage <-> Amount
            if (field === 'percentage') {
                updated.amount = Number((buyPrice * (Number(value) / 100)).toFixed(2));
            }
            if (field === 'amount' && buyPrice > 0) {
                updated.percentage = Number(((Number(value) / buyPrice) * 100).toFixed(2));
            }
            return updated;
        }));
    };

    const fetchMetadata = async (url: string) => {
        if (!url) return;
        setIsScraping(true);
        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                body: JSON.stringify({ url }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (data.error) {
                alert('No se pudo obtener la imagen (Bloqueo de sitio o URL inválida). Intenta otra URL.');
                console.warn(data.error);
                return;
            }

            if (data.image) setImageUrl(data.image);
            else alert('No se encontró ninguna imagen en esa página.');

        } catch (e) {
            console.error('Scrape failed', e);
            alert('Error de conexión al buscar la imagen.');
        } finally {
            setIsScraping(false);
        }
    };

    const loadProduct = (p: Product) => {
        setPlatformId(p.platform_id);
        setName(p.name); // Load Name
        setBuyPrice(p.buy_price);
        setShippingCost(p.shipping_cost);
        setOriginTax(p.origin_tax || 0); // Load Tax
        setTaxCost(p.tax_cost);
        setSalePrice(p.sale_price || 0);
        setLocalShipping(p.local_shipping_cost ?? 0);
        setExchangeRate(p.exchange_rate);
        setProductUrl(p.product_url || '');
        setImageUrl(p.image_url || '');
        setAdjustments(p.adjustments || []);
        setPurchaseAccountId((p as any).purchase_account_id || '');
    };

    const resetForm = () => {
        setPlatformId('');
        setBuyPrice(0);
        setShippingCost(0);
        setTaxCost(0);
        setSalePrice(0);
        setLocalShipping(0);
        setAdjustments([]);
        setProductUrl('');
        setImageUrl('');
        setPurchaseAccountId('');
        // Exchange Rate stays as persisted/current
    };

    // Auto-calculate 7% Sales Tax when Buy Price changes
    useEffect(() => {
        if (buyPrice > 0) {
            setOriginTax(Number((buyPrice * 0.07).toFixed(2)));
        } else {
            setOriginTax(0);
        }
    }, [buyPrice]);

    // Check for platform specific logic (Extensibility point)
    const isTemu = selectedPlatform?.name.toUpperCase() === 'TEMU';

    return {
        formState: {
            platformId,
            purchaseAccountId,
            name, // New
            buyPrice,
            shippingCost,
            originTax,
            taxCost,
            salePrice,
            localShipping,
            exchangeRate,
            adjustments,
            productUrl,
            imageUrl,
            isScraping,
            images // New
        },
        setters: {
            setPlatformId,
            setPurchaseAccountId,
            setName, // New
            setBuyPrice,
            setShippingCost,
            setOriginTax,
            setTaxCost,
            setExchangeRate,
            setSalePrice,
            setLocalShipping,
            setAdjustments,
            setProductUrl,
            setImageUrl,
            setImages,
            // Logic Helpers
            setIsScraping,
            loadProduct: (p: any) => {
                setPlatformId(p.platform_id || '');
                setPurchaseAccountId(p.purchase_account_id || '');
                setName(p.name || '');
                setBuyPrice(p.buy_price || 0);
                setShippingCost(p.shipping_cost || 0);
                setOriginTax(p.origin_tax || 0);
                setTaxCost(p.tax_cost || 0);
                setExchangeRate(p.exchange_rate || 60);
                setSalePrice(p.sale_price || 0);
                setLocalShipping(p.local_shipping_cost || 0);
                setAdjustments(p.adjustments || []);
                setProductUrl(p.product_url || '');
                setImageUrl(p.image_url || '');
                setImages(p.images || []);
            },
            resetForm: () => {
                setBuyPrice(0);
                setShippingCost(0);
                setOriginTax(0);
                setTaxCost(0);
                setSalePrice(0);
                setLocalShipping(0);
                setAdjustments([]);
                setProductUrl('');
                setImageUrl('');
                setImages([]);
                setName('');
            },
            addAdjustment: (type: any, amount: number) => {
                setAdjustments([...adjustments, { id: crypto.randomUUID(), product_id: '', type, amount, percentage: 0, date: new Date().toISOString() }]);
            },
            removeAdjustment: (id: string) => {
                setAdjustments(prev => prev.filter(a => a.id !== id));
            },
            updateAdjustment: (id: string, field: string, value: any) => {
                setAdjustments(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
            },
            fetchMetadata
        },
        results: profitMeta,
        meta: {
            selectedPlatform,
            isTemu
        }
    };
};
