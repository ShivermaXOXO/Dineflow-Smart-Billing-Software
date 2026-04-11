import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../services/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, 
  faUser, 
  faTable, 
  faUtensils, 
  faPlus,
  faSave,
  faTimes,
  faClock,
  faEdit,
  faBell,
  faExclamationTriangle,
  faMinus,
  faTrash,
  faReceipt,
  faCreditCard,
  faMoneyBill,
  faCheck // Add this
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from "../context/authContext";

const StaffCustomerOrders = ({ hotelId, staffId }) => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const { auth } = useAuth();
  const hotelId = auth?.hotelId;
  // ✅ CORRECT API ENDPOINT for orders
  const fetchOrders = async () => {
    try {
      console.log('📥 Fetching orders for hotel:', hotelId);
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/orders/hotel/${hotelId}`, {
        params: { staffId: staffId } // Filter by staff
      });
      console.log('✅ Orders fetched:', res.data.length);
      setOrders(res.data);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    }
  };

  console.log("🔥 fetchMenu called")

  const fetchMenu = async () => {
    console.log("🔥 fetchMenu called, hotelId =", hotelId);

    if (!hotelId) {
      console.log("❌ hotelId missing, skip fetchMenu");
      return;
    }

    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/product/${hotelId}`
    );

    console.log("✅ products fetched:", res.data);
    setMenu(res.data);
  };


  // ✅ CORRECT UPDATE STATUS FUNCTION
  const updateOrderStatus = async (orderId, status, assignedStaffId = null) => {
    console.log('🚀 Updating order status:', { orderId, status, staffId: assignedStaffId });
    
    try {
      const updateData = {
        status: status
      };
      
      if (assignedStaffId) {
        updateData.staffId = assignedStaffId;
      }
      
      console.log('📤 Sending to:', `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/status`);
      
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/status`, 
        updateData
      );
      
      console.log('✅ Status update response:', response.data);
      
      // Refresh orders
      fetchOrders();
      
      // Emit socket event
      socket.emit('orderStatusChanged', { 
        orderId, 
        status, 
        staffId: assignedStaffId,
        hotelId 
      });
      
      alert(`✅ Order status updated to ${status}`);
      
    } catch (error) {
      console.error('❌ Error updating order status:', error.response?.data || error.message);
      alert('❌ Failed to update order status');
    }
  };

  // ✅ FIXED: Create bill and complete order
  const createBill = async (order) => {
    try {
      console.log('🧾 Creating bill for order:', order.id);
      
      // Calculate total
      const total = order.items.reduce((sum, item) => {
        const itemPrice = item.price || item.Product?.price || 0;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      const billData = {
        customername: order.customername,
        phoneNumber: order.phoneNumber || '0000000000',
        items: order.items.map(item => ({
          name: item.name || item.Product?.name,
          price: item.price || item.Product?.price,
          quantity: item.quantity,
          productId: item.productId || item.Product?.id
        })),
        total: total,
        paymentType: paymentMethod,
        staffId: staffId,
        hotelId: hotelId,
        orderId: order.id, // Link to original order
        orderNumber: order.orderNumber
      };

      console.log('📤 Bill data:', billData);
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/create`, 
        billData
      );
      
      console.log('✅ Bill creation response:', response.data);
      
      if (response.data) {
        // ✅ CORRECT: Mark order as COMPLETED (not 'payment')
        await updateOrderStatus(order.id, 'completed', staffId);
        
        setShowBillModal(false);
        setSelectedOrderForBill(null);
        alert('✅ Bill created successfully! Order completed.');
        
        // Refresh orders
        fetchOrders();
      }
    } catch (err) {
      console.error('❌ Failed to create bill:', err.response?.data || err.message);
      alert('❌ Failed to create bill. Please try again.');
    }
  };

  // ✅ CORRECT: Open bill modal for READY orders
  const openBillModal = (order) => {
    console.log('💰 Opening bill modal for order:', order);
    setSelectedOrderForBill(order);
    setShowBillModal(true);
  };

  const handleAddItem = (item) => {
    if (!selected) return;
    
    const existing = selected.items.find(i => 
      i.name === item.name || i.productId === item.id
    );
    
    if (existing) {
      selected.items = selected.items.map(i =>
        (i.name === item.name || i.productId === item.id) 
          ? { ...i, quantity: i.quantity + 1 } 
          : i
      );
    } else {
      selected.items.push({ 
        name: item.name, 
        quantity: 1, 
        price: item.price,
        productId: item.id
      });
    }
    setSelected({ ...selected });
  };

  // ✅ NEW: Handle "Take Order & Bill" for READY orders
  const handleTakeOrderBill = async (order) => {
    console.log('🎯 Take Order & Bill clicked for order:', order.id);
    
    try {
      // First update status to "completed" via staff
      await updateOrderStatus(order.id, 'completed', staffId);
      
      // Then open bill modal
      openBillModal(order);
      
    } catch (error) {
      console.error('❌ Error in take order:', error);
    }
  };

  // ✅ NEW: Get proper status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return 'PENDING';
      case 'in_progress': return 'IN PROGRESS';
      case 'ready': return 'READY FOR BILLING';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return status.toUpperCase();
    }
  };

  // ✅ NEW: Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  useEffect(() => {
    if (!auth?.hotelId) {
      console.log("waiting for hotelid");
      return;

    }
    fetchOrders();
    fetchMenu();
    socket.connect();
    socket.emit('joinHotelRoom', auth.hotelId);

    // ✅ CORRECT Socket listeners for ORDERS (not customer-orders)
    socket.on('newOrder', (order) => {
      console.log('📬 New order received via socket:', order);
      if (order.hotelId == hotelId) {
        fetchOrders();
      }
    });

    socket.on('orderStatusChanged', (data) => {
      console.log('🔄 Order status changed via socket:', data);
      if (data.hotelId == hotelId) {
        fetchOrders();
      }
    });

    socket.on('orderUpdated', (order) => {
      console.log('✏️ Order updated via socket:', order);
      if (order.hotelId == hotelId) {
        fetchOrders();
      }
    });

    // Help requests (keep as is)
    socket.on('staffHelpRequested', (helpRequest) => {
      setHelpRequests(prev => [...prev, helpRequest]);
      if (Notification.permission === 'granted') {
        new Notification(`Table ${helpRequest.tableNumber} needs help`, {
          body: `${helpRequest.customername} needs assistance`,
          icon: '/logo.png'
        });
      }
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('newOrder');
      socket.off('orderStatusChanged');
      socket.off('orderUpdated');
      socket.off('staffHelpRequested');
      socket.disconnect();
    };
  }, [auth.hotelId]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl p-8 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-4">
          <FontAwesomeIcon icon={faClipboardList} className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Live Orders</h2>
          <p className="text-gray-600">Manage customer orders in real-time</p>
          <p className="text-sm text-gray-500 mt-1">Staff ID: {staffId}</p>
        </div>
      </div>

      {/* Help Requests Alert */}
      {helpRequests.length > 0 && (
        <div className="mb-6 space-y-3">
          {helpRequests.map((request, index) => (
            <div key={index} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faBell} className="text-red-500 mr-3 animate-pulse" />
                  <div>
                    <h4 className="font-semibold text-red-800">
                      🚨 Help Request
                    </h4>
                    <p className="text-red-700">
                      {request.message || 'Customer needs assistance'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHelpRequests(prev => prev.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700 ml-4"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faClipboardList} className="text-6xl text-gray-300 mb-4" />
          <p className="text-xl text-gray-500 mb-2">No active orders</p>
          <p className="text-gray-400">New orders will appear here automatically</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelected(order)}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mr-4">
                    <FontAwesomeIcon icon={faUser} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {order.customername}
                    </h3>
                    <div className="flex items-center text-gray-600">
                      <FontAwesomeIcon icon={faTable} className="mr-2" />
                      Table {order.tableNumber || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Order: #{order.orderNumber}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    {new Date(order.createdAt || order.createdat).toLocaleTimeString()}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusDisplay(order.status)}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FontAwesomeIcon icon={faUtensils} className="mr-2" />
                  Order Items
                </h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {order.items && order.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {item.name || item.Product?.name} × {item.quantity}
                    </span>
                  ))}
                </div>

                {/* ✅ CORRECT Order Status Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {/* For staff: Complete pending orders */}
                    {order.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, 'in_progress', staffId);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors flex items-center"
                      >
                        <FontAwesomeIcon icon={faCheck} className="mr-1" />
                        Mark as Completed
                      </button>
                    )}
                    
                    {/* For ready orders: Take Order & Bill */}
                    {order.status === 'in_progress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTakeOrderBill(order);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs transition-colors flex items-center"
                      >
                        <FontAwesomeIcon icon={faReceipt} className="mr-1" />
                        Take Order & Bill
                      </button>
                    )}
                    
                    {order.status === 'completed' && (
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-xs font-medium">
                        ✅ Billed & Completed
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(order);
                      }}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Order Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Update Order</h3>
                <p className="text-gray-600">
                  Customer: {selected.customername} | Table: {selected.tableNumber}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            {/* Current Order Items */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Current Order Items</h4>
              <div className="space-y-2">
                {selected.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      {item.price && (
                        <span className="text-gray-500 text-sm ml-2">₹{item.price}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Quantity Controls */}
                      <button
                        onClick={() => handleUpdateQuantity(item.name, -1)}
                        className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                      >
                        <FontAwesomeIcon icon={faMinus} className="text-xs" />
                      </button>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold min-w-[50px] text-center">
                        × {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.name, 1)}
                        className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlus} className="text-xs" />
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleRemoveItem(item.name)}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors ml-2"
                        title="Remove item"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">
                      ₹{selected.items.reduce((total, item) => total + ((item.price || 0) * item.quantity), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Items Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Add More Items</h4>
              <div className="space-y-1 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
                {menu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="w-full flex flex-row items-center justify-between bg-white border-2 border-gray-200 p-4 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 min-h-[70px]"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{item.name}</div>
                      <div className="text-sm text-gray-600 flex-shrink-0">₹{item.price}</div>
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                      <FontAwesomeIcon icon={faPlus} className="text-white text-sm" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={saveUpdate}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Save Update
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-600 transition-all duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {showBillModal && selectedOrderForBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mb-4">
                <FontAwesomeIcon icon={faReceipt} className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Generate Bill</h2>
              <p className="text-gray-600">Create bill for {selectedOrderForBill.customername}'s order</p>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{selectedOrderForBill.customername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-medium">#{selectedOrderForBill.tableNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{new Date(selectedOrderForBill.createdat).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {selectedOrderForBill.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 text-sm ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              {/* Total */}
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">
                    ₹{selectedOrderForBill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    paymentMethod === 'cash' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faMoneyBill} className="text-xl mb-1" />
                  <div className="text-sm font-medium">Cash</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    paymentMethod === 'upi' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faCreditCard} className="text-xl mb-1" />
                  <div className="text-sm font-medium">UPI</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('creditCard')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    paymentMethod === 'creditCard' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={faCreditCard} className="text-xl mb-1" />
                  <div className="text-sm font-medium">Card</div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => createBill(selectedOrderForBill)}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                <FontAwesomeIcon icon={faReceipt} className="mr-2" />
                Generate Bill & Complete
              </button>
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setSelectedOrderForBill(null);
                  setPaymentMethod('cash');
                }}
                className="flex-1 bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-600 transition-all duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffCustomerOrders;
