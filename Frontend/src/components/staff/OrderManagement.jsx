import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../../services/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons'; 
import { 
  faPlus, 
  faCheck, 
  faClock, 
  faUser, 
  faPhone, 
  faUtensils,
  faMoneyBillWave,
  faEye,
  faTimes,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const OrderManagement = ({ hotelId, staffId, onLoadOrderToBill, onNewOrderClick, onUpdateOrder, onDeleteOrder, isAdmin = false }) => {
  // Debug mode check - only log in development
  const isDebugMode = import.meta.env.DEV;
  const debugLog = (...args) => {
    if (isDebugMode) {
      console.log(...args);
    }
  };

  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]); // Separate state for completed orders
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // pending, completed
  const [loading, setLoading] = useState(false);
  const [loadingCompleted, setLoadingCompleted] = useState(false); // Separate loading for completed
  const [initialized, setInitialized] = useState(false);

  // Helper function to check if an order is within last 24 hours
  const isWithin24Hours = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    return orderTime >= twentyFourHoursAgo;
  };

  // Helper function to check if an order is from today
  const isFromToday = (orderDate) => {
    const orderTime = new Date(orderDate);
    const today = new Date();
    
    return orderTime.getDate() === today.getDate() &&
           orderTime.getMonth() === today.getMonth() &&
           orderTime.getFullYear() === today.getFullYear();
  };

  // Fetch pending orders - ALWAYS filter by staffId for non-admin users
  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      let url = `${import.meta.env.VITE_BACKEND_URL}/api/orders/hotel/${hotelId}`;
      
      console.log('🔍 OrderManagement Debug:', {
        hotelId,
        staffId,
        isAdmin,
        url
      });
      
      const response = await axios.get(url);
      console.log('📦 Raw API Response - All orders:', response.data);
      console.log('📦 Total orders from API:', response.data?.length || 0);
      
      // Filter orders for staff (non-admin) AND filter by 24 hours
      let filteredData = response.data;
      
      // First filter by 24 hours for pending orders
      filteredData = filteredData.filter(order => 
        order.createdat && isWithin24Hours(order.createdat)
      );
      console.log('⏰ Orders within 24 hours:', filteredData.length);
      
      // Then filter by staff for non-admin users
      if (staffId && !isAdmin) {
        console.log('👤 Filtering for staff ID:', staffId);
        console.log('👤 Staff ID type:', typeof staffId);
        
        filteredData = filteredData.filter(order => {
          console.log('🔍 Checking order:', {
            orderId: order.id,
            orderStaffId: order.staffId,
            orderStaffIdType: typeof order.staffId,
            matches: String(order.staffId) === String(staffId)
          });
          return String(order.staffId) === String(staffId);
        });
        
        console.log('✅ Filtered orders count (staff + 24hrs):', filteredData.length);
        console.log('✅ Filtered orders:', filteredData);
      }
      
      setOrders(filteredData);
      setInitialized(true);
    } catch (error) {
      console.error('❌ Error fetching pending orders:', error);
      toast.error('Failed to fetch pending orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch completed/billed orders - ON PAGE LOAD using query parameters
  const fetchCompletedOrders = async () => {
    try {
      setLoadingCompleted(true);
      
      // Use query parameters to filter completed orders from today
      let url = `${import.meta.env.VITE_BACKEND_URL}/api/orders/hotel/${hotelId}`;
      
      // Add query parameters
      const params = new URLSearchParams({
        status: 'completed'
      });
      
      // For non-admin staff, filter by their staffId
      if (staffId && !isAdmin) {
        params.append('staffId', staffId);
      }
      
      url += `?${params.toString()}`;
      
      console.log('🔄 Fetching completed orders from:', url);
      
      const response = await axios.get(url);
      const allCompletedOrders = response.data || [];
      
      // Filter today's orders on frontend (since backend doesn't have today filter)
      const todayCompletedOrders = allCompletedOrders.filter(order => 
        order.createdat && isFromToday(order.createdat)
      );
      
      console.log('📊 Total completed orders:', allCompletedOrders.length);
      console.log('✅ Today\'s completed orders:', todayCompletedOrders.length);
      
      setCompletedOrders(todayCompletedOrders);
    } catch (error) {
      console.error('❌ Error fetching completed orders:', error);
      
      // Fallback: Filter completed orders from existing orders array
      const today = new Date();
      const fallbackCompleted = orders.filter(order => {
        if (order.status !== 'completed') return false;
        if (!order.createdat) return false;
        return isFromToday(order.createdat);
      });
      
      console.log('🔄 Using fallback for completed orders:', fallbackCompleted.length);
      setCompletedOrders(fallbackCompleted);
      
      toast.error('Failed to fetch completed orders');
    } finally {
      setLoadingCompleted(false);
    }
  };

  // Combined fetch for both pending and completed orders
  const fetchAllOrders = async () => {
    await Promise.all([
      fetchPendingOrders(),
      fetchCompletedOrders()
    ]);
  };

  // Update order status
  const updateOrderStatus = async (orderId, status, assignedStaffId = null) => {
    console.log('OrderManagement: updateOrderStatus called with:', { orderId, status, assignedStaffId });
    try {
      setLoading(true);
      const updateData = {
        status: status
      };
      
      // Only assign staffId if provided (for staff completion)
      if (assignedStaffId) {
        updateData.staffId = assignedStaffId;
      }
      
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/status`, updateData);

      // Refresh both pending and completed orders
      fetchAllOrders();
      
      // Emit socket event for real-time updates
      socket.emit('orderStatusChanged', { 
        orderId, 
        status, 
        staffId: assignedStaffId,
        hotelId 
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  // Load order to billing system (Admin only) - WITHOUT changing status
  const loadOrderToBill = async (order) => {
    try {
      console.log('OrderManagement: loadOrderToBill called with order:', order);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${order.id}`);
      const orderData = response.data;
      console.log('OrderManagement: Fetched order data:', orderData);
      
      // DON'T update status here - just pass to billing
      // Status will be updated in createBill controller
      
      // Convert order items to bill format
      const billItems = orderData.items.map(item => {
        console.log('OrderManagement: Processing item:', item);
        
        // Handle different data structures
        let productId, productName, productPrice, productDescription, productImage;
        
        if (item.Product) {
          // Nested Product structure
          productId = item.Product.id;
          productName = item.Product.name;
          productPrice = parseFloat(item.Product.price);
          productDescription = item.Product.description;
          productImage = item.Product.image;
        } else {
          // Direct structure (more common)
          productId = item.productId || item.id;
          productName = item.name || item.productName;
          productPrice = parseFloat(item.price);
          productDescription = item.description;
          productImage = item.image;
        }
        
        const convertedItem = {
          id: productId,
          name: productName,
          price: productPrice,
          quantity: item.quantity,
          description: productDescription,
          image: productImage
        };
        
        console.log('OrderManagement: Converted item:', convertedItem);
        return convertedItem;
      });

      console.log('OrderManagement: Converted bill items:', billItems);

      // Pass to parent component for billing
      const billData = {
        items: billItems,
        customername: orderData.customername,
        phoneNumber: orderData.phoneNumber,
        tableNumber: orderData.tableNumber,
        diningType: orderData.diningType,
        totalAmount: orderData.totalAmount,
        orderId: orderData.id,  // Pass orderId to billing
        orderNumber: orderData.orderNumber
      };
      
      console.log('OrderManagement: Calling onLoadOrderToBill with:', billData);
      
      if (onLoadOrderToBill) {
        onLoadOrderToBill(billData);
      }
      
      // Refresh all orders to show updated list
      fetchAllOrders();
    } catch (error) {
      console.error('Error loading order to bill:', error);
      toast.error('Failed to load order to billing');
    }
  };

  // Complete order without billing (for staff) - mark as in_progress instead of completed
  const completeOrder = async (order) => {
    try {
      // Staff marks order as "in_progress" instead of "completed"
      // This keeps it visible in admin's pending list but moves it to staff's completed list
      await updateOrderStatus(order.id, 'in_progress', staffId);
      toast.success('Order marked as completed');
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order');
    }
  };

  // Get orders based on active tab
  const getDisplayOrders = () => {
    if (activeTab === 'pending') {
      return orders.filter(order => {
        // First, check if order is within 24 hours
        if (!isWithin24Hours(order.createdat)) {
          return false;
        }
        
        // For staff (non-admin), always filter by staffId first
        if (!isAdmin && staffId) {
          const staffIdMatch = String(order.staffId) === String(staffId);
          if (!staffIdMatch) return false;
        }
        
        // Then apply status filter for pending tab
        if (isAdmin) {
          // Admin sees pending AND in_progress orders (staff completed but not billed)
          return order.status === 'pending' || order.status === 'in_progress';
        } else {
          // Staff sees only pending orders
          return order.status === 'pending';
        }
      });
    } else {
      // For completed tab, use the pre-fetched completedOrders
      return completedOrders;
    }
  };

  const displayOrders = getDisplayOrders();

  debugLog('Total pending orders:', orders.length);
  debugLog('Total completed orders:', completedOrders.length);
  if (Math.random() < 0.1) { // Only log occasionally to reduce noise
    debugLog('Display orders for', activeTab, ':', displayOrders.length);
    debugLog('Current staffId:', staffId);
    debugLog('Is Admin:', isAdmin);
  }

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for new orders
      socket.on('newOrder', (order) => {
        if (order.hotelId === hotelId) {
          // For staff, only refresh if the order belongs to them AND is within 24 hours
          if (isAdmin || (staffId && String(order.staffId) === String(staffId))) {
            if (order.createdat && isWithin24Hours(order.createdat)) {
              debugLog('Received newOrder event for current staff - refreshing orders');
              fetchAllOrders();
              if (order.status === 'pending') {
                toast.info('New order received!');
              }
            }
          }
        }
      });

      // Listen for order status changes
      socket.on('orderStatusChanged', (data) => {
        debugLog('Received orderStatusChanged event - refreshing orders', data);
        if (data.hotelId === hotelId) {
          // For staff, only refresh if the order belongs to them or they are involved
          if (isAdmin || (staffId && String(data.staffId) === String(staffId))) {
            debugLog('Order status changed for current staff - fetching orders');
            fetchAllOrders();
          }
        }
      });

      // Listen for order updates
      socket.on('orderUpdated', (order) => {
        debugLog('Received orderUpdated event - refreshing orders');
        console.log('OrderManagement: orderUpdated event received', order);
        if (order.hotelId === hotelId) {
          // For staff, only refresh if the order belongs to them AND is within 24 hours
          if (isAdmin || (staffId && String(order.staffId) === String(staffId))) {
            if (order.createdat && isWithin24Hours(order.createdat)) {
              debugLog('Order updated for current staff - fetching orders');
              console.log('OrderManagement: Refreshing orders due to orderUpdated event');
              fetchAllOrders();
              toast.info('Order updated!');
            }
          }
        }
      });

      // Listen for bill creation events to refresh orders
      socket.on('billCreated', (data) => {
        debugLog('OrderManagement received billCreated event - refreshing orders');
        // Refresh orders when a bill is created
        fetchAllOrders();
      });

      return () => {
        socket.off('newOrder');
        socket.off('orderStatusChanged');
        socket.off('orderUpdated');
        socket.off('billCreated');
      };
    }
  }, [hotelId, staffId, isAdmin]);

  // Initial fetch - BOTH pending and completed orders on page load
  useEffect(() => {
    fetchAllOrders();
    
    // Set up periodic refresh every 10 seconds
    const interval = setInterval(() => {
      fetchAllOrders();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [hotelId, staffId, isAdmin]);

  // Update completed orders when activeTab changes to completed
  // (This ensures data is fresh when switching tabs)
  useEffect(() => {
    if (activeTab === 'completed' && initialized) {
      fetchCompletedOrders();
    }
  }, [activeTab]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return 'PENDING';
      case 'in_progress': return 'STAFF COMPLETED';
      case 'ready': return 'READY';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return status.toUpperCase();
    }
  };

  // Helper function to format time since order was created
  const getTimeAgo = (dateString) => {
    const orderDate = new Date(dateString);
    const now = new Date();
    const diffMs = now - orderDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  // Calculate counts for tabs
  const pendingCount = orders.filter(order => {
    if (!isWithin24Hours(order.createdat)) return false;
    if (!isAdmin && staffId && String(order.staffId) !== String(staffId)) return false;
    
    if (isAdmin) {
      return order.status === 'pending' || order.status === 'in_progress';
    } else {
      return order.status === 'pending';
    }
  }).length;

  const completedCount = completedOrders.length;

  return (
    <div>
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'pending' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {isAdmin ? 'Pending Orders (Last 24h)' : 'My Pending Orders (Last 24h)'} 
          ({loading && !initialized ? '...' : pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {isAdmin ? 'Today\'s Billed Orders' : 'My Today\'s Completed Orders'} 
          ({loadingCompleted ? '...' : completedCount})
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {activeTab === 'pending' && loading ? (
          <div className="text-center py-8 text-gray-500">
            <FontAwesomeIcon icon={faSync} className="animate-spin text-2xl mb-4" />
            <p>Loading pending orders...</p>
          </div>
        ) : activeTab === 'completed' && loadingCompleted ? (
          <div className="text-center py-8 text-gray-500">
            <FontAwesomeIcon icon={faSync} className="animate-spin text-2xl mb-4" />
            <p>Loading completed orders...</p>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FontAwesomeIcon icon={faUtensils} className="text-4xl mb-4" />
            <p>
              {activeTab === 'pending' 
                ? (isAdmin ? 'No orders from the last 24 hours' : 'No orders assigned to you in the last 24 hours')
                : (isAdmin ? 'No billed orders today' : 'No completed orders today')
              }
            </p>
          </div>
        ) : (
          displayOrders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusDisplay(order.status)}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {getTimeAgo(order.createdat)}
                  </span>
                  {order.staffId && !isAdmin && (
                    <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">
                      Your Order
                    </span>
                  )}
                </div>
                <div className="flex gap-3  order-2 sm:order-none sm:justify-end">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetails(true);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                    title="View Details"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onUpdateOrder && onUpdateOrder(order)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Update Order"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this order?')) {
                            onDeleteOrder && onDeleteOrder(order.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Order"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium flex items-center">
                    <FontAwesomeIcon icon={faUser} className="mr-1 text-gray-400" />
                    {order.customername}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Dining Type</p>
                  <p className="font-medium">{order.diningType || 'Dine-In'}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-bold text-green-600 flex sm:justify-end items-center">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />
                    ₹{parseFloat(order.totalAmount).toLocaleString()}
                  </p>

                  <p className="text-sm text-gray-600 mt-2">Table Number</p>
                  <p className="font-medium">{order.tableNumber || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <FontAwesomeIcon icon={faClock} className="mr-1" />
                  {new Date(order.createdat).toLocaleString()}
                </div>
                
                <div className="flex space-x-2">
                  {isAdmin ? (
                    // Admin sees "Take Order & Bill" button for pending AND in_progress orders
                    (order.status === 'pending' || order.status === 'in_progress') && (
                      <button
                        onClick={() => loadOrderToBill(order)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />
                        Take Bill
                      </button>
                    )
                  ) : (
                    // Staff sees "Complete Order" button only for pending orders
                    order.status === 'pending' && (
                      <button
                        onClick={() => completeOrder(order)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faCheck} className="mr-1" />
                        Complete Order
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Order Details - #{selectedOrder.orderNumber}</h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Time</p>
                  <p className="font-medium">{getTimeAgo(selectedOrder.createdat)}</p>
                  <p className="text-xs text-gray-500">{new Date(selectedOrder.createdat).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium">{selectedOrder.customername}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">{selectedOrder.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dining Type</p>
                  <p className="font-medium flex items-center">
                    {selectedOrder.diningType === 'dine-in' ? '🍽️ Dine-In' : 
                     selectedOrder.diningType === 'takeaway' ? '🥡 Takeaway' : 
                     selectedOrder.diningType || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.diningType === 'takeaway' ? 'Car Number' : 'Table Number'}
                  </p>
                  <p className="font-medium">
                    {selectedOrder.diningType === 'takeaway' 
                      ? (selectedOrder.carDetails || 'Not provided')
                      : (selectedOrder.tableNumber || 'Not specified')
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusDisplay(selectedOrder.status)}
                  </span>
                </div>
                {selectedOrder.staffId && (
                  <div>
                    <p className="text-sm text-gray-600">Staff ID</p>
                    <p className="font-medium">{selectedOrder.staffId}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span>{item.quantity}x {item.name || item.Product?.name || item.productName || `Product ID: ${item.productId}`}</span>
                      <span className="font-medium">₹{(item.quantity * (item.Product?.price || item.price || 0)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{parseFloat(selectedOrder.totalAmount).toLocaleString()}</span>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-gray-800">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;