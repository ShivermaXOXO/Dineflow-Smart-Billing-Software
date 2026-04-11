// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/authContext';
import socket from '../services/socket';
import AddStaffForm from '../components/admin/AddStaffForm';
import ViewStaffOrders from '../components/admin/ViewStaffOrders';
import DailyReport from '../components/admin/DailyReport';
import InventoryManagement from '../components/admin/InventoryManagement';
import InventoryAnalytics from '../components/admin/InventoryAnalytics';
import RepeatCustomerManagement from '../components/admin/RepeatCustomerManagement';
import AdminBilling from '../components/admin/AdminBillingComplete';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faReceipt, faCog, faBox, faWarehouse, faCashRegister, faWarning } from '@fortawesome/free-solid-svg-icons';
import AddProductForm from '../components/admin/AddProduct';
import MenuList from '../components/admin/MenuList';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const { hotelId } = useParams();
  const TABLE_KEY = `tablenumber_${hotelId}`;

  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('report');
  const [todayStats, setTodayStats] = useState({ totalRevenue: 0, totalOrders: 0 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState('today'); // Add dateRange state
  const [refreshKey, setRefreshKey] = useState(0);
const [tableNumber, setTableNumber] = useState(null);
const [showTableInput, setShowTableInput] = useState(false);
const [tempTable, setTempTable] = useState("");

const handleSetTable = async (hotelId, tablenumber) => {
  if (!tablenumber || !hotelId) {
    alert("Table number or hotelId missing");
    return;
  }

  try {
    console.log("Setting table number", tablenumber);
    const res = await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/hotels/set-table`,
      {
        hotelId: Number(hotelId),
        tablenumber: Number(tablenumber),
      }
    );

    console.log("Table number set successfully", res.data);

    // ✅ Update state so UI shows the table number
    setTableNumber(res.data.tablenumber);  
    setTempTable("");       // clear input
    setShowTableInput(false); // hide input box

  } catch (err) {
    console.log("Error setting table number", err);
    alert("Failed to save table number");
  }
};



  // State for logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch today's stats
  const fetchTodayStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bill/report/${hotelId}?range=day`);
      const todayData = response.data[0] || { totalRevenue: 0, totalOrders: 0 };
      setTodayStats(todayData);
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      navigate('/');
    } else {
      fetchTodayStats();
      
      // Set up socket connection for real-time updates
      socket.connect();
      socket.emit('joinHotelRoom', hotelId);
      
      // Listen for bill creation events to refresh stats
      socket.on('billCreated', () => {
        console.log('Admin dashboard received billCreated event');
        fetchTodayStats();
        setRefreshKey(prev => prev + 1); // Trigger refresh of child components
      });
      
      // Periodic refresh every 30 seconds
      const interval = setInterval(() => {
        fetchTodayStats();
      }, 30000);
      
      return () => {
        socket.disconnect();
        clearInterval(interval);
      };
    }
  }, [hotelId, navigate]);

  // Navigation protection useEffect
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      setShowLogoutConfirm(true);
      // Push the current state back to prevent immediate navigation
      window.history.pushState(null, null, window.location.pathname);
    };

    // Add event listeners (removed beforeunload to allow auto-refresh)
    window.addEventListener('popstate', handlePopState);

    // Push initial state to enable popstate detection
    window.history.pushState(null, null, window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogoutConfirm = () => {
    // Remove event listeners before navigation
    window.removeEventListener('popstate', () => {});
    
    logout();
    navigate('/', { replace: true });
  };

  const handleStayOnDashboard = () => {
    setShowLogoutConfirm(false);
  };

  // Handle date row click from DailyReport
  const handleDateRowClick = (date) => {
    setSelectedDate(date);
    setActiveTab('staff');
  };

  // Handle date range change from DailyReport
  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Today's Stats */}
 <div className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <div className="flex items-center justify-between h-auto py-4 
                    max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-4">

      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Hotel ID: #{hotelId}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex items-center space-x-6 
                      max-[560px]:w-full max-[560px]:flex-col max-[560px]:space-x-0 max-[560px]:space-y-3 
                      max-[560px]:items-center">

<div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 
                w-full max-[560px]:w-[50%]">

  {!tableNumber ? (
    showTableInput ? (
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Table No"
          value={tempTable}
          onChange={(e) => setTempTable(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md 
                     px-2 py-1 text-sm focus:outline-none 
                     focus:ring-1 focus:ring-gray-400"
        />

     <button
  onClick={() => handleSetTable(hotelId, tempTable)} // ✅ wrap in arrow function
  className="px-3 py-1 text-sm bg-gray-800 text-white 
             rounded-md hover:bg-gray-900"
>
  OK
</button>


        <button
          onClick={() => setShowTableInput(false)}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          ✕
        </button>
      </div>
    ) : (
      <button
        onClick={() => setShowTableInput(true)}
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        + Add Table Number
      </button>
    )
  ) : (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-bold text-gray-800">
          Table {tableNumber}
        </p>
      </div>

      <button
        onClick={() => {
          setTableNumber(null);
          localStorage.removeItem(TABLE_KEY);
        }}
        className="text-xs text-blue-600 hover:underline"
      >
        Change
      </button>
    </div>
  )}
</div>


        {/* Revenue Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 
                        w-full max-[560px]:w-[50%]">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faChartLine} className="text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-medium">Today's Revenue</p>
              <p className="text-lg font-bold text-green-800">
                ₹{todayStats.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 
                        w-full max-[560px]:w-[50%]">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faReceipt} className="text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Today's Orders</p>
              <p className="text-lg font-bold text-blue-800">{todayStats.totalOrders || 0}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('report')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'report' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
            >
              <FontAwesomeIcon icon={faChartLine} className="mr-2" />
              Analytics & Reports
            </button>
            <button 
              onClick={() => setActiveTab('staff')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'staff' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className="mr-2" />
              Staff Orders
            </button>
            <button 
              onClick={() => setActiveTab('billing')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'billing' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300'
              }`}
            >
              <FontAwesomeIcon icon={faCashRegister} className="mr-2" />
              Billing
            </button>
            <button 
              onClick={() => setActiveTab('addStaff')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'addStaff' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className="mr-2" />
              Add Staff
            </button>
            <button 
              onClick={() => setActiveTab('addItem')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'addItem' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
              }`}
            >
              <FontAwesomeIcon icon={faCog} className="mr-2" />
              Add Menu Item
            </button>
            <button 
              onClick={() => setActiveTab('menu')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'menu' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-teal-600 hover:border-teal-300'
              }`}
            >
              <FontAwesomeIcon icon={faReceipt} className="mr-2" />
              Current Menu
            </button>
            <button 
              onClick={() => setActiveTab('inventory')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'inventory' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-red-600 hover:border-red-300'
              }`}
            >
              <FontAwesomeIcon icon={faBox} className="mr-2" />
              Inventory
            </button>
            <button 
              onClick={() => setActiveTab('inventoryAnalytics')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'inventoryAnalytics' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-cyan-600 hover:border-cyan-300'
              }`}
            >
              <FontAwesomeIcon icon={faWarehouse} className="mr-2" />
              Inventory Analytics
            </button>
            <button 
              onClick={() => setActiveTab('customers')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'customers' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-pink-600 hover:border-pink-300'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className="mr-2" />
              Customer Reports
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'report' && <DailyReport hotelId={hotelId} onDateRowClick={handleDateRowClick} onDateRangeChange={handleDateRangeChange} dateRange={dateRange} key={refreshKey} />}
        {activeTab === 'staff' && <ViewStaffOrders hotelId={hotelId} selectedDate={selectedDate} dateRange={dateRange} key={refreshKey} />}
        {activeTab === 'billing' && <AdminBilling hotelId={hotelId} key={refreshKey} />}
        {activeTab === 'addStaff' && <AddStaffForm hotelId={hotelId} />}
        {activeTab === 'addItem' && <AddProductForm hotelId={hotelId} />}
        {activeTab === 'menu' && <MenuList hotelId={hotelId} />}
        {activeTab === 'inventory' && <InventoryManagement hotelId={hotelId} />}
        {activeTab === 'inventoryAnalytics' && <InventoryAnalytics hotelId={hotelId} key={refreshKey} />}
        {activeTab === 'customers' && <RepeatCustomerManagement hotelId={hotelId} key={refreshKey} />}
      </div>
      
      {/* Toast Container for notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faWarning} className="text-yellow-500 text-xl mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Navigation</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You are about to leave the admin dashboard. This will log you out of your current session. 
              Are you sure you want to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleStayOnDashboard}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Stay on Dashboard
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Logout & Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
