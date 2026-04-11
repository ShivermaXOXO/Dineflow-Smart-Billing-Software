import React, { useState, useEffect } from 'react';
import socket from '../../services/socket';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faClock, 
  faCheckCircle, 
  faUtensils, 
  faTruck, 
  faSpinner,
  faTimesCircle,
  faCookieBite,
  faMotorcycle,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

const CustomerLiveOrder = ({ hotelId }) => {
  const [customername, setcustomername] = useState('');
  const [order, setOrder] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Order timeline stages
  const orderStages = [
    { 
      key: 'pending', 
      label: 'Order Received', 
      icon: faCheckCircle, 
      color: 'green',
      description: 'Your order has been received and confirmed' 
    },
    { 
      key: 'delivered', 
      label: 'Delivered', 
      icon: faCheck, 
      color: 'green',
      description: 'Your food has been delivered to your table' 
    },
    { 
      key: 'payment', 
      label: 'Payment', 
      icon: faClock, 
      color: 'blue',
      description: 'Select your payment method to complete' 
    }
  ];

  const getCurrentStage = (order) => {
    if (!order) return 0;
    
    // Map backend status to timeline stages
    switch (order.status) {
      case 'payment':
      case 'completed': return 2;
      case 'delivered': return 1;
      case 'confirmed':
      case 'pending':
      default: return 0; // order received
    }
  };

  const getStageColor = (stage, currentStage, index) => {
    if (index <= currentStage) {
      switch (stage.color) {
        case 'green': return 'text-green-500 bg-green-100';
        case 'yellow': return 'text-yellow-500 bg-yellow-100';
        case 'blue': return 'text-blue-500 bg-blue-100';
        default: return 'text-gray-500 bg-gray-100';
      }
    }
    return 'text-gray-300 bg-gray-100';
  };

  const fetchCustomerOrder = async () => {
    if (!customername.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${hotelId}`);
      const found = res.data.find(o => o.customername.toLowerCase() === customername.toLowerCase());
      if (found) {
        setOrder(found);
        setStatusMsg('Order found successfully!');
      } else {
        alert('No active order found with that name. Please check your spelling or place a new order.');
      }
    } catch (err) {
      console.error('Failed to fetch order', err);
      alert('Failed to fetch order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete payment process
  const completePayment = async () => {
    if (!order) return;
    
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${order.id}/status`, {
        status: 'completed'
      });
      
      setOrder(prev => ({ ...prev, status: 'completed' }));
      setStatusMsg('✅ Payment completed! Thank you for dining with us.');
      
      // Emit real-time update
      socket.emit('orderStatusUpdated', { ...order, status: 'completed' });
      
    } catch (err) {
      console.error('Failed to complete payment:', err);
      alert('❌ Failed to update payment status. Please try again.');
    }
  };

  // Auto-load order if customer session exists
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const table = urlParams.get('table');
    if (table) {
      const sessionKey = `customer_session_${hotelId}_${table}`;
      const existingSession = localStorage.getItem(sessionKey);
      
      if (existingSession) {
        const session = JSON.parse(existingSession);
        setcustomername(session.customername);
        // Auto-fetch order
        setTimeout(() => {
          const res = axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${hotelId}`)
            .then(res => {
              const found = res.data.find(o => 
                o.customername.toLowerCase() === session.customername.toLowerCase() &&
                o.tableNumber == session.tableNumber
              );
              if (found) {
                setOrder(found);
                setStatusMsg('Welcome back! Here\'s your order status.');
              }
            })
            .catch(err => console.error('Auto-fetch failed:', err));
        }, 1000);
      }
    }
  }, [hotelId]);

  useEffect(() => {
    socket.connect();
    socket.emit('joinHotelRoom', hotelId);

    socket.on('orderUpdated', (updated) => {
      if (order && updated.id === order.id) {
        setOrder(updated);
        setStatusMsg('🛠️ Staff updated your order');
      }
    });

    socket.on('orderStatusUpdated', (updated) => {
      console.log('Order status updated:', updated); // Debug log
      if (order && updated.id === order.id) {
        setOrder(updated);
        const statusDisplay = updated.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        setStatusMsg(`📋 Order status updated to: ${statusDisplay}`);
      }
    });

    socket.on('orderFinalized', (finalized) => {
      if (order && finalized.id === order.id) {
        setOrder(finalized);
        setStatusMsg('✅ Order completed and ready for payment');
      }
    });

    return () => socket.disconnect();
  }, [hotelId, order]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl p-8 border border-gray-100 mt-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mb-4">
          <FontAwesomeIcon icon={faTruck} className="text-white text-2xl" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Track Your Order</h2>
        <p className="text-gray-600">Stay updated with real-time order status</p>
      </div>

      {!order && (
        <div className="max-w-md mx-auto">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Enter your name to track order"
              value={customername}
              onChange={(e) => setcustomername(e.target.value)}
              className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && fetchCustomerOrder()}
            />
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
          </div>
          <button
            onClick={fetchCustomerOrder}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Searching...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                Track My Order
              </div>
            )}
          </button>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Order Timeline */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">Order Timeline</h3>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {orderStages.map((stage, index) => {
                const currentStage = getCurrentStage(order);
                const isCompleted = index <= currentStage;
                const isActive = index === currentStage;
                
                return (
                  <div key={stage.key} className="relative flex items-center mb-6 last:mb-0">
                    {/* Timeline Dot */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStageColor(stage, currentStage, index)} ${isActive ? 'ring-4 ring-blue-200 animate-pulse' : ''} z-10`}>
                      <FontAwesomeIcon 
                        icon={stage.icon} 
                        className={`text-xl ${isCompleted ? '' : 'text-gray-400'}`} 
                      />
                    </div>
                    
                    {/* Stage Content */}
                    <div className="ml-6 flex-1">
                      <h4 className={`font-semibold ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                        {stage.label}
                        {isActive && <span className="ml-2 text-blue-600 text-sm">(Current)</span>}
                        {isCompleted && index < currentStage && <span className="ml-2 text-green-600 text-sm">✓</span>}
                      </h4>
                      <p className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                        {stage.description}
                      </p>
                      {isActive && (
                        <div className="mt-2">
                          <div className="flex items-center text-blue-600 text-sm">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            In Progress...
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    {isCompleted && (
                      <div className="text-xs text-gray-500">
                        {index === 0 && new Date(order.createdat).toLocaleTimeString()}
                        {index === currentStage && index > 0 && new Date(order.updatedat).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                <p className="font-semibold text-gray-800">{order.customername}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Table Number</p>
                <p className="font-semibold text-gray-800">#{order.tableNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Status</p>
                <p className="font-semibold text-gray-800 capitalize">{order.status?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FontAwesomeIcon icon={faUtensils} className="mr-2 text-orange-500" />
              Order Details
            </h4>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  <div className="flex items-center space-x-3">
                    {item.price && (
                      <span className="text-gray-600">₹{item.price}</span>
                    )}
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                      × {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <span className="text-blue-700 font-medium">{statusMsg}</span>
            </div>
          )}

          {/* Updated by staff indicator */}
          {order.updatedByStaff && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
              <span className="text-green-700 font-medium">Staff has updated your order</span>
            </div>
          )}

          {/* Mark as Delivered Button */}
          {order.status !== 'delivered' && order.status !== 'payment' && order.status !== 'completed' && (
            <div className="text-center">
              <button
                onClick={async () => {
                  try {
                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${order.id}/status`, {
                      status: 'delivered'
                    });
                    setOrder(prev => ({ ...prev, status: 'delivered' }));
                    setStatusMsg('✅ Food delivered! Please proceed to payment.');
                  } catch (error) {
                    console.error('Failed to mark order as delivered:', error);
                    alert('Failed to mark order as delivered. Please try again.');
                  }
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-8 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Mark as Delivered
              </button>
              <p className="text-sm text-gray-600 mt-2">Click when your food has been delivered</p>
            </div>
          )}

          {/* Payment Selection */}
          {order.status === 'delivered' && (
            <div className="text-center bg-orange-50 border border-orange-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-orange-800 mb-4">Choose Payment Method</h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={async () => {
                    try {
                      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${order.id}/status`, {
                        status: 'payment'
                      });
                      setOrder(prev => ({ ...prev, status: 'payment', paymentMethod: 'cash' }));
                      setStatusMsg('💰 Cash payment selected. Please pay at the counter.');
                    } catch (error) {
                      console.error('Failed to update payment method:', error);
                      alert('Failed to update payment method. Please try again.');
                    }
                  }}
                  className="bg-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition-all duration-200"
                >
                  💰 Cash Payment
                </button>
                <button
                  onClick={async () => {
                    try {
                      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/customer-orders/${order.id}/status`, {
                        status: 'payment'
                      });
                      setOrder(prev => ({ ...prev, status: 'payment', paymentMethod: 'online' }));
                      setStatusMsg('📱 Online payment selected. Please scan QR code to pay.');
                    } catch (error) {
                      console.error('Failed to update payment method:', error);
                      alert('Failed to update payment method. Please try again.');
                    }
                  }}
                  className="bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 transition-all duration-200"
                >
                  📱 Online Payment
                </button>
              </div>
            </div>
          )}

          {/* Payment Status */}
          {order.status === 'payment' && (
            <div className="text-center bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Payment Pending</h4>
              <p className="text-blue-700 mb-4">
                {order.paymentMethod === 'cash' 
                  ? 'Please pay at the counter with cash'
                  : order.paymentMethod === 'upi'
                  ? 'Please complete your UPI payment'
                  : order.paymentMethod === 'creditCard'
                  ? 'Please complete your card payment'
                  : order.paymentMethod === 'online'
                  ? 'Please complete your online payment'
                  : 'Please complete your payment at the counter'
                }
              </p>
              <button
                onClick={completePayment}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                ✅ Mark as Paid
              </button>
            </div>
          )}

          {/* Payment Completed Status */}
          {order.status === 'completed' && (
            <div className="text-center bg-green-50 border border-green-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-800 mb-2">Payment Completed!</h4>
              <p className="text-green-700">
                Thank you for dining with us! Your order has been completed.
              </p>
            </div>
          )}

          {/* Reset button */}
          <div className="text-center pt-4">
            <button
              onClick={() => {
                setOrder(null);
                setcustomername('');
                setStatusMsg('');
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors underline"
            >
              Track a different order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLiveOrder;
