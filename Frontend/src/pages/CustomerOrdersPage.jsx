// pages/CustomerOrdersPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import StaffCustomerOrders from '../components/staff/StaffCustomerOrders';

const CustomerOrdersPage = () => {
  const { hotelId } = useParams();
  const { auth } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Customer Orders Management
          </h1>
          <p className="text-xl opacity-90">
            View and manage live customer orders in real-time
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <StaffCustomerOrders hotelId={hotelId} staffId={auth.userId} />
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersPage;
