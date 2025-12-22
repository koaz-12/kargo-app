import { useState, useEffect } from 'react';
import { useProfitCalculator } from '../../../hooks/useProfitCalculator';
import { productService } from '../../../services/productService';
import { storageService } from '../../../services/storageService';
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
                            images: data.product_images?.map((img: any) => ({
                                storage_path: img.storage_path,
                                url: storageService.getPublicUrl(img.storage_path),
                                display_order: img.display_order
                            })) || []
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
            const productData = {
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

                // Calculated
                net_cost: results.net_cost,
                gross_profit: results.gross_profit,
                margin: results.margin,
                roi: results.roi,

                status: 'ORDERED', // 'DRAFT' not valid in DB Enum, using 'ORDERED'
            };

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
                // If editing, ideally we sync (complex).
                // Existing simple logic: Delete all references and re-insert is risky for Storage files?
                // Actually `storage_path` persists. We just re-link the metadata.
                if (editingId && !cloneMode) {
                    await supabase.from('product_images').delete().eq('product_id', editingId);
                }

                const imgs = formState.images.map((img: any, idx: number) => ({
                    product_id: targetId,
                    storage_path: img.storage_path,
                    display_order: idx
                }));
                await supabase.from('product_images').insert(imgs);
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
