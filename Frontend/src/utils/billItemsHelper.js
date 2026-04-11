// Helper functions for handling bill items display

/**
 * Get display name for a bill item with fallbacks
 * @param {Object} item - The bill item
 * @param {Array} products - Optional products array for lookup
 * @returns {string} - Display name for the item
 */
export const getItemDisplayName = (item, products = []) => {
  // First priority: item has a name field
  if (item.name) {
    return item.name;
  }
  
  // Second priority: item has productName field  
  if (item.productName) {
    return item.productName;
  }
  
  // Third priority: lookup in products array by productId
  if (item.productId && products.length > 0) {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      return product.name;
    }
  }
  
  // Last resort: show product ID
  return `Product ID: ${item.productId || 'Unknown'}`;
};

/**
 * Format bill items for display with proper names
 * @param {Array} items - Array of bill items
 * @param {Array} products - Optional products array for lookup
 * @returns {Array} - Array of items with display names
 */
export const formatBillItemsForDisplay = (items, products = []) => {
  if (!Array.isArray(items)) {
    return [];
  }
  
  return items.map(item => ({
    ...item,
    displayName: getItemDisplayName(item, products),
    quantity: item.quantity || 0,
    price: item.price || 0
  }));
};

/**
 * Create a summary string for bill items (e.g., "Pizza x2, Burger x1")
 * @param {Array} items - Array of bill items
 * @param {Array} products - Optional products array for lookup
 * @returns {string} - Summary string
 */
export const getBillItemsSummary = (items, products = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'No items';
  }
  
  const formattedItems = formatBillItemsForDisplay(items, products);
  return formattedItems
    .map(item => `${item.displayName} × ${item.quantity}`)
    .join(', ');
};
