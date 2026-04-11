import React from 'react';
import { useParams } from 'react-router-dom';
import HotelOrdersList from '../components/superAdmin/HotelOrdersList';

const SuperAdminOrdersPage = () => {
  const { hotelId } = useParams();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <HotelOrdersList hotelId={hotelId} />
    </div>
  );
};

export default SuperAdminOrdersPage;
