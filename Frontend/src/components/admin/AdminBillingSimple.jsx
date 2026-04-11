// Complete AdminBilling component with all staff billing features
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import socket from '../../services/socket';
import ProductList from '../staff/ProductList';
import BillPanel from '../staff/BillPanel';
import PaymentModal from '../staff/PaymentModal';
import OrderManagement from '../staff/OrderManagement';
import NewOrderDialog from '../staff/NewOrderDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faReceipt, 
  faShoppingCart, 
  faMoneyBillWave, 
  faClock,
  faStore,
  faChartLine,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const AdminBilling = ({ hotelId }) => {
  const { auth } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [billItems, setBillItems] = useState([]);
  const [mobileNumber, setMobileNumber] = useState('');
  const [customername, setcustomername] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [todayStats, setTodayStats] = useState({ 
    myOrders: 0, 
    myRevenue: 0,
    currentShiftOrders: 0,
    avgOrderValue: 0
  });
  
  // Order management states
  const [showMenuSection, setShowMenuSection] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [ordercustomername, setOrdercustomername] = useState('');
  const [orderMobileNumber, setOrderMobileNumber] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // New order dialog state
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [editingOrderForDialog, setEditingOrderForDialog] = useState(null);

  const total = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/${hotelId}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  // Fetch admin stats
  const fetchAdminStats = async () => {
    try {
      const adminId = localStorage.getItem('staffId') || localStorage.getItem('userId') || '1';
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bill/admin-stats/${hotelId}/${adminId}`);
      setTodayStats(response.data || {
        myOrders: 0, 
        myRevenue: 0,
        currentShiftOrders: 0,
        avgOrderValue: 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setTodayStats({
        myOrders: 0, 
        myRevenue: 0,
        currentShiftOrders: 0,
        avgOrderValue: 0
      });
    }
  };

  useEffect(() => {
    console.log('AdminBilling mounted with hotelId:', hotelId);
    if (hotelId) {
      fetchProducts();
      fetchAdminStats();
      
      // Set up socket connection for real-time updates
      socket.connect();
      socket.emit('joinHotelRoom', hotelId);
      
      // Listen for bill creation events to refresh stats
      socket.on('billCreated', () => {
        console.log('Admin billing received billCreated event');
        fetchAdminStats();
      });
    }

    return () => {
      socket.off('billCreated');
    };
  }, [hotelId]);

  // Add item to bill
  const handleAddToBill = (product) => {
    const existingItem = billItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setBillItems(billItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setBillItems([...billItems, { ...product, quantity: 1 }]);
    }
  };

  // Remove item from bill
  const handleRemoveItem = (productId) => {
    setBillItems(billItems.filter(item => item.id !== productId));
  };

  // Update item quantity
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else {
      setBillItems(billItems.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (billItems.length === 0) {
      toast.warning('Please add items to the bill');
      return;
    }
    setShowModal(true);
  };

  // Handle payment
  const handlePayment = async () => {
    try {
      if (!paymentType) {
        toast.warning('Please select a payment method');
        return;
      }

      const billData = {
        customername: customername || 'Walk-in Customer',
        mobileNumber: mobileNumber || 'N/A',
        items: billItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: total,
        paymentType,
        hotelId: hotelId,
        staffId: localStorage.getItem('staffId') || localStorage.getItem('userId') || '1',
        staffName: localStorage.getItem('username') || 'Admin'
      };

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/bill/create`, billData);

      toast.success('Bill created successfully!');
      
      // Reset form
      setBillItems([]);
      setMobileNumber('');
      setcustomername('');
      setPaymentType('');
      setShowModal(false);
      
      // Refresh stats
      fetchAdminStats();
      setRefreshKey(prev => prev + 1);
      
      // Emit socket event for real-time updates
      socket.emit('billCreated', { hotelId, billData });
      
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    }
  };

  // Order Management Functions
  const handleNewOrder = () => {
    setEditingOrderForDialog(null);
    setShowNewOrderDialog(true);
  };

  const handleAddToOrder = (product) => {
    const existingItem = orderItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveOrderItem = (productId) => {
    setOrderItems(orderItems.filter(item => item.id !== productId));
  };

  const updateOrderItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveOrderItem(productId);
    } else {
      setOrderItems(orderItems.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const handleSaveOrder = async () => {
    try {
      if (orderItems.length === 0) {
        toast.warning('Please add items to the order');
        return;
      }

      if (!ordercustomername.trim()) {
        toast.warning('Please enter customer name');
        return;
      }

      const orderData = {
        customername: ordercustomername,
        mobileNumber: orderMobileNumber || 'N/A',
        items: orderItems.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        hotelId: hotelId,
        staffId: localStorage.getItem('staffId') || localStorage.getItem('userId') || '1',
        staffName: localStorage.getItem('username') || 'Admin',
        status: 'pending'
      };

      if (editingOrder) {
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${editingOrder.id}`, orderData);
        toast.success('Order updated successfully!');
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/orders`, orderData);
        toast.success('Order saved successfully!');
      }
      
      // Reset form
      setShowMenuSection(false);
      setOrderItems([]);
      setOrdercustomername('');
      setOrderMobileNumber('');
      setEditingOrder(null);
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    }
  };

  const loadOrderToBill = (order) => {
    setBillItems(order.items.map(item => ({
      id: item.productId,
      name: item.productName,
      price: item.price,
      quantity: item.quantity
    })));
    setcustomername(order.customername);
    setMobileNumber(order.mobileNumber !== 'N/A' ? order.mobileNumber : '');
    toast.success('Order loaded to bill successfully!');
  };

  const handleUpdateOrder = (order) => {
    setEditingOrderForDialog(order);
    setShowNewOrderDialog(true);
  };

  const handleOrderCreated = (newOrder) => {
    console.log('New order created:', newOrder);
    toast.success('Order created successfully!');
    setRefreshKey(prev => prev + 1);
    setShowNewOrderDialog(false);
    setEditingOrderForDialog(null);
  };

  const handleOrderUpdated = (updatedOrder) => {
    console.log('Order updated:', updatedOrder);
    toast.success('Order updated successfully!');
    setRefreshKey(prev => prev + 1);
    setShowNewOrderDialog(false);
    setEditingOrderForDialog(null);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}`);
      toast.success('Order deleted successfully!');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faUser} className="mr-3 text-indigo-600" />
                  Admin Billing
                </h1>
                <p className="text-sm text-gray-600">
                  Hotel ID: #{hotelId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-gray-600" />
                  Menu Selection
                </h2>
              </div>
              <div className="p-6">
                <ProductList
                  products={products}
                  search={search}
                  setSearch={setSearch}
                  handleAddToBill={handleAddToBill}
                  selectedItems={billItems}
                  updateQuantity={handleUpdateQuantity}
                  removeItem={handleRemoveItem}
                />
              </div>
            </div>
          </div>

          {/* Simple Bill Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faReceipt} className="mr-2 text-gray-600" />
                  Current Bill
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <h3>Bill Items ({billItems.length})</h3>
                  {billItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span>{item.name}</span>
                      <span>Qty: {item.quantity} | ₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  {billItems.length > 0 && (
                    <div className="border-t pt-4">
                      <strong>Total: ₹{billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Order Dialog */}
      <NewOrderDialog
        isOpen={showNewOrderDialog}
        onClose={() => {
          setShowNewOrderDialog(false);
          setEditingOrderForDialog(null);
        }}
        
        hotelId={hotelId}
        onOrderCreated={handleOrderCreated}
        editingOrder={editingOrderForDialog}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};

export default AdminBilling;
