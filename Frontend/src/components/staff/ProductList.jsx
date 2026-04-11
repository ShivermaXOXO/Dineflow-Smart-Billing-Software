import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faMinus, faTag, faFilter } from '@fortawesome/free-solid-svg-icons';

const ProductList = ({ products, search, setSearch, handleAddToBill, selectedItems = [], updateQuantity, removeItem }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  console.log(products);

  // Filter products based on search input and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.type))];

  // Group filtered products by type
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {});

  return (
    <div className="w-full">
      {/* Search and Filter Section */}
      <div className="space-y-4 mb-6">
        {/* Search Input */}
        <div className="relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search for items..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Category:</span>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-blue-200 hover:text-blue-800'
                }`}
              >
                {category === 'all' ? 'All Items' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} found
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
        </p>
      </div>

      {/* No products found */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-4xl mb-4" />
          <p className="text-gray-500 text-lg">No items found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedProducts).map(([type, items]) => (
            <div key={type} className="bg-gray-50 rounded-lg p-2">
              <h2 className="text-lg font-semibold mb-2 capitalize text-gray-800 flex items-center">
                <FontAwesomeIcon icon={faTag} className="mr-2 text-indigo-600" />
                {type} ({items.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
                {items.map(product => {
                  // Handle both productId (OrderForm) and id (StaffDashboard) cases
                  const selectedItem = selectedItems?.find(item => 
                    item.productId === product.id || item.id === product.id
                  );
                  const isInBill = !!selectedItem;
                  const quantity = selectedItem?.quantity || 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 hover:border-indigo-300 min-h-[70px] flex flex-row items-center gap-3"
                    >
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150';
                          }}
                        />
                      )}
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-semibold text-gray-900 mb-1 text-xs truncate">{product.name}</h3>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-sm font-bold text-indigo-600">₹{product.price}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded-full">
                              {product.type}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          {!isInBill ? (
                            <button
                              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium text-xs whitespace-nowrap"
                              onClick={() => handleAddToBill(product)}
                            >
                              <FontAwesomeIcon icon={faPlus} />
                              Add
                            </button>
                          ) : updateQuantity ? (
                            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                              >
                                <FontAwesomeIcon icon={faMinus} className="text-xs" />
                              </button>
                              <span className="text-xs font-semibold text-gray-800 px-1 min-w-[16px] text-center">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                className="w-5 h-5 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                              >
                                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-sm text-gray-600 bg-gray-100 rounded-lg p-2 whitespace-nowrap">
                              In Bill: {quantity}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;