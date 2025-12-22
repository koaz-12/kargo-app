import { Transaction, ProfitResult, AdjustmentType } from '../types';

/**
 * Calculates the net cost and profit based on transaction details and financial adjustments.
 * Net Cost (USD) = (Buy Price + Shipping) - Sum(Credits/Refunds)
 * Net Cost (DOP) = (Net Cost (USD) * Exchange Rate) + Courier/Tax (DOP)
 * Profit (DOP) = Sale Price (DOP) - Net Cost (DOP) - Local Shipping (DOP)
 *
 * @param transaction The transaction data. Note: tax_cost is treated as Local Currency (DOP)
 * @param salePrice The selling price in DOP
 * @param localShippingCost The cost to ship to the final customer in DOP
 * @returns ProfitResult object with net cost (DOP), gross profit (DOP), and margin
 */
export const calculateProfit = (
    transaction: Transaction,
    salePrice: number = 0,
    localShippingCost: number = 0
): ProfitResult => {
    const { buy_price, shipping_cost, tax_cost, adjustments, exchange_rate } = transaction;

    // 1. Calculate USD Net Cost (Excluding Tax/Courier which is now DOP)
    const total_adjustments_usd = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const base_cost_usd = buy_price + shipping_cost; // Tax removed from here
    const net_cost_usd = base_cost_usd - total_adjustments_usd;

    // 2. Convert to Local Currency (DOP) and Add Local Landing Costs
    const rate = exchange_rate || 58.0;
    // Net Cost in DOP = (USD Component * Rate) + Courier (DOP)
    const net_cost_dop = (net_cost_usd * rate) + tax_cost;


    // 3. Profit Calculation (in DOP)
    const total_expenses_dop = net_cost_dop + localShippingCost;
    const gross_profit = salePrice - total_expenses_dop;

    let profit_margin = 0;
    if (salePrice > 0) {
        // Margin = (Profit / Sale Price) * 100
        profit_margin = (gross_profit / salePrice) * 100;
    }

    return {
        net_cost: Number(net_cost_dop.toFixed(2)),
        gross_profit: Number(gross_profit.toFixed(2)),
        profit_margin: Number(profit_margin.toFixed(2)),
        total_adjustments: Number(total_adjustments_usd.toFixed(2)),
    };
};
