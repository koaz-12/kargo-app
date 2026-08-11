import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

interface CreateSaleParams {
    skus: string[];
    totalAmount: number;
    shippingCost: number;
    notes?: string;
}

export function useSales() {
    const [isProcessing, setIsProcessing] = useState(false);

    const calculateDopCost = (p: Product) => {
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const exchangeRate = p.exchange_rate || 58;
        return (usdCost * exchangeRate) + (p.tax_cost || 0);
    };

    const createSale = async (params: CreateSaleParams) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");
        setIsProcessing(true);

        try {
            // 1. Get workspace
            const { data: workspaceMembers, error: wsError } = await supabase
                .from('workspace_members')
                .select('workspace_id')
                .eq('user_id', user.id)
                .limit(1);

            if (wsError || !workspaceMembers?.length) throw new Error("No se pudo obtener el workspace");
            const workspaceId = workspaceMembers[0].workspace_id;

            // 2. Fetch exactly ONE available product per SKU
            const productsToSell: Product[] = [];
            for (const sku of params.skus) {
                const { data: pData, error: pError } = await supabase
                    .from('products')
                    .select('*')
                    .or(`sku.eq."${sku}",name.eq."${sku}"`)
                    .eq('status', 'RECEIVED')
                    .limit(1)
                    .single();

                if (pError || !pData) {
                    throw new Error(`No hay stock disponible para: ${sku}`);
                }
                productsToSell.push(pData as Product);
            }

            // 3. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    workspace_id: workspaceId,
                    status: 'COMPLETED',
                    total_amount: params.totalAmount,
                    shipping_cost: params.shippingCost,
                    notes: params.notes,
                    discount: 0
                }])
                .select()
                .single();

            if (orderError) throw new Error("Error al crear la orden: " + orderError.message);
            const orderId = orderData.id;

            // 4. Calculate Proportions
            const totalCost = productsToSell.reduce((acc, p) => acc + calculateDopCost(p), 0);

            // 5. Update Products
            const updatePromises = productsToSell.map((p, index) => {
                // Determine ratio
                let ratio = 1;
                if (productsToSell.length > 1 && totalCost > 0) {
                    ratio = calculateDopCost(p) / totalCost;
                } else if (productsToSell.length > 1) {
                    // Fallback to even split if costs are 0
                    ratio = 1 / productsToSell.length;
                }

                // If it's the last item, assign the remainder to avoid rounding issues
                // (For simplicity here we just use the strict ratio, minor decimal differences are okay for now)
                
                const allocatedSalePrice = Number((params.totalAmount * ratio).toFixed(2));
                const allocatedShippingCost = Number((params.shippingCost * ratio).toFixed(2));

                return supabase
                    .from('products')
                    .update({
                        status: 'SOLD',
                        order_id: orderId,
                        sale_price: allocatedSalePrice,
                        local_shipping_cost: allocatedShippingCost
                    })
                    .eq('id', p.id);
            });

            const results = await Promise.all(updatePromises);
            const failed = results.find(r => r.error);
            if (failed) throw new Error("Error al actualizar productos: " + failed.error?.message);

            return orderData;
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        createSale,
        isProcessing
    };
}
