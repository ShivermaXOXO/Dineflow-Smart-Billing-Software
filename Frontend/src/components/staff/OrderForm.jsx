import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faMinus, 
  faTimes, 
  faUser, 
  faPhone, 
  faUtensils,
  faStickyNote
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const OrderForm = ({ isOpen, onClose, hotelId, onOrderCreated }) => {
  const [products, setProducts] = useState([]);
  const [orderData, setOrderData] = useState({
    customername: '',
    phoneNumber: '',
    tableNumber: '',
    diningType: '',
    carDetails: '',
    notes: ''
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/${hotelId}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to fetch products');
      }
    };

    if (isOpen && hotelId) {
      fetchProducts();
    }
  }, [isOpen, hotelId]);

  // Add item to order
  const addItem = (product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems(prev => [...prev, {
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1
      }]);
    }
  };

  // Remove item from order
  const removeItem = (productId) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setSelectedItems(prev => 
      prev.map(item => 
        item.productId === productId 
          ? { ...item, quantity: quantity }
          : item
      )
    );
  };

  // Calculate total
  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Submit order
  const submitOrder = async () => {
    if (!orderData.customername.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/orders`, {
        ...orderData,
        items: selectedItems.map(item => ({
          productId: item.productId,
          name: item.name,
          productName: item.name, // Add both 'name' and 'productName' for compatibility
          quantity: item.quantity,
          price: item.price
        })),
        hotelId: hotelId
      });

      toast.success('Order created successfully');
      onOrderCreated(response.data.order);
      onClose();
      
      // Reset form
      setOrderData({
        customername: '',
        phoneNumber: '',
        tableNumber: '',
        diningType: '',
        carDetails: '',
        notes: ''
      });
      setSelectedItems([]);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Create New Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-600" />
                Customer Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={orderData.customername}
                  onChange={(e) => setOrderData(prev => ({ ...prev, customername: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={orderData.phoneNumber}
                  onChange={(e) => setOrderData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dining Type
                </label>
                <select
                  value={orderData.diningType}
                  onChange={(e) => setOrderData(prev => ({ 
                    ...prev, 
                    diningType: e.target.value,
                    // Clear table number if switching to takeaway
                    tableNumber: e.target.value === 'takeaway' ? '' : prev.tableNumber,
                    // Clear car details if switching to dine-in
                    carDetails: e.target.value === 'dine-in' ? '' : prev.carDetails
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select dining type</option>
                  <option value="dine-in">🍽️ Dine-In</option>
                  <option value="takeaway">🥡 Takeaway</option>
                </select>
              </div>

              {orderData.diningType === 'dine-in' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={orderData.tableNumber}
                    onChange={(e) => setOrderData(prev => ({ ...prev, tableNumber: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter table number"
                  />
                </div>
              )}

              {orderData.diningType === 'takeaway' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Car Number
                  </label>
                  <input
                    type="text"
                    value={orderData.carDetails}
                    onChange={(e) => setOrderData(prev => ({ ...prev, carDetails: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter car number/details"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={orderData.notes}
                  onChange={(e) => setOrderData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  placeholder="Special instructions or notes"
                />
              </div>

              {/* Selected Items */}
              <div>
                <h4 className="text-md font-medium mb-3">Selected Items ({selectedItems.length})</h4>
                {selectedItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">No items selected</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">₹{item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                          >
                            <FontAwesomeIcon icon={faMinus} className="text-xs" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                          >
                            <FontAwesomeIcon icon={faPlus} className="text-xs" />
                          </button>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <FontAwesomeIcon icon={faTimes} className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products List */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FontAwesomeIcon icon={faUtensils} className="mr-2 text-gray-600" />
                Available Products
              </h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map((product) => {
                  const selectedItem = selectedItems.find(item => item.productId === product.id);
                  const isInBill = !!selectedItem;
                  const quantity = selectedItem?.quantity || 0;

                  return (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <p className="text-green-600 font-bold">₹{parseFloat(product.price).toLocaleString()}</p>
                        </div>
                        {!isInBill ? (
                          <button
                            onClick={() => addItem(product)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                          >
                            <FontAwesomeIcon icon={faPlus} className="mr-1" />
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                            >
                              <FontAwesomeIcon icon={faMinus} className="text-xs" />
                            </button>
                            <span className="text-lg font-semibold text-gray-800 px-2">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                            >
                              <FontAwesomeIcon icon={faPlus} className="text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitOrder}
            disabled={loading || !orderData.customername.trim() || selectedItems.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
