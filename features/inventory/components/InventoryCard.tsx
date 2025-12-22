import { useState } from 'react';
import { Package, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { InventoryItem, AdjustmentType } from '../types';
import { useRouter } from 'next/navigation';

interface InventoryCardProps {
    product: InventoryItem;
    refreshList?: () => void;
    onDelete: (id: string) => void;
}

export default function InventoryCard({ product: initialProduct, refreshList, onDelete }: InventoryCardProps) {
    const [p, setProduct] = useState(initialProduct);
    const [expanded, setExpanded] = useState(false);
    const [courierDiscount, setCourierDiscount] = useState(0);
    const [isDiscountApplied, setIsDiscountApplied] = useState(false); // New State

    // Quick Edit State
    const [editValues, setEditValues] = useState({
        salePrice: initialProduct.sale_price || 0,
        localShipping: initialProduct.local_shipping_cost || 0,
        taxCost: initialProduct.tax_cost || 0,
        trackingNumber: initialProduct.tracking_number || '',
        courierTracking: initialProduct.courier_tracking || '',
        adjustments: initialProduct.financial_adjustments ? [...initialProduct.financial_adjustments] : []
    });

    const router = useRouter();

    // Profit Calc Helper
    const getEstProfit = () => {
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * (p.exchange_rate || 58)) + (p.tax_cost || 0) + (p.local_shipping_cost || 0);

        let adjustmentsTotal = 0;
        if (p.financial_adjustments) {
            adjustmentsTotal = p.financial_adjustments.reduce((sum, adj) => {
                if (adj.type === 'CREDIT_CLAIM' || adj.type === 'REWARD_BACK' || adj.type === 'PRICE_PROTECTION') {
                    return sum + (adj.amount || 0);
                }
                return sum;
            }, 0);
        }

        const profit = (p.sale_price || 0) - dopCost + adjustmentsTotal;
        return Math.round(profit);
    };

    const profit = getEstProfit();

    const toggleExpand = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (willExpand) {
            // Load Edit Values
            setEditValues({
                salePrice: p.sale_price || 0,
                localShipping: p.local_shipping_cost || 0,
                taxCost: p.tax_cost || 0,
                trackingNumber: p.tracking_number || '',
                courierTracking: p.courier_tracking || '',
                adjustments: p.financial_adjustments ? [...p.financial_adjustments] : []
            });

            // Load Preferences (Discount & Local Shipping)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('user_preferences')
                    .select('default_courier_discount, default_local_shipping')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    if (data.default_courier_discount) {
                        setCourierDiscount(Number(data.default_courier_discount));
                    }
                    // Auto-fill Local Shipping if 0
                    if (data.default_local_shipping && (p.local_shipping_cost === 0 || !p.local_shipping_cost)) {
                        setEditValues(prev => ({ ...prev, localShipping: Number(data.default_local_shipping) }));
                    }
                }
            }
        }
    };

    const handleQuickSave = async () => {
        // Auto-Status Logic based on rules
        let newStatus = 'ORDERED';
        const existingShippingCost = p.shipping_cost || 0;

        if (editValues.salePrice > 0) {
            newStatus = 'SOLD';
        } else if (existingShippingCost > 0 || editValues.localShipping > 0 || editValues.taxCost > 0) {
            newStatus = 'RECEIVED';
        } else {
            newStatus = 'ORDERED';
        }

        try {
            // Update Product
            const { error: prodError } = await supabase
                .from('products')
                .update({
                    sale_price: editValues.salePrice,
                    local_shipping_cost: editValues.localShipping,
                    tax_cost: editValues.taxCost,
                    tracking_number: editValues.trackingNumber,
                    courier_tracking: editValues.courierTracking,
                    status: newStatus as any
                })
                .eq('id', p.id);

            if (prodError) throw prodError;

            // Update Adjustments
            await supabase.from('financial_adjustments').delete().eq('product_id', p.id);
            if (editValues.adjustments.length > 0) {
                const adjPayload = editValues.adjustments.map(a => ({
                    product_id: p.id,
                    type: a.type,
                    amount: a.amount,
                    percentage: a.percentage
                }));
                const { error: adjError } = await supabase.from('financial_adjustments').insert(adjPayload);
                if (adjError) throw adjError;
            }

            // Update Local State & Close
            const newAdjustments = editValues.adjustments.map(a => ({ ...a })); // Clone
            setProduct(prev => ({
                ...prev,
                sale_price: editValues.salePrice,
                local_shipping_cost: editValues.localShipping,
                tax_cost: editValues.taxCost,
                status: newStatus as any,
                financial_adjustments: newAdjustments
            }));
            setExpanded(false);
            if (refreshList) refreshList();
        } catch (error) {
            console.error(error);
            alert('Error al actualizar');
        }
    };

    const modifyAdjustment = (action: 'ADD' | 'REMOVE' | 'UPDATE', payload?: any) => {
        if (action === 'ADD') {
            setEditValues(prev => ({
                ...prev,
                adjustments: [...prev.adjustments, { id: crypto.randomUUID(), type: payload.type, amount: 0, percentage: 0 }]
            }));
        } else if (action === 'REMOVE') {
            setEditValues(prev => ({
                ...prev,
                adjustments: prev.adjustments.filter(a => a.id !== payload.adjId)
            }));
        } else if (action === 'UPDATE') {
            setEditValues(prev => ({
                ...prev,
                adjustments: prev.adjustments.map(a => {
                    if (a.id !== payload.adjId) return a;
                    const updated = { ...a, [payload.field]: payload.value };

                    const buyPrice = p.buy_price || 0;
                    if (buyPrice > 0) {
                        if (payload.field === 'percentage') {
                            updated.amount = Number((buyPrice * (Number(payload.value) / 100)).toFixed(2));
                        } else if (payload.field === 'amount') {
                            updated.percentage = Number(((Number(payload.value) / buyPrice) * 100).toFixed(2));
                        }
                    }
                    return updated;
                })
            }));
        }
    };

    return (
        <div className={`bg-white border text-slate-900 rounded-xl overflow-hidden shadow-sm transition-all ${expanded ? 'border-slate-400 ring-1 ring-slate-400' : 'border-slate-100'}`}>
            <div onClick={toggleExpand} className="p-3 flex gap-3 items-center cursor-pointer">
                <div className="w-12 h-12 bg-slate-50 rounded-lg shrink-0 overflow-hidden border border-slate-200">
                    {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package size={20} />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                    <div className="flex gap-2 text-xs text-slate-500 mt-1">
                        <StatusBadge status={p.status} />
                        <span className="text-slate-400">•</span>
                        <span>${p.buy_price}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${profit > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {profit > 0 ? '+' : ''}RD$ {profit.toLocaleString()}
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="bg-slate-50 p-3 border-t border-slate-200 animate-in slide-in-from-top-2">
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block">Pago Courier (RD$)</label>
                            {courierDiscount > 0 && (
                                <button
                                    onClick={() => {
                                        if (editValues.taxCost > 0 && !isDiscountApplied) {
                                            const discounted = editValues.taxCost * (1 - (courierDiscount / 100));
                                            setEditValues(prev => ({ ...prev, taxCost: Math.round(discounted) }));
                                            setIsDiscountApplied(true);
                                        }
                                    }}
                                    disabled={isDiscountApplied}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 transition-colors ${isDiscountApplied
                                        ? 'bg-slate-100 text-slate-400 cursor-default'
                                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
                                        }`}
                                >
                                    <span className="text-[8px]">{isDiscountApplied ? '✓' : '⚡'}</span>
                                    {isDiscountApplied ? 'Aplicado' : `-${courierDiscount}%`}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <span className="absolute left-2 top-2 text-slate-400 text-xs">$</span>
                            <input
                                type="number"
                                value={editValues.taxCost || ''}
                                onChange={(e) => {
                                    setEditValues(prev => ({ ...prev, taxCost: Number(e.target.value) }));
                                    setIsDiscountApplied(false);
                                }}
                                onBlur={() => {
                                    if (courierDiscount > 0 && editValues.taxCost > 0 && !isDiscountApplied) {
                                        const discounted = editValues.taxCost * (1 - (courierDiscount / 100));
                                        setEditValues(prev => ({ ...prev, taxCost: Math.round(discounted) }));
                                        setIsDiscountApplied(true);
                                    }
                                }}
                                className={`w-full pl-5 p-2 bg-orange-50 border rounded-lg font-bold text-slate-700 outline-none transition-all ${isDiscountApplied ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-orange-100 focus:border-orange-300'}`}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 items-end mb-3">
                        <div className="flex-[1.5]">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Precio Venta (RD$)</label>
                            <input
                                type="number"
                                value={editValues.salePrice || ''}
                                onChange={(e) => setEditValues(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Envío Local</label>
                            <input
                                type="number"
                                value={editValues.localShipping || ''}
                                onChange={(e) => setEditValues(prev => ({ ...prev, localShipping: Number(e.target.value) }))}
                                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-600 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Logística / Rastreo (Opcional)</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">📦</span>
                                <input
                                    type="text"
                                    placeholder="Tracking Tienda (TBA...)"
                                    value={editValues.trackingNumber || ''}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                    className="w-full pl-8 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🚚</span>
                                <input
                                    type="text"
                                    placeholder="Tracking Courier (MIA...)"
                                    value={editValues.courierTracking || ''}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, courierTracking: e.target.value }))}
                                    className="w-full pl-8 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Ajustes / Créditos</span>
                            <div className="flex gap-1">
                                <button onClick={() => modifyAdjustment('ADD', { type: 'CREDIT_CLAIM' })} className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200">+ Credit</button>
                                <button onClick={() => modifyAdjustment('ADD', { type: 'REWARD_BACK' })} className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold hover:bg-amber-200">+ RewardBack</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {editValues.adjustments.map((adj, idx) => (
                                <div key={idx} className="flex gap-1 items-center">
                                    <select
                                        className="text-[10px] w-24 border border-slate-200 rounded px-1 py-1.5 bg-white text-slate-700 outline-none"
                                        value={adj.type}
                                        onChange={(e) => modifyAdjustment('UPDATE', { adjId: adj.id, field: 'type', value: e.target.value })}
                                    >
                                        <option value="CREDIT_CLAIM">CreditClaim</option>
                                        <option value="REWARD_BACK">RewardBack</option>
                                        <option value="COUPON">Cupón</option>
                                        <option value="PRICE_ADJUSTMENT">Ajuste</option>
                                    </select>
                                    <div className="relative w-14">
                                        <input type="number" placeholder="%" value={adj.percentage || ''}
                                            onChange={(e) => modifyAdjustment('UPDATE', { adjId: adj.id, field: 'percentage', value: e.target.value })}
                                            className="w-full px-1 py-1.5 text-xs text-center border border-slate-200 rounded outline-none bg-white"
                                        />
                                        <span className="absolute right-1 top-1.5 text-[9px] text-slate-400">%</span>
                                    </div>
                                    <div className="relative flex-1">
                                        <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-400">$</span>
                                        <input type="number" placeholder="0.00" value={adj.amount || ''}
                                            onChange={(e) => modifyAdjustment('UPDATE', { adjId: adj.id, field: 'amount', value: e.target.value })}
                                            className="w-full pl-3 pr-2 py-1.5 text-xs border border-slate-200 rounded outline-none font-medium"
                                        />
                                    </div>
                                    <button onClick={() => modifyAdjustment('REMOVE', { adjId: adj.id })} className="text-slate-400 hover:text-red-500 p-1 bg-white border border-slate-100 rounded"><Trash2 size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleQuickSave} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Package size={16} /> Confirmar Cambios
                    </button>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                        <button type="button" onClick={(e) => { e.stopPropagation(); console.log('Delete Requested', p.id); onDelete(p.id); }} className="text-red-500 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"><Trash2 size={14} /> Eliminar</button>
                        <button type="button" onClick={() => router.push('/calculator?edit=' + p.id)} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"><Pencil size={14} /> Editar Completo</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'RECEIVED') return <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] uppercase font-bold">Recibido</span>;
    if (status === 'SOLD') return <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] uppercase font-bold">Vendido</span>;
    if (status === 'ORDERED') return <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] uppercase font-bold">Comprado</span>;
    return null;
}
