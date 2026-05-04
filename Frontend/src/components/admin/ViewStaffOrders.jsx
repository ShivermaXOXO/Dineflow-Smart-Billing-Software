import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosConfig';
import HotelOrdersList from '../superAdmin/HotelOrdersList';

const ViewStaffOrders = ({ hotelId, selectedDate, dateRange }) => {
 
  return (
   <>
   <HotelOrdersList hotelId={hotelId} selectedDate={selectedDate} dateRange={dateRange} />
   </>
  );
};

export default ViewStaffOrders;
