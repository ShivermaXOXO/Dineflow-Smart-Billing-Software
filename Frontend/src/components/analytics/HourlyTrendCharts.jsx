import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HourlyTrendsChart = ({ data }) => (
  <div className="bg-white shadow rounded-lg p-4">
    <h3 className="text-lg font-semibold mb-3">⏱️ Hourly Trends</h3>
    {data.length === 0 ? (
      <p className="text-center text-gray-500">No data</p>
    ) : (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="hour" 
            tickFormatter={(hour) => `${hour}:00`}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(hour) => `Time: ${hour}:00`}
            formatter={(value, name) => [
              name === 'orders' ? `${value} orders` : `₹${value.toFixed(2)}`,
              name === 'orders' ? 'Orders' : 'Revenue'
            ]}
          />
          <Legend />
          <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="revenue" stroke="#ffc658" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    )}
  </div>
);

export default HourlyTrendsChart;
