import React, { useMemo } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const PaymentMethodChart = ({ data }) => {

  // GROUP PAYMENT METHODS ✔
  const groupedData = data;
console.log("Grouped Data:", groupedData);
console.log("Actual data length:", data.length);
console.log(data);
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">📊 Payment Method Breakdown</h3>

      {groupedData.length === 0 ? (
        <p className="text-center text-gray-500">No payment data available</p>
      ) : (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={groupedData}
                dataKey="count"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {groupedData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} payments`, name]}
                contentStyle={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Custom Legend */}
          <div className="flex flex-wrap gap-2 justify-center">
            {groupedData.map((entry, index) => (
              <div
                key={entry.method}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full border hover:bg-gray-100 hover:shadow-sm transition-all duration-200"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>

                <span className="text-sm font-medium text-gray-700">
                  {entry.method}
                </span>

                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodChart;
