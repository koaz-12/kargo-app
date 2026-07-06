import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product, Platform } from '../types/index';
import { calculateProfit } from '../utils/calculateProfit';
import { getPublicUrl } from '../utils/imageUrl';

export function useStats() {
    const [products, setProducts] = useState<Product[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);

    // Goal State
    const [monthlyGoal, setMonthlyGoal] = useState<number>(0);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState<string>('');

    // Date State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [rentabilityPage, setRentabilityPage] = useState(1);
    const RENTABILITY_ITEMS_PER_PAGE = 10;

    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    const changeMonth = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
        setRentabilityPage(1);
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setMonthlyGoal(0);
            setTempGoal('');

            const [prodRes, platRes, goalRes] = await Promise.all([
                supabase.from('products').select('*, adjustments:financial_adjustments(*)'),
                supabase.from('platforms').select('*'),
                supabase.from('monthly_goals').select('*').eq('month_key', currentMonthKey).maybeSingle()
            ]);

            if (prodRes.data) setProducts(prodRes.data);
            if (platRes.data) setPlatforms(platRes.data);

            if (goalRes.data) {
                setMonthlyGoal(goalRes.data.target_amount);
                setTempGoal(String(goalRes.data.target_amount));
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: prefData } = await supabase.from('user_preferences')
                        .select('default_monthly_goal')
                        .eq('user_id', user.id)
                        .single();

                    if (prefData?.default_monthly_goal) {
                        setMonthlyGoal(prefData.default_monthly_goal);
                        setTempGoal(String(prefData.default_monthly_goal));
                    }
                }
            }

            setLoading(false);
        };
        loadData();
    }, [currentMonthKey]);

    const handleSaveGoal = async () => {
        const amount = parseFloat(tempGoal);
        if (isNaN(amount) || amount <= 0) return { success: false };

        try {
            const { error } = await supabase
                .from('monthly_goals')
                .upsert({
                    month_key: currentMonthKey,
                    target_amount: amount
                }, { onConflict: 'month_key' });

            if (error) throw error;

            setMonthlyGoal(amount);
            setIsEditingGoal(false);
            return { success: true };
        } catch (err) {
            console.error("Error saving goal:", err);
            return { success: false, error: err };
        }
    };

    // --- CALCULATIONS ---
    const totalItems = products.length;
    const soldProducts = products.filter(p => p.status === 'SOLD');

    let realizedRevenue = 0;
    let realizedCost = 0;
    let profitThisMonth = 0;
    let profitThisYear = 0;

    const monthlyTrend: Record<string, number> = {};
    let totalDaysToSell = 0;
    let productsWithDates = 0;

    const productPerformance: Record<string, { name: string, count: number, revenue: number, cost: number, profit: number, image?: string }> = {};

    soldProducts.forEach(p => {
        const tx = {
            buy_price: Number(p.buy_price) || 0,
            shipping_cost: Number(p.shipping_cost) || 0,
            origin_tax: Number(p.origin_tax) || 0,
            tax_cost: Number(p.tax_cost) || 0,
            adjustments: p.adjustments || [],
            exchange_rate: Number(p.exchange_rate) || 58.5
        };

        const calc = calculateProfit(tx, Number(p.sale_price) || 0, Number(p.local_shipping_cost) || 0);

        const r = (Number(p.sale_price) || 0);
        const dopCost = calc.net_cost;
        const profit = calc.gross_profit;

        realizedRevenue += r;
        realizedCost += dopCost;

        const effectiveDateStr = p.sold_at || p.updated_at || p.created_at;

        if (effectiveDateStr) {
            const saleDate = new Date(effectiveDateStr);
            const saleMonth = saleDate.getMonth();
            const saleYear = saleDate.getFullYear();
            const monthKey = `${saleYear}-${String(saleMonth + 1).padStart(2, '0')}`;

            monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + profit;

            if (saleYear === currentYear) {
                profitThisYear += profit;
                if (saleMonth === currentMonth) {
                    profitThisMonth += profit;
                }
            }

            if (p.created_at) {
                const createDate = new Date(p.created_at);
                const diffTime = Math.abs(saleDate.getTime() - createDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalDaysToSell += diffDays;
                productsWithDates++;
            }
        }

        const productName = p.name || 'Producto sin nombre';
        const publicImage = p.image_url ? getPublicUrl(p.image_url) : undefined;

        if (!productPerformance[productName]) {
            productPerformance[productName] = {
                name: productName,
                count: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                image: publicImage
            };
        } else if (!productPerformance[productName].image && publicImage) {
            productPerformance[productName].image = publicImage;
        }

        productPerformance[productName].count += 1;
        productPerformance[productName].revenue += r;
        productPerformance[productName].cost += dopCost;
        productPerformance[productName].profit += profit;
    });

    const realizedProfit = realizedRevenue - realizedCost;
    const realizedMargin = realizedRevenue > 0 ? Math.round((realizedProfit / realizedRevenue) * 100) : 0;
    const roi = realizedCost > 0 ? Math.round((realizedProfit / realizedCost) * 100) : 0;
    const avgInventoryDays = productsWithDates > 0 ? Math.round(totalDaysToSell / productsWithDates) : 0;

    const trendKeys = Object.keys(monthlyTrend).sort();
    const last6Keys = trendKeys.slice(-6);

    const sortedProducts = Object.values(productPerformance).sort((a, b) => b.profit - a.profit);

    const unsoldProducts = products.filter(p => p.status !== 'SOLD');
    let activeInvestment = 0;
    let projectedRevenue = 0;
    let activeCostPriced = 0;

    unsoldProducts.forEach(p => {
        const tx = {
            buy_price: Number(p.buy_price) || 0,
            shipping_cost: Number(p.shipping_cost) || 0,
            origin_tax: Number(p.origin_tax) || 0,
            tax_cost: Number(p.tax_cost) || 0,
            adjustments: p.adjustments || [],
            exchange_rate: Number(p.exchange_rate) || 58.5
        };
        const calc = calculateProfit(tx, Number(p.sale_price) || 0, Number(p.local_shipping_cost) || 0);

        activeInvestment += calc.net_cost;

        if (p.sale_price && p.sale_price > 0) {
            projectedRevenue += Number(p.sale_price);
            activeCostPriced += calc.net_cost;
        }
    });

    const trueProjectedProfit = projectedRevenue > 0 ? (projectedRevenue - activeCostPriced) : 0;

    const platformStats: Record<string, { count: number, invested: number }> = {};
    let totalInvested = 0;

    products.forEach(p => {
        if (!p.platform_id) return;
        
        const tx = {
            buy_price: Number(p.buy_price) || 0,
            shipping_cost: Number(p.shipping_cost) || 0,
            origin_tax: Number(p.origin_tax) || 0,
            tax_cost: Number(p.tax_cost) || 0,
            adjustments: p.adjustments || [],
            exchange_rate: Number(p.exchange_rate) || 58.5
        };
        const calc = calculateProfit(tx, 0, 0);

        if (!platformStats[p.platform_id]) {
            platformStats[p.platform_id] = { count: 0, invested: 0 };
        }
        platformStats[p.platform_id].count++;
        platformStats[p.platform_id].invested += calc.net_cost;
        totalInvested += calc.net_cost;
    });

    const staleItems = products
        .filter(p => p.status === 'RECEIVED' && p.created_at)
        .filter(p => {
            const days = Math.abs(new Date().getTime() - new Date(p.created_at!).getTime()) / (1000 * 3600 * 24);
            return days > 60;
        })
        .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());

    return {
        loading,
        products,
        platforms,
        monthlyGoal,
        tempGoal,
        isEditingGoal,
        selectedDate,
        rentabilityPage,
        RENTABILITY_ITEMS_PER_PAGE,
        currentMonthKey,
        monthNames,
        
        setTempGoal,
        setIsEditingGoal,
        changeMonth,
        setRentabilityPage,
        handleSaveGoal,

        totalItems,
        realizedRevenue,
        realizedCost,
        profitThisMonth,
        profitThisYear,
        monthlyTrend,
        realizedProfit,
        realizedMargin,
        roi,
        avgInventoryDays,
        last6Keys,
        sortedProducts,
        activeInvestment,
        projectedRevenue,
        trueProjectedProfit,
        platformStats,
        totalInvested,
        staleItems,
    };
}
