import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TopProductsChart = ({ data }) => (
  <div className="bg-white shadow rounded-lg p-4">
    <h3 className="text-lg font-semibold mb-3">🛍️ Top 5 Products</h3>
    {data.length === 0 ? (
      <p className="text-center text-gray-500">No data</p>
    ) : (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              name === 'quantity' ? `${value} units` : `₹${value.toFixed(2)}`,
              name === 'quantity' ? 'Quantity Sold' : 'Revenue Generated'
            ]}
          />
          <Bar dataKey="quantity" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);

export default TopProductsChart;
