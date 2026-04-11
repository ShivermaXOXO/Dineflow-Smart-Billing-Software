import React from 'react';
import { useParams } from 'react-router-dom';
import HotelStaffList from '../components/superAdmin/HotelStaffList';

const SuperAdminStaffPage = () => {
  const { hotelId } = useParams();
  console.log(hotelId)

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <HotelStaffList hotelId={hotelId} />
    </div>
  );
};

export default SuperAdminStaffPage;
