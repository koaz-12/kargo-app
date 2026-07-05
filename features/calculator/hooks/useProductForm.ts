import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfitCalculator } from '../../../hooks/useProfitCalculator';
import { FormState, FormSetters, ProductStatus } from '../../../types';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { createProductAction, updateProductAction } from '../../../app/actions/products';
import { toast } from 'sonner';

export const useProductForm = (editingId: string | null) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { formState, setters, results, courierDiscount } = useProfitCalculator();

    const [platforms, setPlatforms] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [queue, setQueue] = useState<FormState[]>([]); // NEW: Queue State

    // Load Initial Data (Platforms, Accounts, Edit Product)
    useEffect(() => {
        const loadDependencies = async () => {
            const { data: platformsData } = await supabase.from('platforms').select('*').order('name');
            if (platformsData) setPlatforms(platformsData);

            const { data: accountsData } = await supabase.from('purchase_accounts').select('*').order('name');
            if (accountsData) setAccounts(accountsData);
        };
        loadDependencies();

        if (editingId) {
            const loadProduct = async () => {
                try {
                    const { data, error } = await supabase
                        .from('products')
                        .select('*, financial_adjustments(*), product_images(*)')
                        .eq('id', editingId)
                        .single();

                    if (error) throw error;

                    if (data) {
                        const productData = {
                            ...data,
                            adjustments: data.financial_adjustments || [],
                            images: data.product_images && data.product_images.length > 0
                                ? data.product_images.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)).map((img: any) => img.storage_path)
                                : (data.image_url ? [data.image_url] : [])
                        };
                        setters.loadProduct(productData);
                    }
                } catch (error) {
                    console.error("Error loading product:", error);
                    toast.error('Error al cargar producto');
                }
            };
            loadProduct();
        }
    }, [editingId]);

    const handleSave = async (cloneMode = false) => {
        // Clear previous errors
        setValidationErrors({});

        if (!formState.name) {
            toast.error('El nombre es requerido');
            return;
        }
        if (!formState.buyPrice) {
            toast.error('El precio de compra es requerido');
            return;
        }

        setSaving(true);
        setStatusMsg('');

        try {
            // Check for Duplicate SKU before doing anything else
            if (formState.sku) {
                // Initialize the query
                let skuCheckQuery = supabase
                    .from('products')
                    .select('id, name')
                    .eq('sku', formState.sku);

                if (editingId && !cloneMode) {
                    skuCheckQuery = skuCheckQuery.neq('id', editingId);
                }

                const { data: existingSkus, error: skuError } = await skuCheckQuery.limit(1);

                if (skuError) {
                    console.error('Error checking SKU:', skuError);
                }

                if (existingSkus && existingSkus.length > 0) {
                    const existingName = existingSkus[0].name;
                    // Permitir el mismo SKU si el nombre del producto es exactamente el mismo (otra unidad)
                    if (existingName.trim().toLowerCase() !== formState.name.trim().toLowerCase()) {
                        toast.error(`❌ El SKU "${formState.sku}" ya pertenece a "${existingName}". Si es el mismo producto, usa el mismo nombre exacto.`);
                        setSaving(false);
                        return;
                    }
                }
            }

            // Determine status based on fields
            let productStatus: ProductStatus = 'ORDERED';
            if (formState.salePrice > 0) {
                productStatus = 'SOLD';
            } else if (formState.shippingCost > 0 || formState.localShipping > 0 || formState.taxCost > 0) {
                productStatus = 'RECEIVED';
            }

            // DOP CURRENCY HANDLING:
            // When currency is DOP, the user's entered prices ARE already in DOP.
            // We store them as-is and set exchange_rate = 1.
            // This way the universal formula works: buy_price * exchange_rate = DOP cost
            //   USD example: buy=10, rate=65 → 10*65 = 650 DOP ✓
            //   DOP example: buy=1000, rate=1 → 1000*1 = 1000 DOP ✓
            const isDOP = formState.currency === 'DOP';
            const savedBuyPrice = formState.buyPrice;
            const savedShippingCost = formState.shippingCost;
            const savedExchangeRate = isDOP ? 1 : formState.exchangeRate;

            // Create FormData for Server Action
            const formData = new FormData();
            formData.append('platform_id', formState.platformId);
            if (formState.purchaseAccountId) {
                formData.append('purchase_account_id', formState.purchaseAccountId);
            }
            formData.append('name', formState.name);
            formData.append('buy_price', savedBuyPrice.toFixed(4));
            formData.append('shipping_cost', savedShippingCost.toFixed(4));
            formData.append('origin_tax', (formState.originTax || 0).toString());
            formData.append('tax_cost', formState.taxCost.toString());
            if (formState.salePrice) {
                formData.append('sale_price', formState.salePrice.toString());
            }
            formData.append('local_shipping_cost', formState.localShipping.toString());
            formData.append('exchange_rate', savedExchangeRate.toString());
            formData.append('status', productStatus);

            // Optional fields
            if (formState.sku) formData.append('sku', formState.sku);
            if (formState.storageLocationId) formData.append('storage_location_id', formState.storageLocationId); // NEW
            if (formState.productUrl) formData.append('product_url', formState.productUrl);
            if (formState.imageUrl) formData.append('image_url', formState.imageUrl);
            if (formState.trackingNumber) formData.append('tracking_number', formState.trackingNumber);
            if (formState.courierTracking) formData.append('courier_tracking', formState.courierTracking);


            let result;
            let targetId = editingId;

            // NEW: If cloneMode, just push to Queue and return
            if (cloneMode) {
                setQueue(prev => [...prev, { ...formState, sku: '' }]);
                toast.success('Clon agregado a la cola');
                setStatusMsg('¡Clonado a la cola! 🛒');
                setSaving(false);
                return;
            }

            if (editingId && !cloneMode) {
                // UPDATE with Server Action
                result = await updateProductAction(editingId, formData);
            } else {
                // CREATE with Server Action
                result = await createProductAction(formData);
                if (result.success && result.data) {
                    targetId = result.data.id;
                }
            }

            if (!result.success) {
                if (result.errors) {
                    // Zod validation errors
                    setValidationErrors(result.errors);
                    toast.error('Errores de validación');
                    return;
                }
                toast.error(result.error || 'Error al guardar');
                return;
            }

            // Handle Relations (Adjustments) - Still client-side for now
            if (editingId && !cloneMode) {
                await supabase.from('financial_adjustments').delete().eq('product_id', editingId);
            }

            if (formState.adjustments.length > 0 && targetId) {
                const adjs = formState.adjustments.map(a => ({
                    product_id: targetId,
                    type: a.type,
                    amount: a.amount || 0,
                    percentage: a.percentage || 0
                }));
                await supabase.from('financial_adjustments').insert(adjs);
            }

            // Handle Images - Still client-side for now
            if (formState.images && formState.images.length > 0 && targetId) {
                if (editingId && !cloneMode) {
                    await supabase.from('product_images').delete().eq('product_id', editingId);
                }

                const imgs = formState.images.map((img: any, idx: number) => ({
                    product_id: targetId,
                    storage_path: typeof img === 'string' ? img : img.storage_path,
                    display_order: idx
                }));
                await supabase.from('product_images').insert(imgs);

                const primaryImage = imgs[0]?.storage_path;
                if (primaryImage) {
                    await supabase.from('products').update({ image_url: primaryImage }).eq('id', targetId);
                }
            }

            // Invalidate React Query cache to update Dashboard Stats and other pages
            queryClient.invalidateQueries({ queryKey: ['products'] });

            // Success feedback
            if (targetId && (editingId && !cloneMode)) {
                toast.success('¡Producto actualizado!');
                setTimeout(() => router.push('/inventory'), 1000);
                setStatusMsg('¡Editado Exitosamente!');
            } else {
                toast.success('¡Producto guardado!');
                setStatusMsg('¡Producto Guardado!');
                setters.resetForm();
                setTimeout(() => setStatusMsg(''), 3000);
            }

        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Error al guardar producto');
            setStatusMsg('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleAddToQueue = () => {
        setValidationErrors({});
        if (!formState.name) { toast.error('El nombre es requerido'); return; }
        if (!formState.buyPrice) { toast.error('El precio de compra es requerido'); return; }

        setQueue(prev => [...prev, { ...formState }]);
        toast.success('Producto agregado a la cola');
        setters.resetForm(); // Limpiar para el siguiente
    };

    const handleSaveAllQueue = async () => {
        if (queue.length === 0) return;
        setSaving(true);
        setStatusMsg('Guardando lote...');
        
        try {
            let successCount = 0;
            
            for (const item of queue) {
                // Determine status
                let productStatus: ProductStatus = 'ORDERED';
                if (item.salePrice > 0) productStatus = 'SOLD';
                else if (item.shippingCost > 0 || item.localShipping > 0 || item.taxCost > 0) productStatus = 'RECEIVED';

                const isDOP = item.currency === 'DOP';
                const savedExchangeRate = isDOP ? 1 : item.exchangeRate;

                const formData = new FormData();
                formData.append('platform_id', item.platformId);
                if (item.purchaseAccountId) formData.append('purchase_account_id', item.purchaseAccountId);
                formData.append('name', item.name);
                formData.append('buy_price', item.buyPrice.toFixed(4));
                formData.append('shipping_cost', item.shippingCost.toFixed(4));
                formData.append('origin_tax', (item.originTax || 0).toString());
                formData.append('tax_cost', item.taxCost.toString());
                if (item.salePrice) formData.append('sale_price', item.salePrice.toString());
                formData.append('local_shipping_cost', item.localShipping.toString());
                formData.append('exchange_rate', savedExchangeRate.toString());
                formData.append('status', productStatus);

                if (item.sku) formData.append('sku', item.sku);
                if (item.storageLocationId) formData.append('storage_location_id', item.storageLocationId);
                if (item.productUrl) formData.append('product_url', item.productUrl);
                if (item.imageUrl) formData.append('image_url', item.imageUrl);
                if (item.trackingNumber) formData.append('tracking_number', item.trackingNumber);
                if (item.courierTracking) formData.append('courier_tracking', item.courierTracking);

                const result = await createProductAction(formData);
                
                if (result.success && result.data?.id) {
                    const targetId = result.data.id;
                    
                    // Adjustments
                    if (item.adjustments && item.adjustments.length > 0) {
                        const adjs = item.adjustments.map(a => ({
                            product_id: targetId,
                            type: a.type,
                            amount: a.amount || 0,
                            percentage: a.percentage || 0
                        }));
                        await supabase.from('financial_adjustments').insert(adjs);
                    }
                    
                    // Images
                    if (item.images && item.images.length > 0) {
                        const imgs = item.images.map((img: any, idx: number) => ({
                            product_id: targetId,
                            storage_path: typeof img === 'string' ? img : img.storage_path,
                            display_order: idx
                        }));
                        await supabase.from('product_images').insert(imgs);
                        
                        const primaryImage = imgs[0]?.storage_path;
                        if (primaryImage) {
                            await supabase.from('products').update({ image_url: primaryImage }).eq('id', targetId);
                        }
                    }
                    successCount++;
                } else {
                    console.error('Failed to insert item from queue', item.name, result.error);
                }
            }

            toast.success(`Se guardaron ${successCount} productos correctamente`);
            setQueue([]); // Limpiar cola
            queryClient.invalidateQueries({ queryKey: ['products'] });
            if(successCount > 0) {
                setTimeout(() => router.push('/inventory'), 1000);
            }
        } catch (err) {
            console.error(err);
            toast.error('Ocurrió un error guardando la cola');
        } finally {
            setSaving(false);
            setStatusMsg('');
        }
    };

    const smartFetchMetadata = async (url: string) => {
        // 1. Detect Platform
        if (platforms.length > 0 && url) {
            const lowerUrl = url.toLowerCase();
            const matchedPlatform = platforms.find(p =>
                lowerUrl.includes(p.name.toLowerCase()) ||
                (p.name.toLowerCase() === 'amazon' && lowerUrl.includes('amzn')) ||
                (p.name.toLowerCase() === 'aliexpress' && lowerUrl.includes('ali'))
            );

            if (matchedPlatform) {
                setters.setPlatformId(matchedPlatform.id);
            }
        }

        // 2. Call original fetch logic
        return await setters.fetchMetadata(url);
    };

    return {
        formState,
        setters: {
            ...setters,
            fetchMetadata: smartFetchMetadata
        },
        results,
        platforms,
        accounts,
        saving,
        statusMsg,
        validationErrors, // NEW: expose validation errors
        handleSave,
        handleAddToQueue,
        handleSaveAllQueue, // NEW
        queue, // NEW
        setQueue, // NEW
        courierDiscount
    };
}
