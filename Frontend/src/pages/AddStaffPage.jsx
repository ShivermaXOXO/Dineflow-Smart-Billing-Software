import React from 'react';
import { useParams } from 'react-router-dom';
import AddStaffForm from '../components/superAdmin/AddStaffForm';

const AddStaffPage = () => {
  const { hotelId } = useParams();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <AddStaffForm hotelId={hotelId} />
    </div>
  );
};

export default AddStaffPage;
