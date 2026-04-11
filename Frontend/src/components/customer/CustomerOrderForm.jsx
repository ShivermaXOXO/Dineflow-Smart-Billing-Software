import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MenuItemCard from './MenuCard';
import socket from '../../services/socket';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faUser, faHashtag, faShoppingCart, faPaperPlane, faPlus, faMinus, faTrash, faPhone } from '@fortawesome/free-solid-svg-icons';

const CustomerOrderForm = ({ hotelId }) => {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState({ customername: '', tableNumber: '', phoneNumber: '', diningType: '' });
  const [items, setItems] = useState([]);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [showAddMoreOptions, setShowAddMoreOptions] = useState(false);

  // Fetch product/menu
  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/${hotelId}`);
      setMenu(res.data);
    } catch (err) {
      console.error('Failed to load menu', err);
    }
  };

  // Add item to order
  const handleAddItem = (item) => {
    const existing = items.find(i => i.name === item.name);
    if (existing) {
      setItems(items.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1, price: item.price } : i));
    } else {
      setItems([...items, { name: item.name, quantity: 1, price: item.price }]);
    }
  };

  // Remove item from order
  const handleRemoveItem = (itemName) => {
    setItems(items.filter(item => item.name !== itemName));
  };

  // Update item quantity
  const handleUpdateQuantity = (itemName, change) => {
    setItems(items.map(item => {
      if (item.name === itemName) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // Check for existing session
  const checkExistingSession = () => {
    const table = searchParams.get('table');
    const sessionKey = `customer_session_${hotelId}_${table}`;
    const existingSession = localStorage.getItem(sessionKey);
    
    if (existingSession) {
      const session = JSON.parse(existingSession);
      setSessionData(session);
      setForm({ customername: session.customername, tableNumber: session.tableNumber, phoneNumber: session.phoneNumber || '', diningType: session.diningType || '' });
      checkActiveOrder(session.customername, session.tableNumber);
    } else if (table) {
      setForm(f => ({ ...f, tableNumber: table }));
    }
  };

  // Check if customer has active orders
  const checkActiveOrder = async (customername, tableNumber) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${hotelId}`);
      const activeOrder = res.data.find(order => 
        order.customername.toLowerCase() === customername.toLowerCase() && 
        order.tableNumber === tableNumber
      );
      setHasActiveOrder(!!activeOrder);
    } catch (err) {
      console.error('Error checking active orders:', err);
    }
  };

  // Save session data
  const saveSession = (customername, tableNumber, phoneNumber, diningType) => {
    const table = searchParams.get('table');
    const sessionKey = `customer_session_${hotelId}_${table}`;
    const sessionData = {
      customername,
      tableNumber,
      phoneNumber,
      diningType,
      hotelId,
      timestamp: Date.now()
    };
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
    setSessionData(sessionData);
  };

  // Call staff for help
  const callStaffForHelp = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/call-staff`, {
        customername: form.customername,
        tableNumber: form.tableNumber,
        hotelId,
        message: 'Customer needs help adding more items'
      });
      
      // Emit real-time notification to staff
      socket.emit('staffHelpRequested', {
        customername: form.customername,
        tableNumber: form.tableNumber,
        hotelId,
        message: `Table ${form.tableNumber} - ${form.customername} needs help adding more items`
      });

      alert('✅ Staff has been notified! They will come to your table shortly.');
      setShowAddMoreOptions(false);
    } catch (err) {
      console.error('Failed to call staff:', err);
      alert('❌ Failed to notify staff. Please try again.');
    }
  };

  // Submit order
  const handleSubmit = async () => {
    if (!form.customername || !form.tableNumber || items.length === 0) {
      return alert('Please fill all fields and add at least 1 item.');
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders`, {
        ...form,
        items,
        hotelId,
      });

      // Save session for future use
      saveSession(form.customername, form.tableNumber, form.phoneNumber, form.diningType);

      socket.emit('newCustomerOrder', res.data.order); // real-time notify staff
      setOrderSuccess(true);
      setHasActiveOrder(true);
      setItems([]);
      
      // Hide success message after 3 seconds
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err) {
      console.error('Order submission failed', err);
      alert('❌ Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit additional order
  const handleAdditionalOrder = async () => {
    if (items.length === 0) {
      return alert('Please add at least 1 item.');
    }

    setIsLoading(true);
    try {
      // Find existing order and update it
      const ordersRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${hotelId}`);
      const existingOrder = ordersRes.data.find(order => 
        order.customername.toLowerCase() === form.customername.toLowerCase() && 
        order.tableNumber == form.tableNumber
      );

      if (existingOrder) {
        // Merge items with existing order
        const updatedItems = [...existingOrder.items];
        items.forEach(newItem => {
          const existing = updatedItems.find(i => i.name === newItem.name);
          if (existing) {
            existing.quantity += newItem.quantity;
          } else {
            updatedItems.push(newItem);
          }
        });

        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${existingOrder.id}`, {
          items: updatedItems
        });

        socket.emit('customerOrderUpdated', { ...existingOrder, items: updatedItems });
      }

      setOrderSuccess(true);
      setItems([]);
      setShowAddMoreOptions(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err) {
      console.error('Additional order submission failed', err);
      alert('❌ Failed to add items to order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    checkExistingSession();
    socket.connect();
    socket.emit('joinHotelRoom', hotelId);

    return () => socket.disconnect();
  }, [hotelId]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl p-8 border border-gray-100">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mb-4">
          <FontAwesomeIcon icon={faUtensils} className="text-white text-2xl" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {hasActiveOrder ? 'Add More Items' : 'Place Your Order'}
        </h2>
        <p className="text-gray-600">
          {hasActiveOrder ? 'Continue adding to your existing order' : 'Delicious food, just a click away!'}
        </p>
        {sessionData && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
            <span className="text-blue-800 font-medium">
              Welcome back, {sessionData.customername}! | Table {sessionData.tableNumber}
            </span>
          </div>
        )}
      </div>

      {/* Success Message */}
      {orderSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 text-center">
          <span className="font-semibold">✅ Order placed successfully!</span>
          <p className="text-sm mt-1">Our staff will prepare your order shortly.</p>
        </div>
      )}

      {/* Customer Details Form - Only show if no session */}
      {!sessionData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-orange-500" />
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={form.customername}
              onChange={(e) => setForm({ ...form, customername: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 outline-none"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FontAwesomeIcon icon={faHashtag} className="mr-2 text-orange-500" />
              Table Number
            </label>
            <input
              type="number"
              placeholder="Auto-filled from QR scan"
              value={form.tableNumber}
              onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 outline-none"
              readOnly={!!searchParams.get('table')}
            />
            {searchParams.get('table') && (
              <p className="text-xs text-green-600 mt-1">✅ Table number auto-detected from QR scan</p>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FontAwesomeIcon icon={faPhone} className="mr-2 text-orange-500" />
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Optional - for billing purposes</p>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FontAwesomeIcon icon={faUtensils} className="mr-2 text-orange-500" />
              Dining Type
            </label>
            <select
              value={form.diningType}
              onChange={(e) => setForm({ ...form, diningType: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 outline-none appearance-none bg-white"
            >
              <option value="">Select dining type</option>
              <option value="dine-in">🍽️ Dine-In</option>
              <option value="takeaway">🥡 Takeaway</option>
            </select>
          </div>
        </div>
      )}

      {/* Menu Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faUtensils} className="mr-2 text-orange-500" />
          Our Menu
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
          {menu.map(item => (
            <MenuItemCard key={item.id} item={item} onAdd={handleAddItem} />
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-orange-500" />
          Your Order Summary
        </h3>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-lg border">
                <div className="flex-1">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  {item.price && (
                    <span className="text-gray-500 text-sm ml-2">₹{item.price}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.name, -1)}
                      className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-xs" />
                    </button>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold min-w-[60px] text-center">
                      × {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.name, 1)}
                      className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    </button>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveItem(item.name)}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Remove item"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </div>
            ))}
            {/* Total Price */}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">
                  ₹{items.reduce((total, item) => total + (item.price * item.quantity), 0)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faShoppingCart} className="text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">No items added yet. Browse our menu above!</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {!hasActiveOrder ? (
        <button
          onClick={handleSubmit}
          disabled={isLoading || !form.customername || !form.tableNumber || items.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Placing Order...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
              Place Order ({items.length} items)
            </div>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          {!showAddMoreOptions ? (
            <div className="flex gap-4">
              <button
                onClick={handleAdditionalOrder}
                disabled={isLoading || items.length === 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding Items...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add to Order ({items.length} items)
                  </div>
                )}
              </button>
              <button
                onClick={() => setShowAddMoreOptions(true)}
                className="bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:bg-blue-600 transition-all duration-200"
              >
                Need Help?
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-4">Need to Add More Items?</h4>
              <p className="text-blue-700 mb-4">Choose how you'd like to add more items to your order:</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddMoreOptions(false)}
                  className="flex-1 bg-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition-all duration-200"
                >
                  📱 Add from Phone
                </button>
                <button
                  onClick={callStaffForHelp}
                  className="flex-1 bg-orange-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-orange-600 transition-all duration-200"
                >
                  🙋‍♂️ Call Staff to Help
                </button>
              </div>
              <button
                onClick={() => setShowAddMoreOptions(false)}
                className="w-full mt-3 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerOrderForm;
