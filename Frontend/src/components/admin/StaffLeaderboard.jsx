import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StaffLeaderboards = ({ hotelId }) => {
  const [data, setData] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bill/staff-revenue/${hotelId}`);
      setData(res.data);
    } catch (err) {
      console.error("Error loading leaderboard", err);
    }
  };

  useEffect(() => {
    if (hotelId) fetchStats();
  }, [hotelId]);

  const totalRevenue = data.reduce((acc, staff) => acc + staff.revenue, 0);
  const totalOrders = data.reduce((acc, staff) => acc + staff.orders, 0);
  const avgRevenue = data.length ? totalRevenue / data.length : 0;
  const avgOrders = data.length ? totalOrders / data.length : 0;

  const topRevenue = [...data].sort((a, b) => b.revenue - a.revenue);
  const topCustomers = [...data].sort((a, b) => b.orders - a.orders);

  const getPercentage = (value, average) => {
    const diff = ((value - average) / average) * 100;
    return isFinite(diff) ? diff.toFixed(1) : '0.0';
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Revenue Leaderboard */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">🏆 Revenue by Staff</h2>
        <ul className="space-y-3">
          {topRevenue.map((staff, index) => {
            const diff = getPercentage(staff.revenue, avgRevenue);
            const isAbove = parseFloat(diff) >= 0;
            return (
              <li
                key={staff.staffId}
                className={`p-3 rounded shadow-sm flex flex-col space-y-1 ${
                  index === 0 ? 'bg-green-100 font-bold border-l-4 border-green-500' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between">
                  <span>{index + 1}. {staff.name}</span>
                  <span>₹{staff.revenue.toFixed(2)}</span>
                </div>
                <span className={`text-sm ${isAbove ? 'text-green-600' : 'text-red-600'}`}>
                  {isAbove ? '+' : ''}{diff}% vs avg (₹{avgRevenue.toFixed(2)})
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Customer Leaderboard */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">👥 Customers Targeted</h2>
        <ul className="space-y-3">
          {topCustomers.map((staff, index) => {
            const diff = getPercentage(staff.orders, avgOrders);
            const isAbove = parseFloat(diff) >= 0;
            return (
              <li
                key={staff.staffId}
                className={`p-3 rounded shadow-sm flex flex-col space-y-1 ${
                  index === 0 ? 'bg-blue-100 font-bold border-l-4 border-blue-500' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between">
                  <span>{index + 1}. {staff.name}</span>
                  <span>{staff.orders} Orders</span>
                </div>
                <span className={`text-sm ${isAbove ? 'text-green-600' : 'text-red-600'}`}>
                  {isAbove ? '+' : ''}{diff}% vs avg ({avgOrders.toFixed(1)} orders)
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default StaffLeaderboards;
