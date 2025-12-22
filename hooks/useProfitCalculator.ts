import { useState, useMemo, useEffect } from 'react';
import { Product, FinancialAdjustment, PlatformType, Transaction, Platform } from '../types';
import { calculateProfit } from '../utils/calculateProfit';
import { supabase } from '../lib/supabaseClient'; // Fix lint error

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

    const [courierDiscount, setCourierDiscount] = useState<number>(0);
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

            // AUTO-SAVE PREFERENCE only if adding new product (Learning Mode)
            if (!initialProduct?.id && exchangeRate > 0) {
                const saveRate = async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase.from('user_preferences').upsert({
                            user_id: user.id,
                            default_exchange_rate: exchangeRate
                        });
                    }
                };
                // Debounce? For now direct save is okay as rate doesn't change 50 times/sec
                saveRate();
            }
        }
    }, [exchangeRate, isRateLoaded, initialProduct?.id]);

    // FEATURE: Load Default Settings (Platform)
    useEffect(() => {
        if (!initialProduct?.platform_id && !platformId) {
            const defaultPlatform = localStorage.getItem('defaultPlatform');
            if (defaultPlatform) {
                setPlatformId(defaultPlatform);
            }
        }

        // AUTO-SAVE Platform Preference (Learning Mode)
        if (!initialProduct?.id && platformId) {
            const savePlatform = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('user_preferences').upsert({
                        user_id: user.id,
                        default_platform_id: platformId
                    });
                }
            };
            savePlatform();
        }
    }, [initialProduct?.platform_id, platforms, platformId]);

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

    // State for Preferences
    const [preferences, setPreferences] = useState<Record<string, number>>({});

    // Auto-calculate 7% Sales Tax when Buy Price changes
    useEffect(() => {
        if (buyPrice > 0) {
            setOriginTax(Number((buyPrice * 0.07).toFixed(2)));
        } else {
            setOriginTax(0);
        }

        // REACTIVE ADJUSTMENTS: Recalculate amounts if Buy Price changes
        if (adjustments.length > 0) {
            setAdjustments(prev => prev.map(adj => {
                if (adj.percentage && adj.percentage > 0) {
                    const newAmount = Number((buyPrice * (adj.percentage / 100)).toFixed(2));
                    if (newAmount !== adj.amount) {
                        return { ...adj, amount: newAmount };
                    }
                }
                return adj;
            }));
        }
    }, [buyPrice]);

    // Load Preferences & Auto-Add Defaults
    useEffect(() => {
        const loadPrefs = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('user_preferences')
                .select('adjustment_defaults, default_platform_id, default_exchange_rate, display_name, default_courier_discount, default_local_shipping')
                .eq('user_id', user.id)
                .single();

            let currentPrefs = {};
            if (data) {
                if (data.default_courier_discount) {
                    setCourierDiscount(Number(data.default_courier_discount));
                }
                if (data.display_name) {
                    // console.log('Loaded Display Name:', data.display_name);
                }

                if (data.adjustment_defaults) {
                    setPreferences(data.adjustment_defaults);
                    currentPrefs = data.adjustment_defaults;
                }

                // Initialize Defaults if new product
                if (!initialProduct?.id) {
                    if (data.default_platform_id && !initialProduct?.platform_id) {
                        setPlatformId(data.default_platform_id);
                    }
                    if (data.default_exchange_rate) {
                        setExchangeRate(data.default_exchange_rate);
                    }
                    if (data.default_local_shipping) {
                        setLocalShipping(Number(data.default_local_shipping));
                    }
                }
            }

            // AUTO-ADD CREDIT CREDIT CLAIM (Phase 25)
            // Only for new products and if no adjustments exist yet
            if (!initialProduct?.id && adjustments.length === 0) {
                const type = 'CREDIT_CLAIM';
                // @ts-ignore
                const prefPct = currentPrefs[type] || 50; // Default 50%

                const newAdjustment: FinancialAdjustment = {
                    id: crypto.randomUUID(),
                    product_id: '',
                    type,
                    amount: 0, // Will be calculated reactively as soon as price is entered
                    percentage: prefPct,
                    date: new Date().toISOString(),
                };
                setAdjustments(prev => {
                    // Safety check: specific race condition where loadProduct() populates adjustments
                    // while this async loadPrefs() is still running. If populated, 'prev' will have data.
                    // We shouldn't overwrite with default if data exists.
                    if (prev.length > 0) return prev;
                    return [newAdjustment];
                });
            }
        };
        loadPrefs();
    }, [initialProduct]);

    const fetchMetadata = async (url: string): Promise<boolean> => {
        if (!url) return false;
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
                return false;
            }

            // 1. Set Image (Priority)
            if (data.image) {
                // Add to gallery (Simple string path)
                setImages(prev => {
                    // Avoid duplicates
                    if (prev.includes(data.image)) return prev;
                    return [...prev, data.image];
                });

                // Set as main image if none exists
                if (!imageUrl) setImageUrl(data.image);

                // Success! (No alert, return true for UI feedback)
                return true;
            } else {
                alert('No se encontró ninguna imagen en esa página.');
                return false;
            }

        } catch (e) {
            console.error('Scrape failed', e);
            alert('Error de conexión al buscar la imagen.');
            return false;
        } finally {
            setIsScraping(false);
        }
    };

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
            images, // New
            courierDiscount, // New
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
            softReset: () => {
                // Keep Platform, Account, Shipping, Tax, Local Shipping
                setName('');
                setBuyPrice(0);
                setSalePrice(0);
                setAdjustments([]); // Reset financial adjustments as they are per-item transaction
                setProductUrl('');
                setImageUrl('');
                setImages([]);
            },
            addAdjustment: (type: any, amount: number) => {
                setAdjustments([...adjustments, { id: crypto.randomUUID(), product_id: '', type, amount, percentage: 0, date: new Date().toISOString() }]);
            },
            removeAdjustment: (id: string) => {
                setAdjustments(prev => prev.filter(a => a.id !== id));
            },
            updateAdjustment: (id: string, field: string, value: any) => {
                setAdjustments(prev => prev.map(a => {
                    if (a.id !== id) return a;

                    const updatedAdj = { ...a, [field]: value };

                    // Bidirectional Logic
                    const numValue = Number(value);
                    const safeBuyPrice = Number(buyPrice) || 0;

                    if (field === 'percentage') {
                        // If % changes, ALWAYS update Amount (even if price is 0 -> amount 0)
                        updatedAdj.amount = Number((safeBuyPrice * (numValue / 100)).toFixed(2));
                    } else if (field === 'amount') {
                        // If Amount changes, update % ONLY if price > 0
                        if (safeBuyPrice > 0) {
                            updatedAdj.percentage = Number(((numValue / safeBuyPrice) * 100).toFixed(2));
                        } else {
                            // If price is 0, we can't calculate %, so maybe set to 0 to avoid Infinity
                            updatedAdj.percentage = 0;
                        }
                    }

                    return updatedAdj;
                }));
            },
            fetchMetadata
        },
        results: profitMeta,
        meta: {
            selectedPlatform,
            isTemu
        },
        courierDiscount // Return State
    };
};
