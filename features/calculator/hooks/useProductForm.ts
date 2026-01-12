import { useState, useEffect } from 'react';
import { useProfitCalculator } from '../../../hooks/useProfitCalculator';
import { productService } from '../../../services/productService';
import { FormState, FormSetters, ProductStatus } from '../../../types';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export const useProductForm = (editingId: string | null) => {
    const router = useRouter();
    const { formState, setters, results, courierDiscount } = useProfitCalculator();

    const [platforms, setPlatforms] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

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
                    const data = await productService.getById(editingId);
                    if (data) {
                        const productData = {
                            ...data,
                            adjustments: data.financial_adjustments || [],
                            images: data.product_images && data.product_images.length > 0
                                ? data.product_images.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)).map((img: any) => img.storage_path) // Extract path string
                                : (data.image_url ? [data.image_url] : [])
                        };
                        setters.loadProduct(productData);
                    }
                } catch (error) {
                    console.error("Error loading product:", error);
                }
            };
            loadProduct();
        }
    }, [editingId]);

    const handleSave = async (cloneMode = false) => {
        if (!formState.name) return alert('Nombre requerido');
        if (!formState.buyPrice) return alert('Precio requerido');

        setSaving(true);
        setStatusMsg('');

        try {
            // Determine status based on fields
            let productStatus: ProductStatus = 'ORDERED';
            if (formState.salePrice > 0) {
                productStatus = 'SOLD';
            } else if (formState.shippingCost > 0 || formState.localShipping > 0 || formState.taxCost > 0) {
                productStatus = 'RECEIVED';
            }

            const productData: any = {
                platform_id: formState.platformId,
                purchase_account_id: formState.purchaseAccountId || undefined,
                name: formState.name,
                buy_price: formState.buyPrice,
                shipping_cost: formState.shippingCost,
                origin_tax: formState.originTax || 0,
                tax_cost: formState.taxCost,
                sale_price: formState.salePrice,
                local_shipping_cost: formState.localShipping,
                exchange_rate: formState.exchangeRate,
                product_url: formState.productUrl,
                image_url: formState.imageUrl,
                tracking_number: formState.trackingNumber,
                courier_tracking: formState.courierTracking,

                // Calculated
                net_cost: results.net_cost,
                gross_profit: results.gross_profit,
                margin: results.margin,
                roi: results.roi,

                status: productStatus,
            };

            // Set sold_at when marking as SOLD
            if (productStatus === 'SOLD') {
                productData.sold_at = new Date().toISOString();
            }

            let targetId = editingId;

            if (editingId && !cloneMode) {
                // UPDATE
                await productService.update(editingId, productData);
            } else {
                // CREATE (or Clone)
                const newProduct = await productService.create(productData);
                targetId = newProduct.id;
            }

            // Handle Relations (Adjustments)
            // 1. Delete old adjustments if editing (Simplest strategy: Replace all)
            if (editingId && !cloneMode) {
                await supabase.from('financial_adjustments').delete().eq('product_id', editingId);
            }

            if (formState.adjustments.length > 0 && targetId) {
                const adjs = formState.adjustments.map(a => ({
                    product_id: targetId,
                    type: a.type,
                    amount: a.amount,
                    percentage: a.percentage
                }));
                await supabase.from('financial_adjustments').insert(adjs);
            }

            // Handle Images
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

                // Update primary image_url for fast access/legacy support
                const primaryImage = imgs[0]?.storage_path;
                if (primaryImage) {
                    await supabase.from('products').update({ image_url: primaryImage }).eq('id', targetId);
                }
            }

            // Reset or Redirect
            if (targetId && (editingId && !cloneMode)) {
                setTimeout(() => router.push('/inventory'), 1000);
                setStatusMsg('¡Editado Exitosamente!');
            } else {
                if (cloneMode) {
                    setStatusMsg('¡Clonado! Listo para el siguiente 👯');
                } else {
                    setStatusMsg('¡Producto Guardado!');
                    setters.resetForm();
                    setTimeout(() => setStatusMsg(''), 3000);
                }
            }

        } catch (error) {
            console.error('Save failed:', error);
            setStatusMsg('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleAddToQueue = () => {
        // Queue logic typically just adds to local state or list, handled in parent or here?
        // For now, minimal implementation as it wasn't fully developed in the monolith view
        alert("Agregado a Cola (Simulado)");
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
        handleSave,
        handleAddToQueue,
        courierDiscount // Pass through
    };
}
