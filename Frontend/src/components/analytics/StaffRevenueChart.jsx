import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StaffRevenueChart = ({ data }) => {
  console.log("StaffRevenueChart data:", data);
  
  // Transform the data to match the expected format
  const chartData = Array.isArray(data) 
    ? data.map(item => ({
        name: item.name || 'Unknown Staff',
        revenue: item.revenue || 0,
        orders: item.orders || 0,
        staffId: item.staffId || 'unknown'
      }))
    : [];

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">👥 Staff Performance</h3>
      {chartData.length === 0 ? (
        <p className="text-center text-gray-500">No staff data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={value => `₹${value}`}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'revenue') return [`₹${value}`, 'Revenue'];
                return [value, name];
              }}
              labelFormatter={(label) => `Staff: ${label}`}
            />
            <Bar dataKey="revenue" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default StaffRevenueChart;