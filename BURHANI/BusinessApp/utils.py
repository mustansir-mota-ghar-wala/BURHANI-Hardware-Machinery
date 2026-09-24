from decimal import Decimal, ROUND_HALF_UP

def calculate_gst_extraction(total_incl_gst, gst_percent):
    """
    Extracts taxable value and GST amount from a total that includes GST.
    Formula: Taxable = (Total * 100) / (100 + GST%)
    """
    total_incl_gst = Decimal(str(total_incl_gst))
    gst_percent = Decimal(str(gst_percent))
    
    taxable_value = (total_incl_gst * Decimal('100')) / (Decimal('100') + gst_percent)
    taxable_value = taxable_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    gst_total = total_incl_gst - taxable_value
    cgst = gst_total / Decimal('2')
    sgst = gst_total / Decimal('2')
    
    return {
        'taxable_value': taxable_value,
        'gst_total': gst_total,
        'cgst': cgst.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'sgst': sgst.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    }

def update_weighted_average_cost(product, new_qty, new_taxable_total):
    """
    Updates the weighted average cost of a product.
    Formula: (Old Stock * Old Avg Cost + New Taxable Total) / (Old Stock + New Qty)
    """
    old_stock = Decimal(str(product.stock_qty))
    old_avg_cost = Decimal(str(product.avg_cost))
    new_qty = Decimal(str(new_qty))
    new_taxable_total = Decimal(str(new_taxable_total))
    
    total_qty = old_stock + new_qty
    if total_qty == 0:
        return Decimal('0.00')
        
    total_cost_value = (old_stock * old_avg_cost) + new_taxable_total
    new_avg_cost = total_cost_value / total_qty
    
    return new_avg_cost.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
