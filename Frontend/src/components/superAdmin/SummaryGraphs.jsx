import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Spinner } from 'reactstrap';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const SummaryGraphs = ({ hotelId }) => {
  const [data, setData] = useState({ day: [], week: [], month: [] });
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [dayRes, weekRes, monthRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bill/report/${hotelId}?range=day`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bill/report/${hotelId}?range=week`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bill/report/${hotelId}?range=month`)
      ]);
      console.log(dayRes.data)

      setData({
        day: dayRes.data || [],
        week: weekRes.data || [],
        month: monthRes.data || []
      });
    } catch (err) {
      console.error("Error fetching summary data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) fetchSummary();
  }, [hotelId]);

  // Helper: aggregate totals
  const aggregate = (records) => {
    return records.reduce((acc, curr) => {
      acc.totalOrders += curr.totalOrders;
      acc.totalRevenue += curr.totalRevenue;
      return acc;
    }, { totalOrders: 0, totalRevenue: 0 });
  };

  const dayTotals = aggregate(data.day);
  const weekTotals = aggregate(data.week);
  const monthTotals = aggregate(data.month);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">📊 Hotel Summary - Hotel #{hotelId}</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h4 className="text-sm font-semibold">Total Orders Today</h4>
          <p className="text-xl">{dayTotals.totalOrders}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h4 className="text-sm font-semibold">Total Revenue Today</h4>
          <p className="text-xl">₹{dayTotals.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h4 className="text-sm font-semibold">Total Orders This Week</h4>
          <p className="text-xl">{weekTotals.totalOrders}</p>
        </div>
      </div>

      {/* Daily Orders - LineChart */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-600">Daily Orders (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.week}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [`${value} Orders`]} />
            <Legend />
            <Line type="monotone" dataKey="totalOrders" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Revenue - BarChart */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-600">Revenue (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.week}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`]} />
            <Legend />
            <Bar dataKey="totalRevenue" fill="#82ca9d" barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Summary - PieChart */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-600">Monthly Totals</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={[
                { name: 'Total Orders', value: monthTotals.totalOrders },
                { name: 'Total Revenue', value: monthTotals.totalRevenue }
              ]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {[0, 1].map(i => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SummaryGraphs;
