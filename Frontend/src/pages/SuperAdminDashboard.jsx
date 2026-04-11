import React, { useEffect, useState } from 'react';
import axios from 'axios';
import HotelList from '../components/superAdmin/HotelList';
import SummaryGraphs from '../components/superAdmin/SummaryGraphs';
import SummaryDashboard from '../components/analytics/SummaryDashboard';
import { useNavigate } from 'react-router-dom';
import { fetchAllHotels } from '../api/fetchHotels';

const SuperAdminDashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
    const navigate = useNavigate();

  const loadHotels = async () => {
    try {
      const data = await fetchAllHotels();
      if (data) {
        setHotels(data);
        if (data.length > 0) setSelectedHotelId(data[0].id); // default
      }
    } catch (err) {
      console.error("Failed to load hotels", err);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);
    useEffect(() => {
      const role = localStorage.getItem('role')
      if ( role !== 'superAdmin') {
        navigate('/');
      }
    }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 p-3 xs:p-4 sm:p-6">
      <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 xs:mb-4 sm:mb-6">Super Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
        <HotelList hotels={hotels} refreshHotels={loadHotels} />

        <div className="bg-white p-2 xs:p-3 sm:p-4 rounded shadow">
          <label className="block mb-1 xs:mb-2 text-gray-600 font-medium text-xs xs:text-sm sm:text-base">Select Hotel for Summary</label>
          <select
            className="w-full border px-2 xs:px-3 py-1 xs:py-2 rounded mb-3 xs:mb-4 text-xs xs:text-sm sm:text-base"
            value={selectedHotelId || ''}
            onChange={e => setSelectedHotelId(e.target.value)}
          >
            {hotels.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>

          {selectedHotelId && <SummaryGraphs hotelId={selectedHotelId} />}
        </div>
      </div>

      {/* Analytics Dashboard Section */}
      {selectedHotelId && (
        <div className="mt-4 xs:mt-6 sm:mt-10">
          <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold mb-2 xs:mb-3 sm:mb-4 text-gray-700">Detailed Analytics</h2>
          <SummaryDashboard hotelId={selectedHotelId} />
        </div>
      )}
    </div>

  );
};

export default SuperAdminDashboard;