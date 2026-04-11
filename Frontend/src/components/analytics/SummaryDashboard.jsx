import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Spinner } from 'reactstrap';

import PaymentMethodChart from './PaymentMethodChart';
import TopProductsChart from './TopProductsChart';
import StaffRevenueChart from './StaffRevenueChart';
import HourlyTrendsChart from './HourlyTrendCharts';

const SummaryDashboard = ({ hotelId, dateRange = 'today' }) => {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [staffRevenue, setStaffRevenue] = useState([]);
  const [hourlyTrends, setHourlyTrends] = useState([]);

  // Date filtering function
  const filterDataByDateRange = (data) => {
    const now = new Date();
    let startDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return data.filter(item => {
          const itemDate = new Date(item.createdat || item.date);
          return itemDate >= startDate && itemDate < endDate;
        });
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'lastMonth':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last6months':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return data.filter(item => {
      const itemDate = new Date(item.createdat || item.date);
      return itemDate >= startDate;
    });
  };

  // Process payment methods data from orders
  const processPaymentMethods = (orders) => {
    if (!orders || orders.length === 0) return [];
    
    const paymentCounts = {};
    orders.forEach(order => {
      const paymentType = order.paymentType || 'Unknown';
      paymentCounts[paymentType] = (paymentCounts[paymentType] || 0) + 1;
    });
    
    return Object.entries(paymentCounts).map(([method, count]) => ({
      method,
      count
    }));
  };

  // Process top products data from orders
  const processTopProducts = (orders) => {
    if (!orders || orders.length === 0) return [];
    
    const productCounts = {};
    orders.forEach(order => {
      let items;
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        return;
      }
      
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        const name = item.name || 'Unknown Item';
        if (!productCounts[name]) {
          productCounts[name] = { name, quantity: 0, revenue: 0 };
        }
        productCounts[name].quantity += item.quantity || 0;
        productCounts[name].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });
    
    return Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Process hourly trends from orders
  const processHourlyTrends = (orders) => {
    const hourlyData = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { hour, orders: 0, revenue: 0 };
    }
    
    if (!orders || orders.length === 0) {
      return Object.values(hourlyData);
    }
    
    orders.forEach(order => {
      const hour = new Date(order.createdat).getHours();
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += order.total || 0;
    });
    
    return Object.values(hourlyData);
  };

  // Process staff revenue from filtered orders
  // Process staff revenue from filtered orders
const processStaffRevenue = (orders) => {
  if (!orders || orders.length === 0) return [];
  
  const staffData = {};
  
  console.log("Processing orders for staff revenue:", orders.length, "orders");
  
  orders.forEach(order => {
    // Try to get staff info from different possible fields
    const staffId = order.staffId || order.staff?.id || order.userId || order.createdBy;
    const staffName = order.staff?.name || 
                     order.staffName || 
                     order.createdByName || 
                     `Staff ${(staffId || 'unknown').substring(0, 4)}`;
    
    console.log("Order staff info:", { 
      orderId: order.id, 
      staffId, 
      staffName,
      totalAmount: order.total || order.totalAmount || 0 
    });
    
    if (!staffId) {
      console.warn("Order missing staffId:", order.id);
      return;
    }
    
    if (!staffData[staffId]) {
      staffData[staffId] = {
        staffId,
        name: staffName,
        revenue: 0,
        orders: 0
      };
    }
    
    const orderAmount = order.total || order.totalAmount || order.amount || 0;
    staffData[staffId].revenue += orderAmount;
    staffData[staffId].orders += 1;
  });
  
  const result = Object.values(staffData);
  console.log("Processed staff revenue data:", result);
  
  return result;
};
  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all orders data to process locally based on date range
      const ordersRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bill/orders/${hotelId}`);

      // Filter orders by date range
      const filteredOrders = filterDataByDateRange(ordersRes.data);
      
      // Process filtered data for different charts
      const processedPaymentMethods = processPaymentMethods(filteredOrders);
      const processedTopProducts = processTopProducts(filteredOrders);
      const processedHourlyTrends = processHourlyTrends(filteredOrders);
      const processedStaffRevenue = processStaffRevenue(filteredOrders);

      setPaymentMethods(processedPaymentMethods);
      setTopProducts(processedTopProducts);
      setStaffRevenue(processedStaffRevenue);
      setHourlyTrends(processedHourlyTrends);
    } catch (err) {
      console.error("Error fetching analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) fetchAllAnalytics();
  }, [hotelId, dateRange]);

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last7days': return 'Last 7 Days';
      case 'lastMonth': return 'Last Month';
      case 'last6months': return 'Last 6 Months';
      default: return 'Today';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Visual Analytics</h3>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1">
            <span className="text-indigo-800 text-sm font-medium">
              📅 {getDateRangeLabel()}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`bg-gray-50 p-4 rounded-lg transition-all duration-500 ease-in-out transform ${loading ? 'opacity-60 scale-98' : 'opacity-100 scale-100 hover:shadow-md'} min-h-[320px]`}>
            <PaymentMethodChart data={paymentMethods} />
          </div>
          <div className={`bg-gray-50 p-4 rounded-lg transition-all duration-500 ease-in-out transform ${loading ? 'opacity-60 scale-98' : 'opacity-100 scale-100 hover:shadow-md'}`}>
            <TopProductsChart data={topProducts} />
          </div>
          <div className={`bg-gray-50 p-4 rounded-lg transition-all duration-500 ease-in-out transform ${loading ? 'opacity-60 scale-98' : 'opacity-100 scale-100 hover:shadow-md'}`}>
            <StaffRevenueChart data={staffRevenue} />
          </div>
          <div className={`bg-gray-50 p-4 rounded-lg transition-all duration-500 ease-in-out transform ${loading ? 'opacity-60 scale-98' : 'opacity-100 scale-100 hover:shadow-md'}`}>
            <HourlyTrendsChart data={hourlyTrends} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
