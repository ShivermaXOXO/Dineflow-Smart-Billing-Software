import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChartLine, faShoppingCart, faUsers, faMoneyBillWave, faTrophy, faUserTie, faToggleOff, faToggleOn, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import SummaryDashboard from '../analytics/SummaryDashboard';

const DailyReport = ({ hotelId, onDateRowClick, onDateRangeChange, dateRange: externalDateRange }) => {
  const [dateRange, setDateRange] = useState(externalDateRange || 'today');
  const [revenueData, setRevenueData] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStaffRevenue, setShowStaffRevenue] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  const [revenueCurrentPage, setRevenueCurrentPage] = useState(1);
  const [itemsCurrentPage, setItemsCurrentPage] = useState(1);
  const revenueItemsPerPage = 10;
  const itemsPerPage = 10;
  
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0
  });

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last6months', label: 'Last 6 Months' }
  ];

  // Sync with external dateRange prop
  useEffect(() => {
    if (externalDateRange && externalDateRange !== dateRange) {
      setDateRange(externalDateRange);
    }
  }, [externalDateRange]);

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    }
  };

  // Function to calculate repeat customers from orders
  const calculateRepeatCustomersFromOrders = (orders) => {
    if (!orders || !Array.isArray(orders)) return 0;
    
    const customerVisits = new Map();
    
    orders.forEach(order => {
      const phone = order.phoneNumber?.toLowerCase()?.trim();
      const name = order.customername?.toLowerCase()?.trim();
      
      // Skip invalid entries (same as backend logic)
      const skipNames = ["walk in customer", "walk-in customer", "walkin customer", "na", "n/a", "none", ""];
      const skipPhones = ["na", "n/a", "none", "", null, undefined];
      
      if (skipNames.includes(name) || skipPhones.includes(phone)) {
        return;
      }
      
      if (phone) {
        customerVisits.set(phone, (customerVisits.get(phone) || 0) + 1);
      }
    });
    
    // Count customers with 2 or more visits
    return Array.from(customerVisits.values()).filter(visits => visits >= 2).length;
  };
const toLocalDateString = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      let range = 'day';
      let apiRange = 'day';
      
      switch (dateRange) {
        case 'today':
          apiRange='day';
          break;
        case 'yesterday':
          apiRange = 'yesterday';
          break;
        case 'last7days':
          apiRange = 'week';
          break;
        case 'lastMonth':
          apiRange = 'month';
          break;
        case 'last6months':
          apiRange = 'month';
          break;
        default:
          apiRange = 'day';
      }

      // Fetch revenue and orders data
      const revenueResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/report/${hotelId}?range=${apiRange}`
      );
      
      // Fetch detailed items data
      const ordersResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/orders/${hotelId}`
      );

      // Process revenue data based on date range
      let processedRevenueData = revenueResponse.data;
      
if (dateRange === 'yesterday') {
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = toLocalDateString(yesterday);

processedRevenueData = revenueResponse.data.filter(
  item => item.date === yesterdayStr
);

  console.log("Filtering for yesterday:", yesterdayStr);
  processedRevenueData = revenueResponse.data.filter(
    item => item.date === yesterdayStr
  );
}



 else if (dateRange === 'last6months') {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  processedRevenueData = revenueResponse.data.filter(item =>
    new Date(item.date) >= sixMonthsAgo
  );
}


      setRevenueData(processedRevenueData);

      // Process items data
      const filtered = filterOrdersByDateRange(ordersResponse.data);
      setFilteredOrders(filtered);
      
      const itemsAnalysis = processItemsData(filtered);
      setItemsData(itemsAnalysis);

      // Calculate repeat customers for the selected date range
      const repeatCustomersCount = calculateRepeatCustomersFromOrders(filtered);

      // Calculate total stats
      const stats = calculateTotalStats(processedRevenueData, filtered, repeatCustomersCount);
      setTotalStats(stats);

      // Fetch staff data for the toggle section
      const staffResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/staff-revenue/${hotelId}`
      );
      setStaffData(staffResponse.data);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

const filterOrdersByDateRange = (orders) => {
  const now = new Date();
  const todayStr = toLocalDateString(now);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  switch (dateRange) {
    case 'today':
      return orders.filter(
        order => toLocalDateString(order.createdat) === todayStr
      );

    case 'yesterday':
      return orders.filter(
        order => toLocalDateString(order.createdat) === yesterdayStr
      );

    case 'last7days': {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      return orders.filter(
        order => new Date(order.createdat) >= past7
      );
    }

    case 'lastMonth': {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      return orders.filter(
        order => new Date(order.createdat) >= past30
      );
    }

    case 'last6months': {
      const past180 = new Date();
      past180.setDate(past180.getDate() - 180);
      return orders.filter(
        order => new Date(order.createdat) >= past180
      );
    }

    default:
      return orders;
  }
};




  const processItemsData = (orders) => {
    const itemsMap = new Map();
    const dailyItemsMap = new Map();

    orders.forEach(order => {
      const orderDate = new Date(order.createdat).toISOString().slice(0, 10);
      let items;
      
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        return;
      }

      if (!Array.isArray(items)) return;

      items.forEach(item => {
        const key = `${item.name || 'Unknown Item'}`;
        const dailyKey = `${orderDate}-${key}`;
        
        // Overall items tracking
        if (!itemsMap.has(key)) {
          itemsMap.set(key, {
            name: key,
            totalQuantity: 0,
            totalRevenue: 0,
            avgPrice: 0
          });
        }
        
        const itemStats = itemsMap.get(key);
        itemStats.totalQuantity += item.quantity || 0;
        itemStats.totalRevenue += (item.price || 0) * (item.quantity || 0);
        itemStats.avgPrice = itemStats.totalQuantity > 0 ? itemStats.totalRevenue / itemStats.totalQuantity : 0;

        // Daily items tracking
        if (!dailyItemsMap.has(dailyKey)) {
          dailyItemsMap.set(dailyKey, {
            date: orderDate,
            name: key,
            quantity: 0,
            revenue: 0
          });
        }
        
        const dailyStats = dailyItemsMap.get(dailyKey);
        dailyStats.quantity += item.quantity || 0;
        dailyStats.revenue += (item.price || 0) * (item.quantity || 0);
      });
    });

    return {
      overall: Array.from(itemsMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity),
      daily: Array.from(dailyItemsMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  };

  const calculateTotalStats = (revenueData, orders, repeatCustomersCount) => {
    const totalRevenue = revenueData.reduce((sum, day) => sum + (day.totalRevenue || 0), 0);
    const totalOrders = revenueData.reduce((sum, day) => sum + (day.totalOrders || 0), 0);
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      totalCustomers: repeatCustomersCount,
      avgOrderValue
    };
  };

  useEffect(() => {
    if (hotelId) {
      fetchAnalyticsData();
    }
  }, [hotelId, dateRange]);

  // Reset pagination when data changes
  useEffect(() => {
    setRevenueCurrentPage(1);
    setItemsCurrentPage(1);
  }, [dateRange, revenueData, itemsData]);

  // Pagination helper functions
  const renderPagination = (currentPage, totalItems, itemsPerPage, onPageChange, sectionName) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const showPagination = totalItems > itemsPerPage;
    if (!showPagination) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          Showing {startIndex + 1} to {endIndex} of {totalItems} items
        </div>
        <div className="flex items-center space-x-2">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>

          {/* First page */}
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 rounded text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && <span className="text-gray-500">...</span>}
            </>
          )}

          {/* Page numbers */}
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentPage === number
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {number}
            </button>
          ))}

          {/* Last page */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 rounded text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const getPaginatedData = (data, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="backdrop-blur-xl bg-white/30 rounded-lg shadow-sm border border-white/40 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faChartLine} className="mr-3 text-indigo-600" />
              Analytics & Reports
            </h2>
            <p className="text-gray-600 mt-1">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white/30 backdrop-blur-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faMoneyBillWave} className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                <dd className="text-lg font-semibold text-gray-900">{formatCurrency(totalStats.totalRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faShoppingCart} className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                <dd className="text-lg font-semibold text-gray-900">{totalStats.totalOrders}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Repeat Customers (2+ visits)
                  <span className="text-xs text-gray-400 ml-1 block">
                    in selected period
                  </span>
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{totalStats.totalCustomers}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Order Value</dt>
                <dd className="text-lg font-semibold text-gray-900">{formatCurrency(totalStats.avgOrderValue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue and Orders Day-wise Table */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue & Orders Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedData(revenueData, revenueCurrentPage, revenueItemsPerPage).map((day, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                  onClick={() => onDateRowClick && onDateRowClick(day.date)}
                  title="Click to view orders for this date"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(day.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.totalOrders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(day.totalRevenue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.totalOrders > 0 ? formatCurrency(day.totalRevenue / day.totalOrders) : '₹0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderPagination(
          revenueCurrentPage, 
          revenueData.length, 
          revenueItemsPerPage, 
          setRevenueCurrentPage,
          'Revenue Summary'
        )}
      </div>

      {/* Items Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items Overall */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Items (Overall)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedData(itemsData.overall || [], itemsCurrentPage, itemsPerPage).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{item.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{item.totalQuantity}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{formatCurrency(item.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination(
            itemsCurrentPage, 
            (itemsData.overall || []).length, 
            itemsPerPage, 
            setItemsCurrentPage,
            'Top Items'
          )}
        </div>

        {/* Staff Performance Toggle */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon 
                icon={showStaffRevenue ? faTrophy : faUserTie} 
                className={`mr-2 ${showStaffRevenue ? 'text-yellow-600' : 'text-blue-600'}`} 
              />
              {showStaffRevenue ? 'Staff Revenue Leaders' : 'Customer Targets'}
            </h3>
            <button
              onClick={() => setShowStaffRevenue(!showStaffRevenue)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <FontAwesomeIcon icon={faExchangeAlt} className="w-4 h-4" />
              <span className="text-sm font-medium">
                Switch to {showStaffRevenue ? 'Customer Targets' : 'Revenue Leaders'}
              </span>
            </button>
          </div>
          
          <div className="relative overflow-hidden">
            <div 
              className={`transition-all duration-500 ease-in-out transform ${
                showStaffRevenue ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute inset-0'
              }`}
            >
              {/* Staff Revenue Section */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-l-4 border-yellow-400">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">🏆 Top Revenue Performers</h4>
                  <div className="text-xs text-yellow-700">
                    Total Revenue: ₹{staffData.reduce((acc, staff) => acc + staff.revenue, 0).toFixed(2)}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {staffData
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 8)
                    .map((staff, index) => {
                      const avgRevenue = staffData.reduce((acc, s) => acc + s.revenue, 0) / staffData.length;
                      const diff = ((staff.revenue - avgRevenue) / avgRevenue) * 100;
                      const isAbove = diff >= 0;
                      
                      return (
                        <div
                          key={staff.staffId}
                          className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                            index === 0 
                              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 shadow-sm' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${index === 0 ? 'text-yellow-800' : 'text-gray-700'}`}>
                                {index + 1}. {staff.name}
                              </span>
                              {index === 0 && <FontAwesomeIcon icon={faTrophy} className="text-yellow-600 w-4 h-4" />}
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-semibold ${index === 0 ? 'text-yellow-800' : 'text-gray-900'}`}>
                                ₹{(staff.revenue || 0).toFixed(2)}
                              </div>
                              <div className={`text-xs ${isAbove ? 'text-green-600' : 'text-red-600'}`}>
                                {isAbove ? '+' : ''}{(diff || 0).toFixed(1)}% vs avg
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            
            <div 
              className={`transition-all duration-500 ease-in-out transform ${
                !showStaffRevenue ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute inset-0'
              }`}
            >
              {/* Customer Targets Section */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-400">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">👥 Customer Engagement Leaders</h4>
                  <div className="text-xs text-blue-700">
                    Total Orders: {staffData.reduce((acc, staff) => acc + staff.orders, 0)}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {staffData
                    .sort((a, b) => b.orders - a.orders)
                    .slice(0, 8)
                    .map((staff, index) => {
                      const avgOrders = staffData.reduce((acc, s) => acc + s.orders, 0) / staffData.length;
                      const diff = ((staff.orders - avgOrders) / avgOrders) * 100;
                      const isAbove = diff >= 0;
                      
                      return (
                        <div
                          key={staff.staffId}
                          className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                            index === 0 
                              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-sm' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${index === 0 ? 'text-blue-800' : 'text-gray-700'}`}>
                                {index + 1}. {staff.name}
                              </span>
                              {index === 0 && <FontAwesomeIcon icon={faUserTie} className="text-blue-600 w-4 h-4" />}
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-semibold ${index === 0 ? 'text-blue-800' : 'text-gray-900'}`}>
                                {staff.orders} Orders
                              </div>
                              <div className={`text-xs ${isAbove ? 'text-green-600' : 'text-red-600'}`}>
                                {isAbove ? '+' : ''}{diff.toFixed(1)}% vs avg
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Additional Analytics */}
      <SummaryDashboard hotelId={hotelId} dateRange={dateRange} />
    </div>
  );
};

export default DailyReport;